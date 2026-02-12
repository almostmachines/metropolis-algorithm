import type { AlgorithmState, AlgorithmAction, SampleRecord } from './types';
import type { AlgorithmConfig, Params } from '../types';
import { generateData } from '../engine/data-generator';
import { propose, acceptanceProbability, logAcceptanceRatio, step } from '../engine/metropolis';
import { logPosterior } from '../engine/model';
import { sanitizeAlgorithmConfig } from '../config/sanitize';

export function createInitialState(config: AlgorithmConfig): AlgorithmState {
  const sanitizedConfig = sanitizeAlgorithmConfig(config);
  const data = generateData(
    sanitizedConfig.trueParams,
    sanitizedConfig.knownSigma,
    sanitizedConfig.observationCount,
  );
  return {
    phase: 'IDLE',
    config: sanitizedConfig,
    data,
    currentParams: { ...sanitizedConfig.initialParams },
    proposedParams: null,
    stepResult: null,
    burnInSamples: [],
    acceptedSamples: [],
    totalSteps: 0,
    acceptedCount: 0,
    statusMessage: 'Click "Next Step" to begin exploring the posterior.',
    statusType: 'info',
  };
}

function totalCollected(state: AlgorithmState): number {
  return state.burnInSamples.length + state.acceptedSamples.length;
}

function isInBurnIn(state: AlgorithmState): boolean {
  return state.burnInSamples.length < state.config.burnInSamples;
}

function targetTotal(state: AlgorithmState): number {
  return state.config.burnInSamples + state.config.totalSamples;
}

function addSample(state: AlgorithmState, params: Params): { burnInSamples: SampleRecord[]; acceptedSamples: SampleRecord[] } {
  const record: SampleRecord = { params: { ...params }, isBurnIn: isInBurnIn(state) };
  if (record.isBurnIn) {
    return {
      burnInSamples: [...state.burnInSamples, record],
      acceptedSamples: state.acceptedSamples,
    };
  }
  return {
    burnInSamples: state.burnInSamples,
    acceptedSamples: [...state.acceptedSamples, record],
  };
}

