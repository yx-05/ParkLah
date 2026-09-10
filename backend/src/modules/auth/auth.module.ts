import { Module } from '@nestjs/common';
import { AuthService } from './application/services/auth.service';
import { UserService } from './application/services/user.service';
import { VehicleService } from './application/services/vehicle.service';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { UserController } from './infrastructure/controllers/user.controller';
import { USER_REPOSITORY_PORT } from './domain/ports/user-repository.port';
import { VEHICLE_REPOSITORY_PORT } from './domain/ports/vehicle-repository.port';
import { SMS_GATEWAY_PORT } from './domain/ports/sms-gateway.port';
import { OTP_CACHE_PORT } from './domain/ports/otp-cache.port';
import { PostgresUserRepository } from './infrastructure/adapters/postgres-user.repository';
import { PostgresVehicleRepository } from './infrastructure/adapters/postgres-vehicle.repository';
import { RedisOtpCacheAdapter } from './infrastructure/adapters/redis-otp-cache.adapter';
import { InMemoryUserRepository } from './infrastructure/adapters/in-memory-user.repository';
import { InMemoryVehicleRepository } from './infrastructure/adapters/in-memory-vehicle.repository';
import { MockSmsGatewayAdapter } from './infrastructure/adapters/mock-sms.adapter';
import { InMemoryOtpCacheAdapter } from './infrastructure/adapters/in-memory-otp-cache.adapter';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';

@Module({
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    UserService,
    VehicleService,
    JwtAuthGuard,
    {
      provide: USER_REPOSITORY_PORT,
      useFactory: () => {
        return process.env.DATABASE_URL
          ? new PostgresUserRepository()
          : new InMemoryUserRepository();
      },
    },
    {
      provide: VEHICLE_REPOSITORY_PORT,
      useFactory: () => {
        return process.env.DATABASE_URL
          ? new PostgresVehicleRepository()
          : new InMemoryVehicleRepository();
      },
    },
    {
      provide: SMS_GATEWAY_PORT,
      useClass: MockSmsGatewayAdapter,
    },
    {
      provide: OTP_CACHE_PORT,
      useFactory: () => {
        return process.env.REDIS_URL
          ? new RedisOtpCacheAdapter()
          : new InMemoryOtpCacheAdapter();
      },
    },
  ],
  exports: [
    AuthService,
    UserService,
    VehicleService,
    JwtAuthGuard,
    USER_REPOSITORY_PORT,
    VEHICLE_REPOSITORY_PORT,
    OTP_CACHE_PORT,
  ],
})
export class AuthModule {}
