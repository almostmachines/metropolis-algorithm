import type { AlgorithmState } from '../state/types';
import type { Params } from '../types';

export interface ParameterBounds {
  tau: [number, number];
  mu1: [number, number];
  mu2: [number, number];
}

/** Compute axis bounds from all sample points, true mode, and current position. */
export function computeBounds(state: AlgorithmState): ParameterBounds {
  const allParams: Params[] = [
    state.config.trueParams,
    state.currentParams,
    ...state.burnInSamples.map((s) => s.params),
    ...state.acceptedSamples.map((s) => s.params),
  ];
  if (state.proposedParams) allParams.push(state.proposedParams);

  const pad = 0.5;
  let minTau = Infinity;
  let maxTau = -Infinity;
  let minMu1 = Infinity;
  let maxMu1 = -Infinity;
  let minMu2 = Infinity;
  let maxMu2 = -Infinity;

  for (const p of allParams) {
    if (p.tau < minTau) minTau = p.tau;
    if (p.tau > maxTau) maxTau = p.tau;
    if (p.mu1 < minMu1) minMu1 = p.mu1;
    if (p.mu1 > maxMu1) maxMu1 = p.mu1;
    if (p.mu2 < minMu2) minMu2 = p.mu2;
    if (p.mu2 > maxMu2) maxMu2 = p.mu2;
  }

  return {
    tau: [Math.max(0, minTau - pad), Math.min(24, maxTau + pad)],
    mu1: [minMu1 - pad, maxMu1 + pad],
    mu2: [minMu2 - pad, maxMu2 + pad],
  };
}

/** Normalize a parameter value to 0..10 range given bounds. */
export function normalize(value: number, bounds: [number, number]): number {
  const range = bounds[1] - bounds[0];
  if (range === 0) return 5;
  return ((value - bounds[0]) / range) * 10;
}

export function paramsToPosition(
  params: Params,
  bounds: ParameterBounds,
): [number, number, number] {
  return [
    normalize(params.tau, bounds.tau),
    normalize(params.mu1, bounds.mu1),
    normalize(params.mu2, bounds.mu2),
  ];
}
