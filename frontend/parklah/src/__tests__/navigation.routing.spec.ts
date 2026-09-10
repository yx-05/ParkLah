import { NavigationRoutingService } from '../services/NavigationRoutingService';

describe('NavigationRoutingService', () => {
  let service: NavigationRoutingService;

  beforeEach(() => {
    service = NavigationRoutingService.getInstance();
  });

  it('should accurately calculate distance using Haversine formula', () => {
    // KLCC (3.1579, 101.7116) to Pavilion KL (3.1488, 101.7133) is approx ~1.0 km
    const dist = service.calculateDistance(3.1579, 101.7116, 3.1488, 101.7133);
    expect(dist).toBeGreaterThan(900);
    expect(dist).toBeLessThan(1200);
  });

  it('should format distances properly in meters and kilometers', () => {
    expect(service.formatDistance(45)).toBe('45 m');
    expect(service.formatDistance(650)).toBe('650 m');
    expect(service.formatDistance(1200)).toBe('1.2 km');
    expect(service.formatDistance(3850)).toBe('3.9 km');
  });

  it('should format duration properly in minutes and hours', () => {
    expect(service.formatDuration(25)).toBe('< 1 min');
    expect(service.formatDuration(240)).toBe('4 min');
    expect(service.formatDuration(3660)).toBe('1 hr 1 min');
  });

  it('should return a valid route with fallback when network is unavailable', async () => {
    const start = { latitude: 3.1390, longitude: 101.6860 };
    const dest = { latitude: 3.1402, longitude: 101.6875 };

    const route = await service.fetchDrivingRoute(start, dest);
    expect(route).toBeDefined();
    expect(route.polyline.length).toBeGreaterThanOrEqual(2);
    expect(route.steps.length).toBeGreaterThanOrEqual(1);
    expect(route.totalDistanceMeters).toBeGreaterThan(0);
    expect(route.formattedDistance).toBeDefined();
    expect(route.formattedEta).toBeDefined();
  });
});
