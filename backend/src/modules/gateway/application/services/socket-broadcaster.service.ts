import { Injectable } from '@nestjs/common';
import { RoomManagerService } from '../../infrastructure/services/room-manager.service';

@Injectable()
export class SocketBroadcasterService {
  constructor(private readonly roomManager: RoomManagerService) {}

  public emitGatekeeperStatus(userId: string, status: { isUnlocked: boolean; reason?: string }): void {
    this.roomManager.broadcastToUser(userId, 'searcher:gatekeeper_status', {
      ...status,
      timestamp: new Date().toISOString(),
    });
  }

  public emitMatchOffer(searcherId: string, offerPayload: any): void {
    this.roomManager.broadcastToUser(searcherId, 'match:offer', {
      ...offerPayload,
      timestamp: new Date().toISOString(),
    });
  }

  public emitMatchConfirmed(searcherId: string, leaverId: string, matchPayload: any): void {
    const payload = {
      ...matchPayload,
      timestamp: new Date().toISOString(),
    };
    this.roomManager.broadcastToUser(searcherId, 'match:confirmed', payload);
    this.roomManager.broadcastToUser(leaverId, 'match:confirmed', payload);
  }

  public emitArrivalPrompt(searcherId: string, matchId: string, spotCoords?: { latitude: number; longitude: number }): void {
    this.roomManager.broadcastToUser(searcherId, 'prompt:arrival_confirm', {
      matchId,
      spotCoords,
      timestamp: new Date().toISOString(),
    });
  }

  public emitFallbackSpot(searcherId: string, spotPayload: any): void {
    this.roomManager.broadcastToUser(searcherId, 'searcher:routed_db_spot', {
      ...spotPayload,
      timestamp: new Date().toISOString(),
    });
  }

  public emitWalletUpdate(userId: string, balance: number, formattedBalance: string): void {
    this.roomManager.broadcastToUser(userId, 'wallet:balance_update', {
      balance,
      formattedBalance,
      timestamp: new Date().toISOString(),
    });
  }
}
