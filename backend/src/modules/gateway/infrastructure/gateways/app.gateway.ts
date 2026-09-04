import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthService } from '../../../auth/application/services/auth.service';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { RoomManagerService } from '../services/room-manager.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
  pingTimeout: 20000,
  pingInterval: 25000,
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
  ) {}

  afterInit(server: Server) {
    this.roomManager.setServer(server);
    this.logger.log('WebSocket Gateway Initialized on namespace /events');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization?.startsWith('Bearer ')
          ? client.handshake.headers.authorization.substring(7)
          : null);

      if (!token) {
        this.logger.warn(`Connection rejected: Missing auth token (socket ${client.id})`);
        client.emit('error', { message: 'Unauthorized: Missing token' });
        client.disconnect();
        return;
      }

      const decoded = this.authService.verifyAccessToken(token);
      client.data.user = decoded;
      const userId = decoded.userId || decoded.sub;

      this.connectionManager.registerConnection(userId, client.id);
      this.roomManager.joinRoom(client, `user:${userId}`);

      client.emit('connection:established', {
        userId,
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`Socket authenticated: user [${userId}], socket [${client.id}]`);
    } catch (e) {
      this.logger.warn(`Connection auth error: ${e.message}`);
      client.emit('error', { message: 'Unauthorized: Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectionManager.removeConnection(client.id);
    if (userId) {
      this.logger.log(`Client disconnected: user [${userId}], socket [${client.id}]`);
    }
  }

  @SubscribeMessage('searcher:telemetry')
  handleTelemetry(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const userId = client.data?.user?.userId || client.data?.user?.sub;
    if (!userId) return { error: 'Unauthorized' };
    return { success: true, processedAt: new Date().toISOString() };
  }

  @SubscribeMessage('match:join_room')
  handleJoinMatchRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    if (data?.matchId) {
      this.roomManager.joinRoom(client, `match:${data.matchId}`);
      return { success: true, room: `match:${data.matchId}` };
    }
    return { success: false, error: 'matchId is required' };
  }
}
