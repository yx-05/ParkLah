import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { RequestOtpDto, VerifyOtpDto, RefreshTokenDto, OAuthLoginDto } from '../../application/dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    const result = await this.authService.requestOtp(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto.refreshToken);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  async oauthLogin(@Body() dto: OAuthLoginDto) {
    const result = await this.authService.oauthLogin(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('bootstrap')
  @HttpCode(HttpStatus.OK)
  async bootstrap() {
    const result = await this.authService.bootstrapDevSession();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
