import { Injectable } from '@nestjs/common';

export interface DecayParameters {
  initialP?: number; // P_0 (default 0.950)
  decayConstant?: number; // lambda (default 0.150)
  trafficMultiplier?: number; // M_traffic in [0.80, 1.00] (default 1.00)
  maxLifespanMinutes?: number; // default 15.0 mins
  minConfidenceCutoff?: number; // default 0.150
}

@Injectable()
export class DecayEngine {
  public static readonly DEFAULT_P0 = 0.950;
  public static readonly DEFAULT_LAMBDA = 0.150;
  public static readonly DEFAULT_MAX_MINUTES = 15.0;
  public static readonly DEFAULT_MIN_CUTOFF = 0.150;

  public calculateProbability(
    elapsedMinutes: number,
    params: DecayParameters = {},
  ): number {
    const P0 = params.initialP ?? DecayEngine.DEFAULT_P0;
    const lambda = params.decayConstant ?? DecayEngine.DEFAULT_LAMBDA;
    const M_traffic = Math.min(Math.max(params.trafficMultiplier ?? 1.0, 0.80), 1.0);
    const maxMinutes = params.maxLifespanMinutes ?? DecayEngine.DEFAULT_MAX_MINUTES;
    const minCutoff = params.minConfidenceCutoff ?? DecayEngine.DEFAULT_MIN_CUTOFF;

    // Hard cutoff if elapsed time exceeds maximum lifespan
    if (elapsedMinutes > maxMinutes || elapsedMinutes < 0) {
      return 0.0;
    }

    // Exact formula: P(t) = P_0 * exp(-lambda * t) * M_traffic
    const calculatedP = P0 * Math.exp(-lambda * elapsedMinutes) * M_traffic;

    // Cutoff rule: If probability drops below minimum confidence threshold
    if (calculatedP < minCutoff) {
      return 0.0;
    }

    // Round to 3 decimal places (e.g. 0.449)
    return Math.round(calculatedP * 1000) / 1000;
  }

  public calculateCurrentProbability(
    vacatedAt: Date,
    trafficMultiplier = 1.0,
    currentTime: Date = new Date(),
  ): number {
    const elapsedMinutes = (currentTime.getTime() - vacatedAt.getTime()) / (60 * 1000);
    return this.calculateProbability(elapsedMinutes, { trafficMultiplier });
  }
}
