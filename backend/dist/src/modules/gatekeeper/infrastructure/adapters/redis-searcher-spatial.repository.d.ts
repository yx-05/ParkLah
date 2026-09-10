import Redis from 'ioredis';
import { ISearcherSpatialRepositoryPort, ActiveSearcherSession } from '../../domain/ports/searcher-spatial-repository.port';
import { LatLng } from '../../domain/ports/google-maps-routing.port';
export declare class RedisSearcherSpatialRepository implements ISearcherSpatialRepositoryPort {
    private redis;
    private readonly GEO_KEY;
    private readonly STATE_PREFIX;
    constructor(redisClient?: Redis);
    registerActiveSearcher(searcherId: string, currentCoords: LatLng, destCoords: LatLng, destName: string, radiusMeters?: number): Promise<ActiveSearcherSession>;
    updateSearcherLocation(searcherId: string, coords: LatLng): Promise<void>;
    removeActiveSearcher(searcherId: string): Promise<boolean>;
    getActiveSearcherState(searcherId: string): Promise<ActiveSearcherSession | null>;
    findNearbyActiveSearchers(spotCoords: LatLng, radiusMeters?: number): Promise<Array<{
        searcher: ActiveSearcherSession;
        distanceMeters: number;
    }>>;
}
