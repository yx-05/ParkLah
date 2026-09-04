import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ProbabilisticVacancyModule } from './modules/probabilistic/probabilistic-vacancy.module';
import { GatekeeperModule } from './modules/gatekeeper/gatekeeper.module';
import { LeaverBroadcastModule } from './modules/leaver/leaver-broadcast.module';
import { SpatialMatchmakerModule } from './modules/matchmaker/spatial-matchmaker.module';
import { BackgroundSchedulerModule } from './modules/scheduler/background-scheduler.module';
import { VerificationAndDisputeModule } from './modules/verification/verification.module';
import { RealTimeGatewayModule } from './modules/gateway/gateway.module';

@Module({
  imports: [
    AuthModule,
    WalletModule,
    ProbabilisticVacancyModule,
    GatekeeperModule,
    LeaverBroadcastModule,
    SpatialMatchmakerModule,
    BackgroundSchedulerModule,
    VerificationAndDisputeModule,
    RealTimeGatewayModule,
  ],
})
export class AppModule {}
