import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import type * as ort from 'onnxruntime-node';

function getOrt(): typeof import('onnxruntime-node') {
  if ((globalThis as any).__ONNX_RUNTIME__) {
    return (globalThis as any).__ONNX_RUNTIME__;
  }
  try {
    const loaded = require('onnxruntime-node');
    (globalThis as any).__ONNX_RUNTIME__ = loaded;
    return loaded;
  } catch {
    return null as any;
  }
}

import {
  IMlMatchScoringPort,
  MlCandidateFeatures,
  ScoredMatchCandidate,
} from '../../domain/ports/ml-match-scoring.port';

@Injectable()
export class OnnxMlMatchScoringAdapter implements IMlMatchScoringPort, OnModuleInit {
  private readonly logger = new Logger(OnnxMlMatchScoringAdapter.name);
  private session: ort.InferenceSession | null = null;
  private readonly modelPath: string;

  public static readonly FEATURE_COUNT = 26;
  public static readonly MIN_DISPATCH_PROBABILITY = 0.40;

  constructor(customModelPath?: string) {
    if (customModelPath) {
      this.modelPath = customModelPath;
    } else if (process.env.ML_MODEL_PATH) {
      this.modelPath = path.resolve(process.env.ML_MODEL_PATH);
    } else {
      // Default to bundled model in infrastructure/models/
      const primaryPath = path.resolve(
        __dirname,
        '../models/parklah_matchmaker_v1.onnx',
      );
      const fallbackSrcPath = path.resolve(
        process.cwd(),
        'src/modules/matchmaker/infrastructure/models/parklah_matchmaker_v1.onnx',
      );
      this.modelPath = fs.existsSync(primaryPath) ? primaryPath : fallbackSrcPath;
    }
  }

  async onModuleInit(): Promise<void> {
    await this.initSession();
  }

  public async initSession(): Promise<boolean> {
    if (this.session) return true;

    const cacheKey = `onnx_session:${this.modelPath}`;
    const globalCache = (globalThis as any).__ONNX_SESSION_CACHE__ || new Map();
    (globalThis as any).__ONNX_SESSION_CACHE__ = globalCache;

    if (globalCache.has(cacheKey)) {
      this.session = globalCache.get(cacheKey);
      return true;
    }

    if (!fs.existsSync(this.modelPath)) {
      this.logger.warn(
        `ONNX model not found at ${this.modelPath}. ML scoring will use calibrated heuristic fallback.`,
      );
      return false;
    }

    const ort = getOrt();
    if (!ort) {
      this.logger.warn('onnxruntime-node module could not be loaded. Using heuristic fallback.');
      return false;
    }

    try {
      this.session = await ort.InferenceSession.create(this.modelPath);
      globalCache.set(cacheKey, this.session);
      this.logger.log(`Loaded LightGBM ONNX matchmaker model from ${this.modelPath}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to initialize ONNX runtime session: ${err.message}`, err.stack);
      this.session = null;
      return false;
    }
  }

  async scoreCandidates(candidates: MlCandidateFeatures[]): Promise<ScoredMatchCandidate[]> {
    if (candidates.length === 0) {
      return [];
    }

    // Ensure session is initialized
    if (!this.session) {
      const initialized = await this.initSession();
      if (!initialized) {
        return this.fallbackHeuristicScoring(candidates);
      }
    }

    try {
      const numCandidates = candidates.length;
      const flatData = new Float32Array(numCandidates * OnnxMlMatchScoringAdapter.FEATURE_COUNT);

      candidates.forEach((c, i) => {
        const offset = i * OnnxMlMatchScoringAdapter.FEATURE_COUNT;
        flatData[offset + 0] = c.roadDistanceMeters;
        flatData[offset + 1] = c.euclidDistanceMeters;
        flatData[offset + 2] = c.detourRatio;
        flatData[offset + 3] = c.spotToDestDistanceMeters;
        flatData[offset + 4] = c.roadEtaSeconds;
        flatData[offset + 5] = c.leaverCountdownSeconds;
        flatData[offset + 6] = c.absEtaCountdownDiff;
        flatData[offset + 7] = c.signedTimeSlack;
        flatData[offset + 8] = c.hourOfDay;
        flatData[offset + 9] = c.dayOfWeek;
        flatData[offset + 10] = c.isRushHour;
        flatData[offset + 11] = c.isWeekend;
        flatData[offset + 12] = c.currentSpeedKmh;
        flatData[offset + 13] = c.headingBearingDiffDeg;
        flatData[offset + 14] = c.headingDestDiffDeg;
        flatData[offset + 15] = c.gpsAccuracyMeters;
        flatData[offset + 16] = c.pingStalenessSeconds;
        flatData[offset + 17] = c.driverReliabilityRating;
        flatData[offset + 18] = c.historicalAcceptanceRate;
        flatData[offset + 19] = c.historicalCompletionRate;
        flatData[offset + 20] = c.historicalCancellationRate;
        flatData[offset + 21] = c.lifetimeMatchesCount;
        flatData[offset + 22] = c.spotTypeEnum;
        flatData[offset + 23] = c.vehicleSizeCompatibility;
        flatData[offset + 24] = c.hasLandmarkNote;
        flatData[offset + 25] = c.landmarkNoteLength;
      });

      const ort = getOrt();
      if (!ort) {
        return this.fallbackHeuristicScoring(candidates);
      }

      const inputTensor = new ort.Tensor('float32', flatData, [
        numCandidates,
        OnnxMlMatchScoringAdapter.FEATURE_COUNT,
      ]);

      const results = await this.session!.run(
        { float_input: inputTensor },
        ['probabilities'],
      );
      const probData = results.probabilities.data as Float32Array;

      const scored = candidates.map((candidate, i) => {
        // Output probabilities is [N, 2]. Class 1 (Success) is index i * 2 + 1
        const rawProb = probData[i * 2 + 1];
        const successProbability = Math.round(Math.max(0, Math.min(1, rawProb)) * 1000) / 1000;

        return {
          searcherId: candidate.searcherId,
          successProbability,
          features: candidate,
        };
      });

      // Rank by descending success probability
      return scored.sort((a, b) => b.successProbability - a.successProbability);
    } catch (err: any) {
      this.logger.error(`Error during ONNX model inference: ${err.message}`, err.stack);
      return this.fallbackHeuristicScoring(candidates);
    }
  }

  private fallbackHeuristicScoring(
    candidates: MlCandidateFeatures[],
  ): ScoredMatchCandidate[] {
    const scored = candidates.map((c) => {
      // Calibrated heuristic approximation
      const etaDiff = Math.abs(c.roadEtaSeconds - c.leaverCountdownSeconds);
      const etaScore = Math.max(0, 1 - etaDiff / 300);
      const distScore = Math.max(0, 1 - c.roadDistanceMeters / 1500);
      const ratingScore = Math.max(0, Math.min(1, c.driverReliabilityRating / 5.0));

      const raw = 0.50 * etaScore + 0.35 * distScore + 0.15 * ratingScore;
      const successProbability = Math.round(Math.max(0.1, Math.min(0.95, raw)) * 1000) / 1000;

      return {
        searcherId: c.searcherId,
        successProbability,
        features: c,
      };
    });

    return scored.sort((a, b) => b.successProbability - a.successProbability);
  }
}
