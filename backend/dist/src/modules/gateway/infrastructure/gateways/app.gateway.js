"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AppGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../../../auth/application/services/auth.service");
const connection_manager_service_1 = require("../services/connection-manager.service");
const room_manager_service_1 = require("../services/room-manager.service");
let AppGateway = AppGateway_1 = class AppGateway {
    constructor(authService, connectionManager, roomManager) {
        this.authService = authService;
        this.connectionManager = connectionManager;
        this.roomManager = roomManager;
        this.logger = new common_1.Logger(AppGateway_1.name);
    }
    afterInit(server) {
        this.roomManager.setServer(server);
        this.logger.log('WebSocket Gateway Initialized on namespace /events');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
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
        }
        catch (e) {
            this.logger.warn(`Connection auth error: ${e.message}`);
            client.emit('error', { message: 'Unauthorized: Invalid token' });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = this.connectionManager.removeConnection(client.id);
        if (userId) {
            this.logger.log(`Client disconnected: user [${userId}], socket [${client.id}]`);
        }
    }
    handleTelemetry(client, data) {
        const userId = client.data?.user?.userId || client.data?.user?.sub;
        if (!userId)
            return { error: 'Unauthorized' };
        return { success: true, processedAt: new Date().toISOString() };
    }
    handleJoinMatchRoom(client, data) {
        if (data?.matchId) {
            this.roomManager.joinRoom(client, `match:${data.matchId}`);
            return { success: true, room: `match:${data.matchId}` };
        }
        return { success: false, error: 'matchId is required' };
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('searcher:telemetry'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleTelemetry", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('match:join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleJoinMatchRoom", null);
exports.AppGateway = AppGateway = AppGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/events',
        pingTimeout: 20000,
        pingInterval: 25000,
    }),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        connection_manager_service_1.ConnectionManagerService,
        room_manager_service_1.RoomManagerService])
], AppGateway);
//# sourceMappingURL=app.gateway.js.map