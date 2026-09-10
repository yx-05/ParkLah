import { IsNotEmpty, IsNumber, Min, IsIn, IsOptional, IsString } from 'class-validator';

export class TopUpDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1.0, { message: 'Minimum top up amount is RM 1.00' })
  amount: number;

  @IsOptional()
  @IsString()
  @IsIn(['MOCK', 'FPX', 'TNG_EWALLET', 'DUITNOW'])
  method?: string;
}

export class CashOutDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1.0, { message: 'Minimum cash out amount is RM 1.00' })
  amount: number;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankName?: string;
}

export class ExecuteSettlementDto {
  @IsNotEmpty()
  @IsString()
  searcherId: string;

  @IsNotEmpty()
  @IsString()
  leaverId: string;

  @IsNotEmpty()
  @IsString()
  matchId: string;
}
