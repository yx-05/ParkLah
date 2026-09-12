"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelemetryIntegrityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryIntegrityService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const DEFAULT_GUARD_RULES = {
    max_safe_speed_kmh: 140.0,
    max_position_delta_mps: 40.0,
    max_horizontal_accuracy_meters: 50.0,
    max_ping_staleness_seconds: 25.0,
    max_cancellation_rate: 0.6,
    max_teleport_jump_ratio: 0.1,
    max_unverified_claim_ratio: 0.25,
};
let TelemetryIntegrityService = TelemetryIntegrityService_1 = class TelemetryIntegrityService {
    constructor() {
        this.logger = new common_1.Logger(TelemetryIntegrityService_1.name);
        this.rules = DEFAULT_GUARD_RULES;
        this.metadata = null;
        this.loadMetadata();
    }
    loadMetadata() {
        const candidatePaths = [
            path.resolve(process.cwd(), 'scripts/ml/fraud_model_metadata.json'),
            path.resolve(process.cwd(), '../scripts/ml/fraud_model_metadata.json'),
            path.resolve(__dirname, '../../../../../../scripts/ml/fraud_model_metadata.json'),
            path.resolve(__dirname, '../../../../../scripts/ml/fraud_model_metadata.json'),
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                try {
                    const raw = fs.readFileSync(p, 'utf-8');
                    this.metadata = JSON.parse(raw);
                    if (this.metadata.heuristic_guard_rules) {
                        this.rules = {
                            ...DEFAULT_GUARD_RULES,
                            ...this.metadata.heuristic_guard_rules,
                        };
                    }
                    this.logger.log(`Loaded fraud model metadata successfully from ${p}`);
                    return;
                }
                catch (err) {
                    this.logger.warn(`Failed parsing fraud model metadata at ${p}: ${err.message}`);
                }
            }
        }
        this.logger.warn('fraud_model_metadata.json not found on disk. Initializing TelemetryIntegrityService with default calibrated guard rules.');
    }
    auditTelemetry(heartbeat) {
        const flaggedReasons = [];
        let score = 1.0;
        const currentTs = typeof heartbeat.timestamp === 'number'
            ? heartbeat.timestamp
            : new Date(heartbeat.timestamp).getTime();
        const speedKmh = heartbeat.speedKmh;
        if (speedKmh !== undefined && speedKmh > this.rules.max_safe_speed_kmh) {
            flaggedReasons.push(`ANOMALOUS_VELOCITY_EXCEEDED: Instantaneous velocity of ${speedKmh.toFixed(1)} km/h exceeds safe physical road limit (${this.rules.max_safe_speed_kmh} km/h)`);
            score -= 0.4;
        }
        let speedDeltaMps;
        if (heartbeat.previousCoords && heartbeat.previousTimestamp) {
            const prevTs = typeof heartbeat.previousTimestamp === 'number'
                ? heartbeat.previousTimestamp
                : new Date(heartbeat.previousTimestamp).getTime();
            const deltaSeconds = (currentTs - prevTs) / 1000.0;
            if (deltaSeconds > 0) {
                const deltaMeters = this.haversineMeters(heartbeat.previousCoords.latitude, heartbeat.previousCoords.longitude, heartbeat.currentCoords.latitude, heartbeat.currentCoords.longitude);
                speedDeltaMps = deltaMeters / deltaSeconds;
                if (speedDeltaMps > this.rules.max_position_delta_mps) {
                    flaggedReasons.push(`TELEPORTATION_JUMP_DETECTED: Coordinate displacement rate of ${speedDeltaMps.toFixed(1)} m/s exceeds kinematic sanity threshold (${this.rules.max_position_delta_mps} m/s)`);
                    score -= 0.5;
                }
            }
        }
        const horizontalAccuracy = heartbeat.horizontalAccuracyMeters;
        if (horizontalAccuracy !== undefined &&
            horizontalAccuracy > this.rules.max_horizontal_accuracy_meters) {
            flaggedReasons.push(`GPS_DILUTION_OF_PRECISION_HIGH: Horizontal accuracy error of ${horizontalAccuracy.toFixed(1)}m exceeds 50m tolerance (multipath or signal jam)`);
            score -= 0.25;
        }
        const stalenessSeconds = Math.max(0, (Date.now() - currentTs) / 1000.0);
        if (stalenessSeconds > this.rules.max_ping_staleness_seconds) {
            flaggedReasons.push(`TELEMETRY_STALENESS_EXCEEDED: Heartbeat staleness of ${stalenessSeconds.toFixed(1)}s exceeds 25s limit`);
            score -= 0.2;
        }
        if (heartbeat.historicalCancellationRate !== undefined &&
            heartbeat.historicalCancellationRate > this.rules.max_cancellation_rate) {
            flaggedReasons.push(`HIGH_CANCELLATION_ABUSE_RISK: Cancellation rate of ${(heartbeat.historicalCancellationRate * 100).toFixed(1)}% exceeds 60% abuse threshold`);
            score -= 0.3;
        }
        if (heartbeat.unverifiedClaimRatio !== undefined &&
            heartbeat.unverifiedClaimRatio > this.rules.max_unverified_claim_ratio) {
            flaggedReasons.push(`UNVERIFIED_ARRIVAL_SPAM: Unverified arrival ratio of ${(heartbeat.unverifiedClaimRatio * 100).toFixed(1)}% exceeds 25% bot threshold`);
            score -= 0.3;
        }
        const integrityScore = Math.max(0.0, Math.min(1.0, Number(score.toFixed(3))));
        const isTrusted = flaggedReasons.length === 0 && integrityScore >= 0.7;
        return {
            isTrusted,
            integrityScore,
            flaggedReasons,
            signals: {
                velocityKmh: speedKmh !== undefined ? Number(speedKmh.toFixed(1)) : undefined,
                speedDeltaMps: speedDeltaMps !== undefined ? Number(speedDeltaMps.toFixed(1)) : undefined,
                horizontalAccuracyMeters: horizontalAccuracy !== undefined ? Number(horizontalAccuracy.toFixed(1)) : undefined,
                stalenessSeconds: Number(stalenessSeconds.toFixed(1)),
            },
        };
    }
    haversineMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};
exports.TelemetryIntegrityService = TelemetryIntegrityService;
exports.TelemetryIntegrityService = TelemetryIntegrityService = TelemetryIntegrityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TelemetryIntegrityService);
//# sourceMappingURL=telemetry-integrity.service.js.map