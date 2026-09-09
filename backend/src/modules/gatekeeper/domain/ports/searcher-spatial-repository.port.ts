import { LatLng } from './google-maps-routing.port';

export const SEARCHER_SPATIAL_REPOSITORY_PORT = Symbol('ISearcherSpatialRepositoryPort');

export interface ActiveSearcherSession {
  searcherId: string;
  currentCoords: LatLng;
  destCoords: LatLng;
  destName: string;
  radiusMeters: number;
  registeredAt: Date;
  lastHeartbeat: Date;
  headingDegrees?: number;
  speedKmh?: number;
  gpsAccuracyMeters?: number;
}

export interface ISearcherSpatialRepositoryPort {
  registerActiveSearcher(
    searcherId: string,
    currentCoords: LatLng,
    destCoords: LatLng,
    destName: string,
    radiusMeters?: number,
  ): Promise<ActiveSearcherSession>;
  updateSearcherLocation(searcherId: string, coords: LatLng): Promise<void>;
  removeActiveSearcher(searcherId: string): Promise<boolean>;
  getActiveSearcherState(searcherId: string): Promise<ActiveSearcherSession | null>;
  findNearbyActiveSearchers(
    spotCoords: LatLng,
    radiusMeters?: number,
  ): Promise<Array<{ searcher: ActiveSearcherSession; distanceMeters: number }>>;
}
