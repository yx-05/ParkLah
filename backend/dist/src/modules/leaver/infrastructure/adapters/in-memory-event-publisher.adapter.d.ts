import { IEventPublisherPort } from '../../domain/ports/event-publisher.port';
export declare class InMemoryEventPublisherAdapter implements IEventPublisherPort {
    private readonly logger;
    readonly publishedEvents: Array<{
        channel: string;
        event: any;
        timestamp: Date;
    }>;
    private handlers;
    publish(channel: string, event: any): Promise<void>;
    subscribe(channel: string, callback: (event: any) => Promise<void>): void;
    clear(): void;
}
