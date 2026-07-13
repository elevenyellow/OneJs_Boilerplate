import type { User } from '../entities/user'
import type { Email } from '../value-objects/email'
import type { ResetToken } from '../value-objects/reset-token'
import type { UserId } from '../value-objects/user-id'

export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  findByResetToken(token: ResetToken): Promise<User | null>
  save(user: User): Promise<void>
  delete(id: UserId): Promise<void>
}
