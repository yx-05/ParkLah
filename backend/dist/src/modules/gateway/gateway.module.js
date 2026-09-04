"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeGatewayModule = void 0;
const common_1 = require("@nestjs/common");
const app_gateway_1 = require("./infrastructure/gateways/app.gateway");
const connection_manager_service_1 = require("./infrastructure/services/connection-manager.service");
const room_manager_service_1 = require("./infrastructure/services/room-manager.service");
const socket_broadcaster_service_1 = require("./application/services/socket-broadcaster.service");
const auth_module_1 = require("../auth/auth.module");
let RealTimeGatewayModule = class RealTimeGatewayModule {
};
exports.RealTimeGatewayModule = RealTimeGatewayModule;
exports.RealTimeGatewayModule = RealTimeGatewayModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        providers: [
            app_gateway_1.AppGateway,
            connection_manager_service_1.ConnectionManagerService,
            room_manager_service_1.RoomManagerService,
            socket_broadcaster_service_1.SocketBroadcasterService,
        ],
        exports: [
            app_gateway_1.AppGateway,
            connection_manager_service_1.ConnectionManagerService,
            room_manager_service_1.RoomManagerService,
            socket_broadcaster_service_1.SocketBroadcasterService,
        ],
    })
], RealTimeGatewayModule);
//# sourceMappingURL=gateway.module.js.map