export function algorithmReducer(
  state: AlgorithmState,
  action: AlgorithmAction,
): AlgorithmState {
  switch (action.type) {
    case 'RESET': {
      return createInitialState(action.config);
    }

    case 'NEXT_STEP': {
      if (state.phase !== 'IDLE' && state.phase !== 'RESULT_SHOWN') return state;
      if (totalCollected(state) >= targetTotal(state)) {
        return { ...state, phase: 'COMPLETED', statusMessage: 'Sampling complete!', statusType: 'success' };
      }

      const proposed = propose(state.currentParams, state.config.proposalWidths);
      const lpCurrent = logPosterior(
        state.currentParams,
        state.data,
        state.config.knownSigma,
        state.config.priorMuMeans,
        state.config.priorMuStds,
      );
      const lpProposed = logPosterior(
        proposed,
        state.data,
        state.config.knownSigma,
        state.config.priorMuMeans,
        state.config.priorMuStds,
      );
      const logRatio = logAcceptanceRatio(lpCurrent, lpProposed);
      const alpha = acceptanceProbability(lpCurrent, lpProposed);

      const outOfSupportTau = proposed.tau < 0 || proposed.tau > 24;
      let msg: string;
      if (outOfSupportTau) {
        msg = `Proposed τ = ${proposed.tau.toFixed(2)}h is outside [0, 24]. Will be auto-rejected.`;
      } else if (alpha >= 1) {
        msg = 'Acceptance probability = 100%. Proposed state is at least as plausible as current.';
      } else {
        msg = `Acceptance probability = ${(alpha * 100).toFixed(1)}%. Log ratio = ${logRatio.toFixed(3)}.`;
      }

      return {
        ...state,
        phase: 'PROPOSAL_SHOWN',
        proposedParams: proposed,
        stepResult: {
          proposed,
          logPosteriorCurrent: lpCurrent,
          logPosteriorProposed: lpProposed,
          logRatio,
          acceptanceProbability: alpha,
          accepted: false,
          randomDraw: 0,
          newParams: state.currentParams,
        },
        statusMessage: msg,
        statusType: outOfSupportTau ? 'warning' : 'info',
      };
    }

    case 'ACCEPT': {
      if (state.phase !== 'PROPOSAL_SHOWN' || !state.stepResult) return state;

      const alpha = state.stepResult.acceptanceProbability;
      const u = Math.random();
      const accepted = u < alpha;
      const newParams = accepted ? state.stepResult.proposed : state.currentParams;

      const isBurn = isInBurnIn(state);
      const samples = addSample(state, newParams);
      const newTotal = samples.burnInSamples.length + samples.acceptedSamples.length;
      const completed = newTotal >= targetTotal(state);

      const stepResult = {
        ...state.stepResult,
        accepted,
        randomDraw: u,
        newParams,
      };

      let msg: string;
      let msgType: 'success' | 'error';
      if (accepted) {
        msg = `Accepted! (drew ${u.toFixed(3)} < ${alpha.toFixed(3)})`;
        msgType = 'success';
      } else {
        msg = `Rejected. (drew ${u.toFixed(3)} >= ${alpha.toFixed(3)})`;
        msgType = 'error';
      }

      return {
        ...state,
        phase: completed ? 'COMPLETED' : 'RESULT_SHOWN',
        currentParams: newParams,
        proposedParams: null,
        stepResult,
        ...samples,
        totalSteps: state.totalSteps + (isBurn ? 0 : 1),
        acceptedCount: state.acceptedCount + (!isBurn && accepted ? 1 : 0),
        statusMessage: completed ? 'Sampling complete! ' + msg : msg,
        statusType: completed ? 'success' : msgType,
      };
    }

    case 'START_AUTO': {
      if (totalCollected(state) >= targetTotal(state)) {
        return { ...state, phase: 'COMPLETED', statusMessage: 'Sampling complete!', statusType: 'success' };
      }
      return {
        ...state,
        phase: 'AUTO_RUNNING',
        proposedParams: null,
        stepResult: null,
        statusMessage: 'Auto-running...',
        statusType: 'info',
      };
    }

    case 'STOP_AUTO': {
      return {
        ...state,
        phase: 'RESULT_SHOWN',
        statusMessage: `Paused after ${totalCollected(state)} samples.`,
        statusType: 'info',
      };
    }

    case 'AUTO_STEP': {
      if (state.phase !== 'AUTO_RUNNING') return state;

      let current = state.currentParams;
      let burnIn = state.burnInSamples;
      let accepted = state.acceptedSamples;
      let totalSteps = state.totalSteps;
      let acceptedCount = state.acceptedCount;
      const target = targetTotal(state);
      const batchSize = 5;

      for (let i = 0; i < batchSize; i++) {
        if (burnIn.length + accepted.length >= target) break;

        const result = step(
          current,
          state.data,
          state.config.proposalWidths,
          state.config.knownSigma,
          state.config.priorMuMeans,
          state.config.priorMuStds,
        );
        current = result.newParams;

        const isBurn = burnIn.length < state.config.burnInSamples;
        if (!isBurn) {
          totalSteps++;
          if (result.accepted) acceptedCount++;
        }
        const record: SampleRecord = { params: { ...current }, isBurnIn: isBurn };
        if (isBurn) {
          burnIn = [...burnIn, record];
        } else {
          accepted = [...accepted, record];
        }
      }

      const total = burnIn.length + accepted.length;
      const completed = total >= target;
      const rate = totalSteps > 0 ? ((acceptedCount / totalSteps) * 100).toFixed(1) : '0';
      const stillBurning = burnIn.length < state.config.burnInSamples;

      let statusMessage: string;
      if (completed) {
        statusMessage = `Sampling complete! Acceptance rate: ${rate}%`;
      } else if (stillBurning) {
        statusMessage = `Auto-running... ${burnIn.length}/${state.config.burnInSamples} burn-in steps`;
      } else {
        statusMessage = `Auto-running... ${accepted.length}/${state.config.totalSamples} samples (${rate}% accepted)`;
      }

      return {
        ...state,
        phase: completed ? 'COMPLETED' : 'AUTO_RUNNING',
        currentParams: current,
        proposedParams: null,
        stepResult: null,
        burnInSamples: burnIn,
        acceptedSamples: accepted,
        totalSteps,
        acceptedCount,
        statusMessage,
        statusType: completed ? 'success' : 'info',
      };
    }

    default:
      return state;
  }
}
