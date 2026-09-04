"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManagerService = void 0;
const common_1 = require("@nestjs/common");
let RoomManagerService = class RoomManagerService {
    constructor() {
        this.server = null;
    }
    setServer(server) {
        this.server = server;
    }
    joinRoom(socket, roomName) {
        socket.join(roomName);
    }
    leaveRoom(socket, roomName) {
        socket.leave(roomName);
    }
    broadcastToRoom(roomName, event, payload) {
        if (this.server) {
            this.server.to(roomName).emit(event, payload);
        }
    }
    broadcastToUser(userId, event, payload) {
        this.broadcastToRoom(`user:${userId}`, event, payload);
    }
    broadcastToMatch(matchId, event, payload) {
        this.broadcastToRoom(`match:${matchId}`, event, payload);
    }
};
exports.RoomManagerService = RoomManagerService;
exports.RoomManagerService = RoomManagerService = __decorate([
    (0, common_1.Injectable)()
], RoomManagerService);
//# sourceMappingURL=room-manager.service.js.map