export const EVENT_PUBLISHER_PORT = Symbol('IEventPublisherPort');

export interface IEventPublisherPort {
  publish(channel: string, event: any): Promise<void>;
}
