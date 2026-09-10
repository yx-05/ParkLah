"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DecayEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecayEngine = void 0;
const common_1 = require("@nestjs/common");
let DecayEngine = DecayEngine_1 = class DecayEngine {
    calculateProbability(elapsedMinutes, params = {}) {
        const P0 = params.initialP ?? DecayEngine_1.DEFAULT_P0;
        const lambda = params.decayConstant ?? DecayEngine_1.DEFAULT_LAMBDA;
        const M_traffic = Math.min(Math.max(params.trafficMultiplier ?? 1.0, 0.80), 1.0);
        const maxMinutes = params.maxLifespanMinutes ?? DecayEngine_1.DEFAULT_MAX_MINUTES;
        const minCutoff = params.minConfidenceCutoff ?? DecayEngine_1.DEFAULT_MIN_CUTOFF;
        if (elapsedMinutes > maxMinutes || elapsedMinutes < 0) {
            return 0.0;
        }
        const calculatedP = P0 * Math.exp(-lambda * elapsedMinutes) * M_traffic;
        if (calculatedP < minCutoff) {
            return 0.0;
        }
        return Math.round(calculatedP * 1000) / 1000;
    }
    calculateCurrentProbability(vacatedAt, trafficMultiplier = 1.0, currentTime = new Date()) {
        const elapsedMinutes = (currentTime.getTime() - vacatedAt.getTime()) / (60 * 1000);
        return this.calculateProbability(elapsedMinutes, { trafficMultiplier });
    }
};
exports.DecayEngine = DecayEngine;
DecayEngine.DEFAULT_P0 = 0.950;
DecayEngine.DEFAULT_LAMBDA = 0.150;
DecayEngine.DEFAULT_MAX_MINUTES = 15.0;
DecayEngine.DEFAULT_MIN_CUTOFF = 0.150;
exports.DecayEngine = DecayEngine = DecayEngine_1 = __decorate([
    (0, common_1.Injectable)()
], DecayEngine);
//# sourceMappingURL=decay.engine.js.map