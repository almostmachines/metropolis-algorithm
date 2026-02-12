const test = require('node:test');
const assert = require('node:assert/strict');

const {
  acceptanceProbability,
  logAcceptanceRatio,
} = require('./.tmp/metropolis.cjs');
const {
  createInitialState,
  algorithmReducer,
} = require('./.tmp/algorithm-state.cjs');
const { sanitizeAlgorithmConfig } = require('./.tmp/sanitize.cjs');

function makeConfig(overrides = {}) {
  return {
    totalSamples: 10,
    burnInSamples: 0,
    observationCount: 10,
    knownSigma: 0.9,
    trueParams: { tau: 14.5, mu1: 12.3, mu2: 13.2 },
    priorMuMeans: { mu1: 15, mu2: 15 },
    priorMuStds: { mu1: 5, mu2: 5 },
    initialParams: { tau: 12, mu1: 12, mu2: 13 },
    proposalWidths: { tau: 0.1, mu1: 0.2, mu2: 0.2 },
    ...overrides,
  };
}

test('acceptanceProbability handles degenerate infinite inputs', () => {
  assert.equal(acceptanceProbability(-Infinity, -Infinity), 0);
  assert.equal(acceptanceProbability(-Infinity, 0), 1);
  assert.equal(acceptanceProbability(0, -Infinity), 0);
});

test('logAcceptanceRatio does not return NaN for impossible/impossible state', () => {
  const ratio = logAcceptanceRatio(-Infinity, -Infinity);
  assert.equal(ratio, -Infinity);
  assert.equal(Number.isNaN(ratio), false);
});

test('sanitizeAlgorithmConfig clamps and rounds invalid numeric values', () => {
  const dirty = makeConfig({
    totalSamples: 0.2,
    burnInSamples: -7.8,
    observationCount: Number.NaN,
    knownSigma: -3,
    trueParams: {
      tau: Number.POSITIVE_INFINITY,
      mu1: Number.NaN,
      mu2: Number.POSITIVE_INFINITY,
    },
    priorMuMeans: { mu1: Number.NaN, mu2: Number.POSITIVE_INFINITY },
    priorMuStds: { mu1: 0, mu2: Number.NaN },
    initialParams: { tau: -7, mu1: Number.NaN, mu2: 22 },
    proposalWidths: { tau: 0, mu1: Number.NaN, mu2: -1 },
  });

  const clean = sanitizeAlgorithmConfig(dirty);

  assert.equal(clean.totalSamples, 1);
  assert.equal(clean.burnInSamples, 0);
  assert.equal(clean.observationCount, 300);
  assert.equal(clean.knownSigma, 0.01);
  assert.equal(clean.trueParams.tau, 14.5);
  assert.equal(clean.trueParams.mu1, 12.3);
  assert.equal(clean.trueParams.mu2, 13.2);
  assert.equal(clean.priorMuMeans.mu1, 15);
  assert.equal(clean.priorMuMeans.mu2, 15);
  assert.equal(clean.priorMuStds.mu1, 0.01);
  assert.equal(clean.priorMuStds.mu2, 5);
  assert.equal(clean.initialParams.tau, 0);
  assert.equal(clean.initialParams.mu1, 12);
  assert.equal(clean.initialParams.mu2, 22);
  assert.equal(clean.proposalWidths.tau, 0.01);
  assert.equal(clean.proposalWidths.mu1, 0.2);
  assert.equal(clean.proposalWidths.mu2, 0.01);
});

test('createInitialState applies sanitization before generating data', () => {
  const state = createInitialState(
    makeConfig({
      observationCount: -10,
      knownSigma: 0,
      initialParams: { tau: 30, mu1: 11, mu2: 14 },
    }),
  );

  assert.equal(state.config.observationCount, 1);
  assert.equal(state.config.knownSigma, 0.01);
  assert.equal(state.config.initialParams.tau, 24);
  assert.equal(state.currentParams.tau, 24);
  assert.equal(state.data.length, 1);
  assert.equal(Number.isFinite(state.data[0].time), true);
  assert.equal(Number.isFinite(state.data[0].value), true);
});

