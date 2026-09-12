"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatekeeperModule = void 0;
const common_1 = require("@nestjs/common");
const gatekeeper_service_1 = require("./application/services/gatekeeper.service");
const demand_forecast_service_1 = require("./application/services/demand-forecast.service");
const gatekeeper_evaluator_service_1 = require("./domain/services/gatekeeper-evaluator.service");
const gatekeeper_controller_1 = require("./infrastructure/controllers/gatekeeper.controller");
const google_maps_routing_port_1 = require("./domain/ports/google-maps-routing.port");
const searcher_spatial_repository_port_1 = require("./domain/ports/searcher-spatial-repository.port");
const google_maps_routing_adapter_1 = require("./infrastructure/adapters/google-maps-routing.adapter");
const redis_searcher_spatial_repository_1 = require("./infrastructure/adapters/redis-searcher-spatial.repository");
const in_memory_searcher_spatial_repository_1 = require("./infrastructure/adapters/in-memory-searcher-spatial.repository");
const auth_module_1 = require("../auth/auth.module");
let GatekeeperModule = class GatekeeperModule {
};
exports.GatekeeperModule = GatekeeperModule;
exports.GatekeeperModule = GatekeeperModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [gatekeeper_controller_1.GatekeeperController],
        providers: [
            gatekeeper_service_1.GatekeeperService,
            demand_forecast_service_1.DemandForecastService,
            gatekeeper_evaluator_service_1.GatekeeperEvaluatorService,
            {
                provide: google_maps_routing_port_1.GOOGLE_MAPS_ROUTING_PORT,
                useClass: google_maps_routing_adapter_1.GoogleMapsRoutingAdapter,
            },
            {
                provide: searcher_spatial_repository_port_1.SEARCHER_SPATIAL_REPOSITORY_PORT,
                useFactory: () => {
                    return process.env.REDIS_URL
                        ? new redis_searcher_spatial_repository_1.RedisSearcherSpatialRepository()
                        : new in_memory_searcher_spatial_repository_1.InMemorySearcherSpatialRepository();
                },
            },
        ],
        exports: [
            gatekeeper_service_1.GatekeeperService,
            demand_forecast_service_1.DemandForecastService,
            gatekeeper_evaluator_service_1.GatekeeperEvaluatorService,
            google_maps_routing_port_1.GOOGLE_MAPS_ROUTING_PORT,
            searcher_spatial_repository_port_1.SEARCHER_SPATIAL_REPOSITORY_PORT,
        ],
    })
], GatekeeperModule);
//# sourceMappingURL=gatekeeper.module.js.map