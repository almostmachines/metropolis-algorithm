import { DEFAULT_CONFIG, type AlgorithmConfig, type Params } from '../types';

const MIN_KNOWN_SIGMA = 0.01;
const MIN_PROPOSAL_WIDTH = 0.01;
const MIN_PRIOR_STD = 0.01;
const DAY_START = 0;
const DAY_END = 24;

function finiteNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function boundedInteger(value: number, fallback: number, min: number): number {
  const finite = finiteNumber(value, fallback);
  return Math.max(min, Math.round(finite));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeParams(params: Params, fallback: Params): Params {
  return {
    tau: clamp(finiteNumber(params.tau, fallback.tau), DAY_START, DAY_END),
    mu1: finiteNumber(params.mu1, fallback.mu1),
    mu2: finiteNumber(params.mu2, fallback.mu2),
  };
}

function sanitizePriorMuMeans(
  means: AlgorithmConfig['priorMuMeans'] | undefined,
  fallback: AlgorithmConfig['priorMuMeans'],
): AlgorithmConfig['priorMuMeans'] {
  const source = means ?? fallback;
  return {
    mu1: finiteNumber(source.mu1, fallback.mu1),
    mu2: finiteNumber(source.mu2, fallback.mu2),
  };
}

function sanitizePriorMuStds(
  stds: AlgorithmConfig['priorMuStds'] | undefined,
  fallback: AlgorithmConfig['priorMuStds'],
): AlgorithmConfig['priorMuStds'] {
  const source = stds ?? fallback;
  return {
    mu1: Math.max(MIN_PRIOR_STD, finiteNumber(source.mu1, fallback.mu1)),
    mu2: Math.max(MIN_PRIOR_STD, finiteNumber(source.mu2, fallback.mu2)),
  };
}

function sanitizeProposalWidths(params: Params | undefined, fallback: Params): Params {
  const widths = params ?? fallback;
  return {
    tau: Math.max(
      MIN_PROPOSAL_WIDTH,
      finiteNumber(widths.tau, fallback.tau),
    ),
    mu1: Math.max(
      MIN_PROPOSAL_WIDTH,
      finiteNumber(widths.mu1, fallback.mu1),
    ),
    mu2: Math.max(
      MIN_PROPOSAL_WIDTH,
      finiteNumber(widths.mu2, fallback.mu2),
    ),
  };
}

export function sanitizeAlgorithmConfig(config: AlgorithmConfig): AlgorithmConfig {
  return {
    totalSamples: boundedInteger(config.totalSamples, DEFAULT_CONFIG.totalSamples, 1),
    burnInSamples: boundedInteger(config.burnInSamples, DEFAULT_CONFIG.burnInSamples, 0),
    observationCount: boundedInteger(config.observationCount, DEFAULT_CONFIG.observationCount, 1),
    knownSigma: Math.max(
      MIN_KNOWN_SIGMA,
      finiteNumber(config.knownSigma, DEFAULT_CONFIG.knownSigma),
    ),
    trueParams: sanitizeParams(config.trueParams, DEFAULT_CONFIG.trueParams),
    priorMuMeans: sanitizePriorMuMeans(
      config.priorMuMeans,
      DEFAULT_CONFIG.priorMuMeans,
    ),
    priorMuStds: sanitizePriorMuStds(
      config.priorMuStds,
      DEFAULT_CONFIG.priorMuStds,
    ),
    initialParams: sanitizeParams(config.initialParams, DEFAULT_CONFIG.initialParams),
    proposalWidths: sanitizeProposalWidths(
      config.proposalWidths,
      DEFAULT_CONFIG.proposalWidths,
    ),
  };
}
