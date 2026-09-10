import { OsrmRoadRoutingAdapter } from '../../../src/modules/matchmaker/infrastructure/adapters/osrm-road-routing.adapter';
import { LatLng } from '../../../src/modules/gatekeeper/domain/ports/google-maps-routing.port';

describe('OsrmRoadRoutingAdapter', () => {
  const spotCoords: LatLng = { latitude: 3.1177, longitude: 101.6774 };

  it('should fall back gracefully to Haversine routing when OSRM is unreachable', async () => {
    // Port 59999 has no running service, forcing a connection refusal / timeout
    const adapter = new OsrmRoadRoutingAdapter('http://localhost:59999', 500);

    const candidates = [
      { searcherId: 'searcher-1', coords: { latitude: 3.1141, longitude: 101.6774 } },
      { searcherId: 'searcher-2', coords: { latitude: 3.1250, longitude: 101.6800 } },
    ];

    const results = await adapter.calculateCandidateRoutes(spotCoords, candidates);

    expect(results).toHaveLength(2);
    expect(results[0].searcherId).toBe('searcher-1');
    expect(results[0].routingSource).toBe('HAVERSINE_FALLBACK');
    expect(results[0].roadDistanceMeters).toBeGreaterThan(300);
    expect(results[0].roadEtaSeconds).toBeGreaterThan(15);

    expect(results[1].searcherId).toBe('searcher-2');
    expect(results[1].routingSource).toBe('HAVERSINE_FALLBACK');
  });

  it('should return empty list if candidates list is empty', async () => {
    const adapter = new OsrmRoadRoutingAdapter('http://localhost:59999', 500);
    const results = await adapter.calculateCandidateRoutes(spotCoords, []);
    expect(results).toEqual([]);
  });

  it('should parse valid OSRM /table response correctly when mock server responds', async () => {
    const adapter = new OsrmRoadRoutingAdapter('http://localhost:5000', 1000);

    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        durations: [[142.5], [260.0]],
        distances: [[850.2], [1450.0]],
      }),
    } as any);

    const candidates = [
      { searcherId: 'searcher-1', coords: { latitude: 3.1141, longitude: 101.6774 } },
      { searcherId: 'searcher-2', coords: { latitude: 3.1250, longitude: 101.6800 } },
    ];

    const results = await adapter.calculateCandidateRoutes(spotCoords, candidates);

    expect(results).toHaveLength(2);
    expect(results[0].searcherId).toBe('searcher-1');
    expect(results[0].roadDistanceMeters).toBe(850);
    expect(results[0].roadEtaSeconds).toBe(143);
    expect(results[0].routingSource).toBe('OSRM');

    expect(results[1].searcherId).toBe('searcher-2');
    expect(results[1].roadDistanceMeters).toBe(1450);
    expect(results[1].roadEtaSeconds).toBe(260);

    global.fetch = originalFetch;
  });
});
