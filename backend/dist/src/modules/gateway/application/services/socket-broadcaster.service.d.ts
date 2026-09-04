import { RoomManagerService } from '../../infrastructure/services/room-manager.service';
export declare class SocketBroadcasterService {
    private readonly roomManager;
    constructor(roomManager: RoomManagerService);
    emitGatekeeperStatus(userId: string, status: {
        isUnlocked: boolean;
        reason?: string;
    }): void;
    emitMatchOffer(searcherId: string, offerPayload: any): void;
    emitMatchConfirmed(searcherId: string, leaverId: string, matchPayload: any): void;
    emitArrivalPrompt(searcherId: string, matchId: string, spotCoords?: {
        latitude: number;
        longitude: number;
    }): void;
    emitFallbackSpot(searcherId: string, spotPayload: any): void;
    emitWalletUpdate(userId: string, balance: number, formattedBalance: string): void;
}
