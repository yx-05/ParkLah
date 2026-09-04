import { Module } from '@nestjs/common';
import { AppGateway } from './infrastructure/gateways/app.gateway';
import { ConnectionManagerService } from './infrastructure/services/connection-manager.service';
import { RoomManagerService } from './infrastructure/services/room-manager.service';
import { SocketBroadcasterService } from './application/services/socket-broadcaster.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [
    AppGateway,
    ConnectionManagerService,
    RoomManagerService,
    SocketBroadcasterService,
  ],
  exports: [
    AppGateway,
    ConnectionManagerService,
    RoomManagerService,
    SocketBroadcasterService,
  ],
})
export class RealTimeGatewayModule {}
