import { Server, Socket } from 'socket.io';
export declare class RoomManagerService {
    private server;
    setServer(server: Server): void;
    joinRoom(socket: Socket, roomName: string): void;
    leaveRoom(socket: Socket, roomName: string): void;
    broadcastToRoom(roomName: string, event: string, payload: any): void;
    broadcastToUser(userId: string, event: string, payload: any): void;
    broadcastToMatch(matchId: string, event: string, payload: any): void;
}
