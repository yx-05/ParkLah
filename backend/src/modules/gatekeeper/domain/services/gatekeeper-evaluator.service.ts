import { Injectable } from '@nestjs/common';

export interface GatekeeperEvaluation {
  isUnlocked: boolean;
  distanceMeters: number;
  durationSeconds: number;
  reason?: string;
}

@Injectable()
export class GatekeeperEvaluatorService {
  public static readonly MAX_DISTANCE_METERS = 3000; // 3.0 km
  public static readonly MAX_DURATION_SECONDS = 600; // 10 minutes (600s)

  public evaluate(distanceMeters: number, durationSeconds: number): GatekeeperEvaluation {
    const isDistanceValid = distanceMeters <= GatekeeperEvaluatorService.MAX_DISTANCE_METERS;
    const isDurationValid = durationSeconds <= GatekeeperEvaluatorService.MAX_DURATION_SECONDS;

    const isUnlocked = isDistanceValid && isDurationValid;

    let reason: string | undefined;
    if (!isUnlocked) {
      if (!isDistanceValid && !isDurationValid) {
        reason = `Matchmaking locked: Distance exceeds 3.0km (${(distanceMeters / 1000).toFixed(1)}km) and ETA exceeds 10 mins (${Math.round(durationSeconds / 60)} mins).`;
      } else if (!isDistanceValid) {
        reason = `Matchmaking locked: Distance exceeds 3.0km (${(distanceMeters / 1000).toFixed(1)}km from destination).`;
      } else {
        reason = `Matchmaking locked: ETA exceeds 10 minutes (${Math.round(durationSeconds / 60)} mins estimated travel time).`;
      }
    }

    return {
      isUnlocked,
      distanceMeters,
      durationSeconds,
      reason,
    };
  }
}
