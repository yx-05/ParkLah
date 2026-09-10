import { UserEntity } from '../entities/user.entity';
export declare const USER_REPOSITORY_PORT: unique symbol;
export interface IUserRepositoryPort {
    findById(id: string): Promise<UserEntity | null>;
    findByPhoneNumber(phone: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findByProvider(provider: string, providerId: string): Promise<UserEntity | null>;
    create(user: UserEntity): Promise<UserEntity>;
    update(user: UserEntity): Promise<UserEntity>;
}
