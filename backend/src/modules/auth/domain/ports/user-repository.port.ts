import { UserEntity } from '../entities/user.entity';

export const USER_REPOSITORY_PORT = Symbol('IUserRepositoryPort');

export interface IUserRepositoryPort {
  findById(id: string): Promise<UserEntity | null>;
  findByPhoneNumber(phone: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByProvider(provider: string, providerId: string): Promise<UserEntity | null>;
  create(user: UserEntity): Promise<UserEntity>;
  update(user: UserEntity): Promise<UserEntity>;
}
