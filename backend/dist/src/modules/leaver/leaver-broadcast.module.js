"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaverBroadcastModule = void 0;
const common_1 = require("@nestjs/common");
const leaver_broadcast_service_1 = require("./application/services/leaver-broadcast.service");
const leaver_controller_1 = require("./infrastructure/controllers/leaver.controller");
const leaver_spatial_repository_port_1 = require("./domain/ports/leaver-spatial-repository.port");
const event_publisher_port_1 = require("./domain/ports/event-publisher.port");
const redis_leaver_spatial_repository_1 = require("./infrastructure/adapters/redis-leaver-spatial.repository");
const redis_event_publisher_adapter_1 = require("./infrastructure/adapters/redis-event-publisher.adapter");
const in_memory_leaver_spatial_repository_1 = require("./infrastructure/adapters/in-memory-leaver-spatial.repository");
const in_memory_event_publisher_adapter_1 = require("./infrastructure/adapters/in-memory-event-publisher.adapter");
const auth_module_1 = require("../auth/auth.module");
const spatial_matchmaker_module_1 = require("../matchmaker/spatial-matchmaker.module");
let LeaverBroadcastModule = class LeaverBroadcastModule {
};
exports.LeaverBroadcastModule = LeaverBroadcastModule;
exports.LeaverBroadcastModule = LeaverBroadcastModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, spatial_matchmaker_module_1.SpatialMatchmakerModule],
        controllers: [leaver_controller_1.LeaverController],
        providers: [
            leaver_broadcast_service_1.LeaverBroadcastService,
            {
                provide: leaver_spatial_repository_port_1.LEAVER_SPATIAL_REPOSITORY_PORT,
                useFactory: () => {
                    return process.env.REDIS_URL
                        ? new redis_leaver_spatial_repository_1.RedisLeaverSpatialRepository()
                        : new in_memory_leaver_spatial_repository_1.InMemoryLeaverSpatialRepository();
                },
            },
            {
                provide: event_publisher_port_1.EVENT_PUBLISHER_PORT,
                useFactory: () => {
                    return process.env.REDIS_URL
                        ? new redis_event_publisher_adapter_1.RedisEventPublisherAdapter()
                        : new in_memory_event_publisher_adapter_1.InMemoryEventPublisherAdapter();
                },
            },
        ],
        exports: [
            leaver_broadcast_service_1.LeaverBroadcastService,
            leaver_spatial_repository_port_1.LEAVER_SPATIAL_REPOSITORY_PORT,
            event_publisher_port_1.EVENT_PUBLISHER_PORT,
        ],
    })
], LeaverBroadcastModule);
//# sourceMappingURL=leaver-broadcast.module.js.map