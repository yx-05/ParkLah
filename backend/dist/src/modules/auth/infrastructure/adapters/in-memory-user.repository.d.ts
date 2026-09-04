import { IUserRepositoryPort } from '../../domain/ports/user-repository.port';
import { UserEntity } from '../../domain/entities/user.entity';
export declare class InMemoryUserRepository implements IUserRepositoryPort {
    private users;
    findById(id: string): Promise<UserEntity | null>;
    findByPhoneNumber(phone: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findByProvider(provider: string, providerId: string): Promise<UserEntity | null>;
    create(user: UserEntity): Promise<UserEntity>;
    update(user: UserEntity): Promise<UserEntity>;
    clear(): void;
}
