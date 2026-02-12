import { useMemo } from 'react';
import { DEFAULT_CONFIG, type AlgorithmConfig } from '../types';
import type { AlgorithmState } from '../state/types';
import { StepControls } from './StepControls';
import { ParameterInputs } from './ParameterInputs';
import { ResultsDisplay } from './ResultsDisplay';
import { StatusDisplay } from './StatusDisplay';
import { ProgressBar } from './ProgressBar';

interface ControlPanelProps {
  state: AlgorithmState;
  config: AlgorithmConfig;
  onConfigChange: (config: AlgorithmConfig) => void;
  onNextStep: () => void;
  onAccept: () => void;
  onStartAuto: () => void;
  onStopAuto: () => void;
  onReset: () => void;
}

export function ControlPanel({
  state,
  config,
  onConfigChange,
  onNextStep,
  onAccept,
  onStartAuto,
  onStopAuto,
  onReset,
}: ControlPanelProps) {
  const notIdle = state.phase !== 'IDLE';
  const acceptanceRate =
    state.totalSteps > 0
      ? (state.acceptedCount / state.totalSteps) * 100
      : 0;

  const estimates = useMemo(() => {
    const samples = state.acceptedSamples;
    if (samples.length < 2) return null;
    const n = samples.length;
    const mean = { tau: 0, mu1: 0, mu2: 0 };
    for (const s of samples) {
      mean.tau += s.params.tau;
      mean.mu1 += s.params.mu1;
      mean.mu2 += s.params.mu2;
    }
    mean.tau /= n;
    mean.mu1 /= n;
    mean.mu2 /= n;

    const percentile = (sorted: number[], p: number) => {
      const idx = (p / 100) * (sorted.length - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return sorted[lo];
      return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
    };

    const tauVals = samples.map((s) => s.params.tau).sort((a, b) => a - b);
    const mu1Vals = samples.map((s) => s.params.mu1).sort((a, b) => a - b);
    const mu2Vals = samples.map((s) => s.params.mu2).sort((a, b) => a - b);
    const effectVals = samples
      .map((s) => s.params.mu2 - s.params.mu1)
      .sort((a, b) => a - b);

    const probAfternoon = samples.filter((s) => s.params.tau > 12).length / n;
    const prob2To4 =
      samples.filter((s) => s.params.tau > 14 && s.params.tau < 16).length / n;

    const ci95 = {
      tau: [percentile(tauVals, 2.5), percentile(tauVals, 97.5)] as [number, number],
      mu1: [percentile(mu1Vals, 2.5), percentile(mu1Vals, 97.5)] as [number, number],
      mu2: [percentile(mu2Vals, 2.5), percentile(mu2Vals, 97.5)] as [number, number],
      effectSize: [
        percentile(effectVals, 2.5),
        percentile(effectVals, 97.5),
      ] as [number, number],
    };

    return {
      mean,
      ci95,
      effectSizeMean: mean.mu2 - mean.mu1,
      probabilityAfternoon: probAfternoon,
      probability2To4: prob2To4,
    };
  }, [state.acceptedSamples]);

  return (
    <div className="w-full md:w-[420px] shrink-0 bg-slate-800/50 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col overflow-y-auto">
      <div className="p-4 space-y-4">
        <StepControls
          phase={state.phase}
          acceptanceProbability={
            state.stepResult?.acceptanceProbability ?? null
          }
          onNextStep={onNextStep}
          onAccept={onAccept}
          onStartAuto={onStartAuto}
          onStopAuto={onStopAuto}
          onReset={onReset}
        />

        <ProgressBar
          burnInCurrent={state.burnInSamples.length}
          burnInTotal={state.config.burnInSamples}
          samplesCurrent={state.acceptedSamples.length}
          samplesTotal={state.config.totalSamples}
        />

        <StatusDisplay
          message={state.statusMessage}
          type={state.statusType}
          acceptanceRate={acceptanceRate}
          totalSteps={state.totalSteps}
        />

        {state.stepResult && state.phase === 'PROPOSAL_SHOWN' && (
          <div className="bg-slate-900/50 rounded-lg p-3 text-xs space-y-1">
            <div className="text-slate-500 font-semibold uppercase tracking-wider mb-1">
              Proposal Details
            </div>
            <div className="text-slate-400">
              τ: {state.currentParams.tau.toFixed(3)}h →{' '}
              <span className="text-white">
                {state.stepResult.proposed.tau.toFixed(3)}h
              </span>
            </div>
            <div className="text-slate-400">
              μ₁: {state.currentParams.mu1.toFixed(3)} →{' '}
              <span className="text-white">
                {state.stepResult.proposed.mu1.toFixed(3)}
              </span>
            </div>
            <div className="text-slate-400">
              μ₂: {state.currentParams.mu2.toFixed(3)} →{' '}
              <span className="text-white">
                {state.stepResult.proposed.mu2.toFixed(3)}
              </span>
            </div>
            <div className="border-t border-slate-700 mt-2 pt-2 text-slate-400">
              Log posterior: {state.stepResult.logPosteriorCurrent.toFixed(2)} →{' '}
              {state.stepResult.logPosteriorProposed.toFixed(2)}
            </div>
            <div className="text-slate-400">
              Log ratio: {state.stepResult.logRatio.toFixed(4)}
            </div>
          </div>
        )}

        {estimates && (
          <ResultsDisplay
            estimates={estimates}
            data={state.data}
            trueParams={state.config.trueParams}
            knownSigma={state.config.knownSigma}
          />
        )}

        <div className="border-t border-slate-700 pt-3">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-300">
              Settings
            </h2>
            <button
              onClick={() => onConfigChange(DEFAULT_CONFIG)}
              disabled={notIdle}
              className="text-xs text-slate-500 hover:text-slate-300 border border-slate-600 rounded px-1.5 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Reset settings to defaults"
            >
              Reset
            </button>
          </div>
          <ParameterInputs
            config={config}
            onChange={onConfigChange}
            disabled={notIdle}
          />
        </div>
      </div>
    </div>
  );
}
