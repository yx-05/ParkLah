import { DemandForecastService } from '../../../src/modules/gatekeeper/application/services/demand-forecast.service';

describe('DemandForecastService (Pitch Day Task 2.1 Zoning-Aware Unit Tests)', () => {
  let service: DemandForecastService;

  beforeEach(() => {
    service = new DemandForecastService();
  });

  it('should return valid demand forecast structure for Mid Valley Megamall', () => {
    const forecast = service.getForecast({
      destinationName: 'Mid Valley Megamall',
      latitude: 3.1176,
      longitude: 101.6778,
    });

    expect(forecast).toBeDefined();
    expect(forecast.hubName).toBe('Mid Valley Megamall');
    expect(forecast.archetype).toBe('RETAIL_MALL');
    expect(typeof forecast.occupancyRate).toBe('number');
    expect(forecast.occupancyRate).toBeGreaterThan(0);
    expect(forecast.occupancyRate).toBeLessThanOrEqual(1.0);
    expect(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).toContain(forecast.demandLevel);
    expect(typeof forecast.turnoverMinutes).toBe('number');
    expect(typeof forecast.isPeakHour).toBe('boolean');
    expect(['CRUISING_PERMITTED', 'P2P_HANDOFF']).toContain(forecast.recommendedMode);
    expect(typeof forecast.estimatedCruisingMinutesSaved).toBe('number');
    expect(forecast.estimatedCruisingMinutesSaved).toBeGreaterThanOrEqual(0);
  });

  it('should apply NIGHTLIFE_ENTERTAINMENT critical surge on Friday/Saturday late night (21:00 - 02:00)', () => {
    // Friday night at 22:30 (Day 5 = Friday, Hour = 22)
    const forecast = service.getForecast({
      destinationName: 'Bukit Bintang Changkat',
      simulatedHour: 22,
      simulatedDayOfWeek: 5,
    });

    expect(forecast.hubName).toBe('Bukit Bintang');
    expect(forecast.archetype).toBe('NIGHTLIFE_ENTERTAINMENT');
    expect(forecast.occupancyRate).toBeGreaterThanOrEqual(0.86);
    expect(forecast.occupancyRate).toBeLessThanOrEqual(0.92);
    expect(forecast.demandLevel).toBe('CRITICAL');
    expect(forecast.isPeakHour).toBe(true);
    expect(forecast.recommendedMode).toBe('P2P_HANDOFF');
    expect(forecast.turnoverMinutes).toBeLessThanOrEqual(3.0);
    expect(forecast.estimatedCruisingMinutesSaved).toBeGreaterThanOrEqual(20);
    expect(forecast.peakWindowLabel).toContain('Nightlife & Dining Peak');
  });

  it('should apply RETAIL_MALL post-closing drop after 22:00', () => {
    // Mid Valley at 23:30 (Hour = 23)
    const forecast = service.getForecast({
      destinationName: 'Mid Valley Megamall',
      simulatedHour: 23,
      simulatedDayOfWeek: 3,
    });

    expect(forecast.hubName).toBe('Mid Valley Megamall');
    expect(forecast.archetype).toBe('RETAIL_MALL');
    expect(forecast.occupancyRate).toBeGreaterThanOrEqual(0.25);
    expect(forecast.occupancyRate).toBeLessThanOrEqual(0.35);
    expect(forecast.demandLevel).toBe('LOW');
    expect(forecast.isPeakHour).toBe(false);
    expect(forecast.recommendedMode).toBe('CRUISING_PERMITTED');
    expect(forecast.peakWindowLabel).toContain('Post-Mall Closing');
  });

  it('should apply RESIDENTIAL_LOCAL profile when location is > 2.0 km from any commercial hub', () => {
    // Remote residential coordinates (> 2km away from commercial centers)
    const forecast = service.getForecast({
      latitude: 3.2500,
      longitude: 101.5000,
      destinationName: 'Taman Saujana Residential Area',
    });

    expect(forecast.archetype).toBe('RESIDENTIAL_LOCAL');
    expect(forecast.occupancyRate).toBeGreaterThanOrEqual(0.15);
    expect(forecast.occupancyRate).toBeLessThanOrEqual(0.30);
    expect(forecast.demandLevel).toBe('LOW');
    expect(forecast.isPeakHour).toBe(false);
    expect(forecast.recommendedMode).toBe('CRUISING_PERMITTED');
    expect(forecast.peakWindowLabel).toContain('Residential');
  });

  it('should resolve to Bangsar Telawi with NIGHTLIFE_ENTERTAINMENT archetype', () => {
    const forecast = service.getForecast({
      latitude: 3.1305,
      longitude: 101.6715,
    });

    expect(forecast.hubName).toBe('Bangsar Telawi');
    expect(forecast.archetype).toBe('NIGHTLIFE_ENTERTAINMENT');
  });

  it('should resolve to SS15 Subang Jaya with CAMPUS_COMMUTER archetype', () => {
    const forecast = service.getForecast({
      latitude: 3.0768,
      longitude: 101.5905,
    });

    expect(forecast.hubName).toBe('SS15 Subang Jaya');
    expect(forecast.archetype).toBe('CAMPUS_COMMUTER');
  });

  it('should provide sensible defaults when coordinates and name are omitted', () => {
    const forecast = service.getForecast({});
    expect(forecast.hubName).toBe('Mid Valley Megamall');
    expect(forecast.archetype).toBe('RETAIL_MALL');
    expect(forecast.occupancyRate).toBeGreaterThan(0);
    expect(forecast.turnoverMinutes).toBeGreaterThan(0);
  });
});
