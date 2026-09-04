import { Module } from '@nestjs/common';
import { WalletService } from './application/services/wallet.service';
import { MockWalletService } from './application/services/mock-wallet.service';
import { SettlementTransactionService } from './domain/services/settlement-transaction.service';
import { WalletController } from './infrastructure/controllers/wallet.controller';
import { WALLET_REPOSITORY_PORT } from './domain/ports/wallet-repository.port';
import { PAYMENT_GATEWAY_PORT } from './domain/ports/payment-gateway.port';
import { PostgresWalletRepository } from './infrastructure/adapters/postgres-wallet.repository';
import { InMemoryWalletRepository } from './infrastructure/adapters/in-memory-wallet.repository';
import { StubPaymentGatewayAdapter } from './infrastructure/adapters/stub-payment-gateway.adapter';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WalletController],
  providers: [
    WalletService,
    MockWalletService,
    SettlementTransactionService,
    {
      provide: WALLET_REPOSITORY_PORT,
      useFactory: () => {
        return process.env.DATABASE_URL
          ? new PostgresWalletRepository()
          : new InMemoryWalletRepository();
      },
    },
    {
      provide: PAYMENT_GATEWAY_PORT,
      useClass: StubPaymentGatewayAdapter,
    },
  ],
  exports: [
    WalletService,
    SettlementTransactionService,
    MockWalletService,
    WALLET_REPOSITORY_PORT,
    PAYMENT_GATEWAY_PORT,
  ],
})
export class WalletModule {}
