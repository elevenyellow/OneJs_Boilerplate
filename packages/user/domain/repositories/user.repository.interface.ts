import type { User } from '../entities/user'

export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByResetToken(token: string): Promise<User | null>
  save(user: User): Promise<void>
  delete(id: string): Promise<void>
}
