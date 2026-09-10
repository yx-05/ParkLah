import { DecayEngine } from '../../../src/modules/probabilistic/domain/services/decay.engine';

describe('DecayEngine (Module 6 Unit Tests)', () => {
  let decayEngine: DecayEngine;

  beforeEach(() => {
    decayEngine = new DecayEngine();
  });

  it('should compute exact initial probability P(0) = 0.950', () => {
    const p = decayEngine.calculateProbability(0);
    expect(p).toBe(0.950);
  });

  it('should compute P(5) ≈ 0.449 under normal traffic (M_traffic = 1.0)', () => {
    const p = decayEngine.calculateProbability(5, { trafficMultiplier: 1.0 });
    // P(5) = 0.950 * exp(-0.150 * 5) = 0.950 * exp(-0.75) ≈ 0.4487 -> 0.449
    expect(p).toBeCloseTo(0.449, 2);
  });

  it('should compute P(10) ≈ 0.212 under normal traffic', () => {
    const p = decayEngine.calculateProbability(10, { trafficMultiplier: 1.0 });
    // P(10) = 0.950 * exp(-0.150 * 10) = 0.950 * exp(-1.5) ≈ 0.2119 -> 0.212
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
    // At t=13 min, 0.95 * exp(-0.15 * 13) = 0.95 * exp(-1.95) ≈ 0.135 < 0.150
    const p = decayEngine.calculateProbability(13);
    expect(p).toBe(0.0);
  });
});
