import type {
  DataPoint,
  Params,
  PriorMuMeans,
  PriorMuStds,
} from '../types';
import { randomNormal } from './random';
import { logPosterior } from './model';

export interface StepResult {
  proposed: Params;
  logPosteriorCurrent: number;
  logPosteriorProposed: number;
  logRatio: number;
  acceptanceProbability: number;
  accepted: boolean;
  randomDraw: number;
  newParams: Params;
}

/** Propose new parameters by adding symmetric normal perturbation */
export function propose(current: Params, widths: Params): Params {
  return {
    tau: randomNormal(current.tau, widths.tau),
    mu1: randomNormal(current.mu1, widths.mu1),
    mu2: randomNormal(current.mu2, widths.mu2),
  };
}

/** Compute a robust log acceptance ratio, including degenerate infinite cases. */
export function logAcceptanceRatio(
  logPosteriorCurrent: number,
  logPosteriorProposed: number,
): number {
  const logRatio = logPosteriorProposed - logPosteriorCurrent;
  if (!Number.isNaN(logRatio)) return logRatio;

  // Treat impossible vs impossible as a reject to avoid undefined 0/0 behavior.
  if (logPosteriorCurrent === -Infinity && logPosteriorProposed === -Infinity) {
    return -Infinity;
  }
  if (logPosteriorCurrent === logPosteriorProposed) {
    return 0;
  }
  return logPosteriorProposed > logPosteriorCurrent ? Infinity : -Infinity;
}

/** Compute acceptance probability */
export function acceptanceProbability(
  logPosteriorCurrent: number,
  logPosteriorProposed: number,
): number {
  const logRatio = logAcceptanceRatio(logPosteriorCurrent, logPosteriorProposed);
  if (logRatio >= 0) return 1;
  if (logRatio === -Infinity) return 0;
  const alpha = Math.exp(logRatio);
  return Number.isFinite(alpha) ? Math.min(1, alpha) : 0;
}

/** Run one complete Metropolis algorithm step */
export function step(
  current: Params,
  data: DataPoint[],
  widths: Params,
  knownSigma: number,
  priorMuMeans: PriorMuMeans,
  priorMuStds: PriorMuStds,
): StepResult {
  const proposed = propose(current, widths);
  const lpCurrent = logPosterior(
    current,
    data,
    knownSigma,
    priorMuMeans,
    priorMuStds,
  );
  const lpProposed = logPosterior(
    proposed,
    data,
    knownSigma,
    priorMuMeans,
    priorMuStds,
  );
  const logRatio = logAcceptanceRatio(lpCurrent, lpProposed);
  const alpha = acceptanceProbability(lpCurrent, lpProposed);
  const u = Math.random();
  const accepted = u < alpha;

  return {
    proposed,
    logPosteriorCurrent: lpCurrent,
    logPosteriorProposed: lpProposed,
    logRatio,
    acceptanceProbability: alpha,
    accepted,
    randomDraw: u,
    newParams: accepted ? proposed : current,
  };
}
