import { Injectable } from '@OneJs/core'
import type { User } from '../../domain/entities/user'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface'
import type { Email } from '../../domain/value-objects/email'
import type { ResetToken } from '../../domain/value-objects/reset-token'
import type { UserId } from '../../domain/value-objects/user-id'

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>()

  async findAll(): Promise<User[]> {
    return Array.from(this.store.values())
  }

  async findById(id: UserId): Promise<User | null> {
    return this.store.get(id.getValue()) ?? null
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.getEmail().getValue() === email.getValue()) return user
    }
    return null
  }

  async findByResetToken(token: ResetToken): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.getResetToken()?.getValue() === token.getValue()) return user
    }
    return null
  }

  async save(user: User): Promise<void> {
    this.store.set(user.getId().getValue(), user)
  }

  async delete(id: UserId): Promise<void> {
    this.store.delete(id.getValue())
  }
}
