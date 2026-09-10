import { IsString, IsNotEmpty, IsIn, IsOptional, IsEmail } from 'class-validator';

export class OAuthLoginDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['GOOGLE', 'FACEBOOK', 'APPLE'])
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
