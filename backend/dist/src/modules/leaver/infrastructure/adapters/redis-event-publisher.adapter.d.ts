import Redis from 'ioredis';
import { IEventPublisherPort } from '../../domain/ports/event-publisher.port';
export declare class RedisEventPublisherAdapter implements IEventPublisherPort {
    private redis;
    constructor(redisClient?: Redis);
    publish(channel: string, event: any): Promise<void>;
}
