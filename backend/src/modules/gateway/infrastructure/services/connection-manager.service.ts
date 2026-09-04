import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);
  private userToSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketToUser = new Map<string, string>(); // socketId -> userId

  public registerConnection(userId: string, socketId: string): void {
    if (!this.userToSockets.has(userId)) {
      this.userToSockets.set(userId, new Set());
    }
    this.userToSockets.get(userId)!.add(socketId);
    this.socketToUser.set(socketId, userId);
    this.logger.log(`User [${userId}] connected with socket [${socketId}]`);
  }

  public removeConnection(socketId: string): string | null {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return null;

    this.socketToUser.delete(socketId);
    const sockets = this.userToSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userToSockets.delete(userId);
      }
    }
    this.logger.log(`Socket [${socketId}] disconnected for user [${userId}]`);
    return userId;
  }

  public getSocketsForUser(userId: string): string[] {
    const sockets = this.userToSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  public getUserIdForSocket(socketId: string): string | null {
    return this.socketToUser.get(socketId) || null;
  }

  public isUserConnected(userId: string): boolean {
    return this.userToSockets.has(userId);
  }

  public clear(): void {
    this.userToSockets.clear();
    this.socketToUser.clear();
  }
}
