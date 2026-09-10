import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class RoomManagerService {
  private server: Server | null = null;

  public setServer(server: Server): void {
    this.server = server;
  }

  public joinRoom(socket: Socket, roomName: string): void {
    socket.join(roomName);
  }

  public leaveRoom(socket: Socket, roomName: string): void {
    socket.leave(roomName);
  }

  public broadcastToRoom(roomName: string, event: string, payload: any): void {
    if (this.server) {
      this.server.to(roomName).emit(event, payload);
    }
  }

  public broadcastToUser(userId: string, event: string, payload: any): void {
    this.broadcastToRoom(`user:${userId}`, event, payload);
  }

  public broadcastToMatch(matchId: string, event: string, payload: any): void {
    this.broadcastToRoom(`match:${matchId}`, event, payload);
  }
}
