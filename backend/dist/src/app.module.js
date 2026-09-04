"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./modules/auth/auth.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const probabilistic_vacancy_module_1 = require("./modules/probabilistic/probabilistic-vacancy.module");
const gatekeeper_module_1 = require("./modules/gatekeeper/gatekeeper.module");
const leaver_broadcast_module_1 = require("./modules/leaver/leaver-broadcast.module");
const spatial_matchmaker_module_1 = require("./modules/matchmaker/spatial-matchmaker.module");
const background_scheduler_module_1 = require("./modules/scheduler/background-scheduler.module");
const verification_module_1 = require("./modules/verification/verification.module");
const gateway_module_1 = require("./modules/gateway/gateway.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            wallet_module_1.WalletModule,
            probabilistic_vacancy_module_1.ProbabilisticVacancyModule,
            gatekeeper_module_1.GatekeeperModule,
            leaver_broadcast_module_1.LeaverBroadcastModule,
            spatial_matchmaker_module_1.SpatialMatchmakerModule,
            background_scheduler_module_1.BackgroundSchedulerModule,
            verification_module_1.VerificationAndDisputeModule,
            gateway_module_1.RealTimeGatewayModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map