import { UserEntity } from '../entities/user.entity'
import { CreateUserDto } from '../dtos/create-user.dto'

export interface UserFactory {
  createUser(dto: CreateUserDto): UserEntity
  createUserFromExisting(user: Partial<UserEntity>): UserEntity
}
