import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from '../../application/services/user.service';
import { VehicleService } from '../../application/services/vehicle.service';
import { CreateVehicleDto, UpdateRoleDto } from '../../application/dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('api/v1/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly vehicleService: VehicleService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser('userId') userId: string) {
    const profile = await this.userService.getUserProfile(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: profile,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get('vehicles')
  async getVehicles(@CurrentUser('userId') userId: string) {
    const vehicles = await this.vehicleService.getUserVehicles(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: vehicles,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('vehicles')
  async addVehicle(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    const vehicle = await this.vehicleService.addVehicle(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: vehicle,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Patch('vehicles/:id/default')
  async setDefaultVehicle(
    @CurrentUser('userId') userId: string,
    @Param('id') vehicleId: string,
  ) {
    const vehicle = await this.vehicleService.setDefaultVehicle(userId, vehicleId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: vehicle,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Delete('vehicles/:id')
  async deleteVehicle(
    @CurrentUser('userId') userId: string,
    @Param('id') vehicleId: string,
  ) {
    const result = await this.vehicleService.deleteVehicle(userId, vehicleId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
