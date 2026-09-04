import { Injectable, Logger } from '@nestjs/common';
import { IEventPublisherPort } from '../../domain/ports/event-publisher.port';

@Injectable()
export class InMemoryEventPublisherAdapter implements IEventPublisherPort {
  private readonly logger = new Logger(InMemoryEventPublisherAdapter.name);
  public readonly publishedEvents: Array<{ channel: string; event: any; timestamp: Date }> = [];
  private handlers = new Map<string, Array<(event: any) => Promise<void>>>();

  async publish(channel: string, event: any): Promise<void> {
    this.logger.log(`[EVENT BUS] Published to channel [${channel}]: ${JSON.stringify(event)}`);
    this.publishedEvents.push({ channel, event, timestamp: new Date() });

    const callbacks = this.handlers.get(channel);
    if (callbacks) {
      for (const cb of callbacks) {
        await cb(event);
      }
    }
  }

  public subscribe(channel: string, callback: (event: any) => Promise<void>): void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
    }
    this.handlers.get(channel)!.push(callback);
  }

  public clear(): void {
    this.publishedEvents.length = 0;
    this.handlers.clear();
  }
}
