export interface Params {
  tau: number;
  mu1: number;
  mu2: number;
}

export interface DataPoint {
  time: number;
  value: number;
}

export interface PriorMuMeans {
  mu1: number;
  mu2: number;
}

export interface PriorMuStds {
  mu1: number;
  mu2: number;
}

export interface AlgorithmConfig {
  totalSamples: number;
  burnInSamples: number;
  observationCount: number;
  knownSigma: number;
  trueParams: Params;
  priorMuMeans: PriorMuMeans;
  priorMuStds: PriorMuStds;
  initialParams: Params;
  proposalWidths: Params;
}

export const DEFAULT_CONFIG: AlgorithmConfig = {
  totalSamples: 2000,
  burnInSamples: 200,
  observationCount: 300,
  knownSigma: 0.9,
  trueParams: { tau: 14.5, mu1: 12.3, mu2: 13.2 },
  priorMuMeans: { mu1: 15.0, mu2: 15.0 },
  priorMuStds: { mu1: 5.0, mu2: 5.0 },
  initialParams: { tau: 12.0, mu1: 12.0, mu2: 13.0 },
  proposalWidths: { tau: 0.1, mu1: 0.2, mu2: 0.2 },
};
