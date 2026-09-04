"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GatekeeperEvaluatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatekeeperEvaluatorService = void 0;
const common_1 = require("@nestjs/common");
let GatekeeperEvaluatorService = GatekeeperEvaluatorService_1 = class GatekeeperEvaluatorService {
    evaluate(distanceMeters, durationSeconds) {
        const isDistanceValid = distanceMeters <= GatekeeperEvaluatorService_1.MAX_DISTANCE_METERS;
        const isDurationValid = durationSeconds <= GatekeeperEvaluatorService_1.MAX_DURATION_SECONDS;
        const isUnlocked = isDistanceValid && isDurationValid;
        let reason;
        if (!isUnlocked) {
            if (!isDistanceValid && !isDurationValid) {
                reason = `Matchmaking locked: Distance exceeds 3.0km (${(distanceMeters / 1000).toFixed(1)}km) and ETA exceeds 10 mins (${Math.round(durationSeconds / 60)} mins).`;
            }
            else if (!isDistanceValid) {
                reason = `Matchmaking locked: Distance exceeds 3.0km (${(distanceMeters / 1000).toFixed(1)}km from destination).`;
            }
            else {
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
};
exports.GatekeeperEvaluatorService = GatekeeperEvaluatorService;
GatekeeperEvaluatorService.MAX_DISTANCE_METERS = 3000;
GatekeeperEvaluatorService.MAX_DURATION_SECONDS = 600;
exports.GatekeeperEvaluatorService = GatekeeperEvaluatorService = GatekeeperEvaluatorService_1 = __decorate([
    (0, common_1.Injectable)()
], GatekeeperEvaluatorService);
//# sourceMappingURL=gatekeeper-evaluator.service.js.map