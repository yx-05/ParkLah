import { ILeaverSpatialRepositoryPort } from '../../domain/ports/leaver-spatial-repository.port';
import { LeaverSessionData } from '../../application/dto';
export declare class InMemoryLeaverSpatialRepository implements ILeaverSpatialRepositoryPort {
    private leavers;
    registerActiveLeaver(session: LeaverSessionData): Promise<LeaverSessionData>;
    updateCountdown(leaverId: string, remainingSeconds: number): Promise<void>;
    markMatched(leaverId: string, searcherId: string): Promise<void>;
    removeActiveLeaver(leaverId: string): Promise<boolean>;
    getLeaverSession(leaverId: string): Promise<LeaverSessionData | null>;
    findNearbyActiveLeavers(latitude: number, longitude: number, radiusMeters?: number): Promise<Array<{
        session: LeaverSessionData;
        distanceMeters: number;
    }>>;
    private haversineDistance;
    clear(): void;
}
