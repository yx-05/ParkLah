export declare const EVENT_PUBLISHER_PORT: unique symbol;
export interface IEventPublisherPort {
    publish(channel: string, event: any): Promise<void>;
}
