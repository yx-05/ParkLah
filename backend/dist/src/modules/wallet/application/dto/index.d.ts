export declare class TopUpDto {
    amount: number;
    method?: string;
}
export declare class CashOutDto {
    amount: number;
    bankAccountNumber?: string;
    bankName?: string;
}
export declare class ExecuteSettlementDto {
    searcherId: string;
    leaverId: string;
    matchId: string;
}
