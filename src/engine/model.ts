import type {
  DataPoint,
  Params,
  PriorMuMeans,
  PriorMuStds,
} from '../types';

const LOG_2PI = Math.log(2 * Math.PI);
const DAY_START = 0;
const DAY_END = 24;

/** Log of the normal PDF */
function logNormalPdf(x: number, mean: number, std: number): number {
  const z = (x - mean) / std;
  return -0.5 * (LOG_2PI + 2 * Math.log(std) + z * z);
}

/** Log-likelihood under change-point model with known observation sigma */
export function logLikelihood(
  params: Params,
  data: DataPoint[],
  knownSigma: number,
): number {
  if (knownSigma <= 0) return -Infinity;

  let ll = 0;
  for (const { time, value } of data) {
    const mean = time < params.tau ? params.mu1 : params.mu2;
    ll += logNormalPdf(value, mean, knownSigma);
  }
  return ll;
}

/** Log-prior: τ uniform on [0,24], μ₁ and μ₂ normal around configurable means/stds */
export function logPrior(
  params: Params,
  priorMuMeans: PriorMuMeans,
  priorMuStds: PriorMuStds,
): number {
  if (params.tau < DAY_START || params.tau > DAY_END) {
    return -Infinity;
  }
  if (priorMuStds.mu1 <= 0 || priorMuStds.mu2 <= 0) return -Infinity;

  const lpTau = -Math.log(DAY_END - DAY_START);
  const lpMu1 = logNormalPdf(params.mu1, priorMuMeans.mu1, priorMuStds.mu1);
  const lpMu2 = logNormalPdf(params.mu2, priorMuMeans.mu2, priorMuStds.mu2);

  return lpTau + lpMu1 + lpMu2;
}

/** Log-posterior = log-likelihood + log-prior */
export function logPosterior(
  params: Params,
  data: DataPoint[],
  knownSigma: number,
  priorMuMeans: PriorMuMeans,
  priorMuStds: PriorMuStds,
): number {
  const lp = logPrior(params, priorMuMeans, priorMuStds);
  if (lp === -Infinity) return -Infinity;
  return logLikelihood(params, data, knownSigma) + lp;
}
