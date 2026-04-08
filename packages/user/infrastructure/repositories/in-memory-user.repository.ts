import { Injectable } from '@OneJs/core'
import type { User } from '../../domain/entities/user'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface'

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>()

  async findAll(): Promise<User[]> {
    return Array.from(this.store.values())
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.getValue() === email.toLowerCase()) return user
    }
    return null
  }

  async findByResetToken(token: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.resetToken?.getValue() === token) return user
    }
    return null
  }

  async save(user: User): Promise<void> {
    this.store.set(user.getId().getValue(), user)
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }
}
