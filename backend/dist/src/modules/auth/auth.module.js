"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./application/services/auth.service");
const user_service_1 = require("./application/services/user.service");
const vehicle_service_1 = require("./application/services/vehicle.service");
const auth_controller_1 = require("./infrastructure/controllers/auth.controller");
const user_controller_1 = require("./infrastructure/controllers/user.controller");
const user_repository_port_1 = require("./domain/ports/user-repository.port");
const vehicle_repository_port_1 = require("./domain/ports/vehicle-repository.port");
const sms_gateway_port_1 = require("./domain/ports/sms-gateway.port");
const otp_cache_port_1 = require("./domain/ports/otp-cache.port");
const postgres_user_repository_1 = require("./infrastructure/adapters/postgres-user.repository");
const postgres_vehicle_repository_1 = require("./infrastructure/adapters/postgres-vehicle.repository");
const redis_otp_cache_adapter_1 = require("./infrastructure/adapters/redis-otp-cache.adapter");
const in_memory_user_repository_1 = require("./infrastructure/adapters/in-memory-user.repository");
const in_memory_vehicle_repository_1 = require("./infrastructure/adapters/in-memory-vehicle.repository");
const mock_sms_adapter_1 = require("./infrastructure/adapters/mock-sms.adapter");
const in_memory_otp_cache_adapter_1 = require("./infrastructure/adapters/in-memory-otp-cache.adapter");
const jwt_auth_guard_1 = require("./infrastructure/guards/jwt-auth.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        controllers: [auth_controller_1.AuthController, user_controller_1.UserController],
        providers: [
            auth_service_1.AuthService,
            user_service_1.UserService,
            vehicle_service_1.VehicleService,
            jwt_auth_guard_1.JwtAuthGuard,
            {
                provide: user_repository_port_1.USER_REPOSITORY_PORT,
                useFactory: () => {
                    return process.env.DATABASE_URL
                        ? new postgres_user_repository_1.PostgresUserRepository()
                        : new in_memory_user_repository_1.InMemoryUserRepository();
                },
            },
            {
                provide: vehicle_repository_port_1.VEHICLE_REPOSITORY_PORT,
                useFactory: () => {
                    return process.env.DATABASE_URL
                        ? new postgres_vehicle_repository_1.PostgresVehicleRepository()
                        : new in_memory_vehicle_repository_1.InMemoryVehicleRepository();
                },
            },
            {
                provide: sms_gateway_port_1.SMS_GATEWAY_PORT,
                useClass: mock_sms_adapter_1.MockSmsGatewayAdapter,
            },
            {
                provide: otp_cache_port_1.OTP_CACHE_PORT,
                useFactory: () => {
                    return process.env.REDIS_URL
                        ? new redis_otp_cache_adapter_1.RedisOtpCacheAdapter()
                        : new in_memory_otp_cache_adapter_1.InMemoryOtpCacheAdapter();
                },
            },
        ],
        exports: [
            auth_service_1.AuthService,
            user_service_1.UserService,
            vehicle_service_1.VehicleService,
            jwt_auth_guard_1.JwtAuthGuard,
            user_repository_port_1.USER_REPOSITORY_PORT,
            vehicle_repository_port_1.VEHICLE_REPOSITORY_PORT,
            otp_cache_port_1.OTP_CACHE_PORT,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map