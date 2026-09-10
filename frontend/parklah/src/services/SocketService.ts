import { io, Socket } from 'socket.io-client';
import { MatchOffer, Coordinates } from '../types';

export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private eventHandlers = new Map<string, Array<(data: any) => void>>();

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(url: string, token: string): void {
    if (this.socket && this.socket.connected) return;

    this.socket = io(`${url}/events`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to ParkLah events namespace');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
    });

    // Register forwarded event listeners
    const supportedEvents = [
      'match:offer',
      'match:confirmed',
      'prompt:arrival_confirm',
      'searcher:fallback_spot',
      'wallet:balance_update',
      'leaver:matched',
    ];

    for (const eventName of supportedEvents) {
      this.socket.on(eventName, (data) => {
        const handlers = this.eventHandlers.get(eventName) || [];
        for (const handler of handlers) {
          handler(data);
        }
      });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public on(event: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(event) || [];
      this.eventHandlers.set(
        event,
        handlers.filter((h) => h !== handler),
      );
    };
  }

  public emit(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  // Helper emitter methods
  public sendTelemetry(coords: Coordinates, speedKmh: number, stationarySec: number): void {
    this.emit('searcher:telemetry', { coordinates: coords, speedKmh, stationaryDurationSeconds: stationarySec });
  }

  public acceptMatch(matchId: string): void {
    this.emit('match:accept', { matchId });
  }

  public declineMatch(matchId: string): void {
    this.emit('match:decline', { matchId });
  }

  public confirmParked(matchId: string): void {
    this.emit('searcher:confirm_parked', { matchId });
  }

  public reportSpotTaken(matchId: string, description?: string): void {
    this.emit('searcher:spot_taken', { matchId, description });
  }
}
