"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ConnectionManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManagerService = void 0;
const common_1 = require("@nestjs/common");
let ConnectionManagerService = ConnectionManagerService_1 = class ConnectionManagerService {
    constructor() {
        this.logger = new common_1.Logger(ConnectionManagerService_1.name);
        this.userToSockets = new Map();
        this.socketToUser = new Map();
    }
    registerConnection(userId, socketId) {
        if (!this.userToSockets.has(userId)) {
            this.userToSockets.set(userId, new Set());
        }
        this.userToSockets.get(userId).add(socketId);
        this.socketToUser.set(socketId, userId);
        this.logger.log(`User [${userId}] connected with socket [${socketId}]`);
    }
    removeConnection(socketId) {
        const userId = this.socketToUser.get(socketId);
        if (!userId)
            return null;
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
    getSocketsForUser(userId) {
        const sockets = this.userToSockets.get(userId);
        return sockets ? Array.from(sockets) : [];
    }
    getUserIdForSocket(socketId) {
        return this.socketToUser.get(socketId) || null;
    }
    isUserConnected(userId) {
        return this.userToSockets.has(userId);
    }
    clear() {
        this.userToSockets.clear();
        this.socketToUser.clear();
    }
};
exports.ConnectionManagerService = ConnectionManagerService;
exports.ConnectionManagerService = ConnectionManagerService = ConnectionManagerService_1 = __decorate([
    (0, common_1.Injectable)()
], ConnectionManagerService);
//# sourceMappingURL=connection-manager.service.js.map