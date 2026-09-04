import { Injectable } from '@nestjs/common';
import { IUserRepositoryPort } from '../../domain/ports/user-repository.port';
import { UserEntity } from '../../domain/entities/user.entity';

@Injectable()
export class InMemoryUserRepository implements IUserRepositoryPort {
  private users = new Map<string, UserEntity>();

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async findByPhoneNumber(phone: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.phoneNumber === phone) {
        return user;
      }
    }
    return null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email?.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async findByProvider(provider: string, providerId: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.authProvider === provider && user.authProviderId === providerId) {
        return user;
      }
    }
    return null;
  }

  async create(user: UserEntity): Promise<UserEntity> {
    this.users.set(user.id, user);
    return user;
  }

  async update(user: UserEntity): Promise<UserEntity> {
    this.users.set(user.id, user);
    return user;
  }

  public clear(): void {
    this.users.clear();
  }
}
