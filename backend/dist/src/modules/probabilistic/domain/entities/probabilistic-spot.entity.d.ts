import { SpotStatus } from '../enums/spot-status.enum';
export interface ProbabilisticSpotProps {
    id?: string;
    leaverId?: string | null;
    latitude: number;
    longitude: number;
    initialP?: number;
    currentP?: number;
    areaTrafficMultiplier?: number;
    landmarkNote?: string | null;
    status?: SpotStatus;
    vacatedAt?: Date;
    expiresAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class ProbabilisticSpotEntity {
    readonly id: string;
    readonly leaverId: string | null;
    readonly latitude: number;
    readonly longitude: number;
    readonly initialP: number;
    currentP: number;
    readonly areaTrafficMultiplier: number;
    readonly landmarkNote: string | null;
    status: SpotStatus;
    readonly vacatedAt: Date;
    readonly expiresAt: Date;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(props: ProbabilisticSpotProps);
    isExpired(): boolean;
    applyDecay(newP: number): void;
    markOccupied(): void;
    markReserved(): void;
    getProbabilityLabel(): 'High Chance' | 'Moderate' | 'Low' | 'Expired';
    private generateUuid;
}
