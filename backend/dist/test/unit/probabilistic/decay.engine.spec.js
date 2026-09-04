"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decay_engine_1 = require("../../../src/modules/probabilistic/domain/services/decay.engine");
describe('DecayEngine (Module 6 Unit Tests)', () => {
    let decayEngine;
    beforeEach(() => {
        decayEngine = new decay_engine_1.DecayEngine();
    });
    it('should compute exact initial probability P(0) = 0.950', () => {
        const p = decayEngine.calculateProbability(0);
        expect(p).toBe(0.950);
    });
    it('should compute P(5) ≈ 0.449 under normal traffic (M_traffic = 1.0)', () => {
        const p = decayEngine.calculateProbability(5, { trafficMultiplier: 1.0 });
        expect(p).toBeCloseTo(0.449, 2);
    });
    it('should compute P(10) ≈ 0.212 under normal traffic', () => {
        const p = decayEngine.calculateProbability(10, { trafficMultiplier: 1.0 });
        expect(p).toBeCloseTo(0.212, 2);
    });
    it('should apply traffic density multiplier reduction (e.g. M_traffic = 0.85)', () => {
        const pNormal = decayEngine.calculateProbability(5, { trafficMultiplier: 1.0 });
        const pHighTraffic = decayEngine.calculateProbability(5, { trafficMultiplier: 0.85 });
        expect(pHighTraffic).toBeLessThan(pNormal);
        expect(pHighTraffic).toBeCloseTo(0.449 * 0.85, 2);
    });
    it('should expire and return 0.0 when elapsed time exceeds 15.0 minutes', () => {
        const p15 = decayEngine.calculateProbability(15.1);
        expect(p15).toBe(0.0);
        const p20 = decayEngine.calculateProbability(20.0);
        expect(p20).toBe(0.0);
    });
    it('should expire and return 0.0 when probability drops below 0.150 cutoff', () => {
        const p = decayEngine.calculateProbability(13);
        expect(p).toBe(0.0);
    });
});
//# sourceMappingURL=decay.engine.spec.js.map