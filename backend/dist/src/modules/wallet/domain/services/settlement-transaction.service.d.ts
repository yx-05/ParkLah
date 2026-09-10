import { IWalletRepositoryPort } from '../ports/wallet-repository.port';
export interface SettlementResult {
    success: boolean;
    matchId: string;
    searcherDebit: number;
    leaverCredit: number;
    platformFee: number;
    searcherBalanceAfter: number;
    leaverBalanceAfter: number;
    settledAt: Date;
}
export declare class SettlementTransactionService {
    private readonly walletRepository;
    constructor(walletRepository: IWalletRepositoryPort);
    executeHandoffSettlement(searcherId: string, leaverId: string, matchId: string): Promise<SettlementResult>;
}
