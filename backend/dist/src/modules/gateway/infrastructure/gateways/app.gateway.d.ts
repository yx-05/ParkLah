import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../../../auth/application/services/auth.service';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { RoomManagerService } from '../services/room-manager.service';
export declare class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly authService;
    private readonly connectionManager;
    private readonly roomManager;
    server: Server;
    private readonly logger;
    constructor(authService: AuthService, connectionManager: ConnectionManagerService, roomManager: RoomManagerService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleTelemetry(client: Socket, data: any): {
        error: string;
        success?: undefined;
        processedAt?: undefined;
    } | {
        success: boolean;
        processedAt: string;
        error?: undefined;
    };
    handleJoinMatchRoom(client: Socket, data: {
        matchId: string;
    }): {
        success: boolean;
        room: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        room?: undefined;
    };
}
