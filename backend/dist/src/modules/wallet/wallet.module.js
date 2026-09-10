"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModule = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./application/services/wallet.service");
const mock_wallet_service_1 = require("./application/services/mock-wallet.service");
const settlement_transaction_service_1 = require("./domain/services/settlement-transaction.service");
const wallet_controller_1 = require("./infrastructure/controllers/wallet.controller");
const wallet_repository_port_1 = require("./domain/ports/wallet-repository.port");
const payment_gateway_port_1 = require("./domain/ports/payment-gateway.port");
const postgres_wallet_repository_1 = require("./infrastructure/adapters/postgres-wallet.repository");
const in_memory_wallet_repository_1 = require("./infrastructure/adapters/in-memory-wallet.repository");
const stub_payment_gateway_adapter_1 = require("./infrastructure/adapters/stub-payment-gateway.adapter");
const auth_module_1 = require("../auth/auth.module");
let WalletModule = class WalletModule {
};
exports.WalletModule = WalletModule;
exports.WalletModule = WalletModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [wallet_controller_1.WalletController],
        providers: [
            wallet_service_1.WalletService,
            mock_wallet_service_1.MockWalletService,
            settlement_transaction_service_1.SettlementTransactionService,
            {
                provide: wallet_repository_port_1.WALLET_REPOSITORY_PORT,
                useFactory: () => {
                    return process.env.DATABASE_URL
                        ? new postgres_wallet_repository_1.PostgresWalletRepository()
                        : new in_memory_wallet_repository_1.InMemoryWalletRepository();
                },
            },
            {
                provide: payment_gateway_port_1.PAYMENT_GATEWAY_PORT,
                useClass: stub_payment_gateway_adapter_1.StubPaymentGatewayAdapter,
            },
        ],
        exports: [
            wallet_service_1.WalletService,
            settlement_transaction_service_1.SettlementTransactionService,
            mock_wallet_service_1.MockWalletService,
            wallet_repository_port_1.WALLET_REPOSITORY_PORT,
            payment_gateway_port_1.PAYMENT_GATEWAY_PORT,
        ],
    })
], WalletModule);
//# sourceMappingURL=wallet.module.js.map