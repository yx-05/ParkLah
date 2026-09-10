import { LeaverSessionData } from '../../application/dto';

export const LEAVER_SPATIAL_REPOSITORY_PORT = Symbol('ILeaverSpatialRepositoryPort');

export interface ILeaverSpatialRepositoryPort {
  registerActiveLeaver(session: LeaverSessionData): Promise<LeaverSessionData>;
  updateCountdown(leaverId: string, remainingSeconds: number): Promise<void>;
  markMatched(leaverId: string, searcherId: string): Promise<void>;
  removeActiveLeaver(leaverId: string): Promise<boolean>;
  getLeaverSession(leaverId: string): Promise<LeaverSessionData | null>;
  findNearbyActiveLeavers(
    latitude: number,
    longitude: number,
    radiusMeters?: number,
  ): Promise<Array<{ session: LeaverSessionData; distanceMeters: number }>>;
}
