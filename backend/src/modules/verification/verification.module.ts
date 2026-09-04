import { Module } from '@nestjs/common';
import { VerificationService } from './application/services/verification.service';
import { GeofenceEngine } from './domain/services/geofence.engine';
import { VerificationController } from './infrastructure/controllers/verification.controller';
import { DISPUTE_REPOSITORY_PORT } from './domain/ports/dispute-repository.port';
import { PostgresDisputeRepository } from './infrastructure/adapters/postgres-dispute.repository';
import { InMemoryDisputeRepository } from './infrastructure/adapters/in-memory-dispute.repository';
import { SpatialMatchmakerModule } from '../matchmaker/spatial-matchmaker.module';
import { WalletModule } from '../wallet/wallet.module';
import { ProbabilisticVacancyModule } from '../probabilistic/probabilistic-vacancy.module';
import { RealTimeGatewayModule } from '../gateway/gateway.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    SpatialMatchmakerModule,
    WalletModule,
    ProbabilisticVacancyModule,
    RealTimeGatewayModule,
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    GeofenceEngine,
    {
      provide: DISPUTE_REPOSITORY_PORT,
      useFactory: () => {
        return process.env.DATABASE_URL
          ? new PostgresDisputeRepository()
          : new InMemoryDisputeRepository();
      },
    },
  ],
  exports: [
    VerificationService,
    GeofenceEngine,
    DISPUTE_REPOSITORY_PORT,
  ],
})
export class VerificationAndDisputeModule {}