test('NEXT_STEP uses configured prior belief means', () => {
  const state = createInitialState(makeConfig());
  const current = { tau: 12, mu1: 6, mu2: 8 };
  const base = {
    ...state,
    currentParams: current,
    data: [],
    config: {
      ...state.config,
      proposalWidths: { tau: 0, mu1: 0, mu2: 0 },
    },
  };

  const nearPrior = algorithmReducer(
    {
      ...base,
      config: { ...base.config, priorMuMeans: { mu1: 6, mu2: 8 } },
    },
    { type: 'NEXT_STEP' },
  );
  const farPrior = algorithmReducer(
    {
      ...base,
      config: { ...base.config, priorMuMeans: { mu1: 0, mu2: 0 } },
    },
    { type: 'NEXT_STEP' },
  );

  assert.ok(nearPrior.stepResult);
  assert.ok(farPrior.stepResult);
  assert.ok(
    nearPrior.stepResult.logPosteriorCurrent >
      farPrior.stepResult.logPosteriorCurrent,
  );
});

test('NEXT_STEP uses configured prior belief standard deviations', () => {
  const state = createInitialState(makeConfig());
  const current = { tau: 12, mu1: 6, mu2: 8 };
  const base = {
    ...state,
    currentParams: current,
    data: [],
    config: {
      ...state.config,
      priorMuMeans: { mu1: 0, mu2: 0 },
      proposalWidths: { tau: 0, mu1: 0, mu2: 0 },
    },
  };

  const widePriorStd = algorithmReducer(
    {
      ...base,
      config: {
        ...base.config,
        priorMuStds: { mu1: 100, mu2: 100 },
      },
    },
    { type: 'NEXT_STEP' },
  );
  const narrowPriorStd = algorithmReducer(
    {
      ...base,
      config: {
        ...base.config,
        priorMuStds: { mu1: 0.1, mu2: 0.1 },
      },
    },
    { type: 'NEXT_STEP' },
  );

  assert.ok(widePriorStd.stepResult);
  assert.ok(narrowPriorStd.stepResult);
  assert.ok(
    widePriorStd.stepResult.logPosteriorCurrent >
      narrowPriorStd.stepResult.logPosteriorCurrent,
  );
});

test('NEXT_STEP keeps diagnostics numeric when both posteriors are impossible', () => {
  const state = createInitialState(makeConfig());
  const poisoned = {
    ...state,
    currentParams: { ...state.currentParams, tau: -1 },
    config: {
      ...state.config,
      proposalWidths: { tau: 0, mu1: 0, mu2: 0 },
    },
  };

  const next = algorithmReducer(poisoned, { type: 'NEXT_STEP' });
  assert.ok(next.stepResult);
  assert.equal(next.stepResult.acceptanceProbability, 0);
  assert.equal(next.stepResult.logRatio, -Infinity);
  assert.equal(Number.isNaN(next.stepResult.logRatio), false);
  assert.equal(next.statusMessage.includes('NaN'), false);
});

test('NEXT_STEP treats tau bounds as valid prior support', () => {
  const state = createInitialState(
    makeConfig({
      initialParams: { tau: 0, mu1: 12, mu2: 13 },
    }),
  );

  const next = algorithmReducer(
    {
      ...state,
      data: [],
      config: {
        ...state.config,
        proposalWidths: { tau: 0, mu1: 0, mu2: 0 },
      },
    },
    { type: 'NEXT_STEP' },
  );

  assert.ok(next.stepResult);
  assert.equal(Number.isFinite(next.stepResult.logPosteriorCurrent), true);
  assert.equal(
    next.stepResult.logPosteriorCurrent,
    next.stepResult.logPosteriorProposed,
  );
});
