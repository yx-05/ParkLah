import { IsNotEmpty, Matches, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+601[0-9]{8,9}$/, {
    message: 'phoneNumber must be a valid Malaysian mobile number starting with +601 (e.g. +60123456789)',
  })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+601[0-9]{8,9}$/, {
    message: 'phoneNumber must be a valid Malaysian mobile number starting with +601',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{6}$/, {
    message: 'otp must be a 6-digit numeric string',
  })
  otp: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  makeModel: string;

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{4}$/, {
    message: 'plateSuffix must be exactly 4 digits (e.g. 8892)',
  })
  plateSuffix: string;

  isDefault?: boolean;
}

export class UpdateRoleDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^(SEARCHER|LEAVER)$/, {
    message: 'role must be either SEARCHER or LEAVER',
  })
  role: 'SEARCHER' | 'LEAVER';
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  emailOrPhone: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  emailOrPhone: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export * from './oauth-login.dto';
