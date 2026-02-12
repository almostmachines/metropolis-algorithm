import type { DataPoint, Params } from '../types';
import { randomNormal, randomUniform } from './random';

const DAY_START = 0;
const DAY_END = 24;

export function generateData(
  trueParams: Params,
  knownSigma: number,
  observationCount: number,
): DataPoint[] {
  const times = Array.from({ length: observationCount }, () =>
    randomUniform(DAY_START, DAY_END),
  ).sort((a, b) => a - b);

  return times.map((time) => {
    const mean = time < trueParams.tau ? trueParams.mu1 : trueParams.mu2;
    return {
      time,
      value: randomNormal(mean, knownSigma),
    };
  });
}
