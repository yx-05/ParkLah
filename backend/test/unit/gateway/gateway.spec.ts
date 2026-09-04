import { ConnectionManagerService } from '../../../src/modules/gateway/infrastructure/services/connection-manager.service';
import { RoomManagerService } from '../../../src/modules/gateway/infrastructure/services/room-manager.service';
import { SocketBroadcasterService } from '../../../src/modules/gateway/application/services/socket-broadcaster.service';

describe('RealTimeGateway Subsystem (Module 9 Unit Tests)', () => {
  let connectionManager: ConnectionManagerService;
  let roomManager: RoomManagerService;
  let broadcaster: SocketBroadcasterService;
  let mockServer: any;

  beforeEach(() => {
    connectionManager = new ConnectionManagerService();
    roomManager = new RoomManagerService();
    broadcaster = new SocketBroadcasterService(roomManager);

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    roomManager.setServer(mockServer as any);
  });

  it('should track user connections and disconnections', () => {
    const userId = 'user-100';
    const socketId = 'sock-abc-1';

    connectionManager.registerConnection(userId, socketId);
    expect(connectionManager.isUserConnected(userId)).toBe(true);
    expect(connectionManager.getSocketsForUser(userId)).toEqual([socketId]);
    expect(connectionManager.getUserIdForSocket(socketId)).toBe(userId);

    const disconnectedUser = connectionManager.removeConnection(socketId);
    expect(disconnectedUser).toBe(userId);
    expect(connectionManager.isUserConnected(userId)).toBe(false);
  });

  it('should broadcast match offer to searcher room', () => {
    const searcherId = 'searcher-88';
    const offer = {
      matchId: 'match-123',
      leaverCar: 'Myvi White 8892',
      countdownSeconds: 240,
    };

    broadcaster.emitMatchOffer(searcherId, offer);

    expect(mockServer.to).toHaveBeenCalledWith(`user:${searcherId}`);
    expect(mockServer.emit).toHaveBeenCalledWith(
      'match:offer',
      expect.objectContaining({
        matchId: 'match-123',
        leaverCar: 'Myvi White 8892',
        countdownSeconds: 240,
      }),
    );
  });

  it('should broadcast match confirmation to both searcher and leaver', () => {
    const searcherId = 'searcher-88';
    const leaverId = 'leaver-99';
    const matchPayload = {
      matchId: 'match-123',
      status: 'ACCEPTED',
      spotCoords: { latitude: 3.139, longitude: 101.686 },
    };

    broadcaster.emitMatchConfirmed(searcherId, leaverId, matchPayload);

    expect(mockServer.to).toHaveBeenCalledWith(`user:${searcherId}`);
    expect(mockServer.to).toHaveBeenCalledWith(`user:${leaverId}`);
    expect(mockServer.emit).toHaveBeenCalledWith(
      'match:confirmed',
      expect.objectContaining({
        matchId: 'match-123',
        status: 'ACCEPTED',
      }),
    );
  });

  it('should broadcast wallet balance update to user room', () => {
    const userId = 'user-100';
    broadcaster.emitWalletUpdate(userId, 25.50, 'RM 25.50');

    expect(mockServer.to).toHaveBeenCalledWith(`user:${userId}`);
    expect(mockServer.emit).toHaveBeenCalledWith(
      'wallet:balance_update',
      expect.objectContaining({
        balance: 25.50,
        formattedBalance: 'RM 25.50',
      }),
    );
  });
});
