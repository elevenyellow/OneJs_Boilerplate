import { Injectable } from '@OneJs'
import type { CreateUserDto } from '@user/domain/dtos/create-user.dto'
import { UserEntity } from '@user/domain/entities/user.entity'
import type { UserFactory } from '@user/domain/factories/user-factory.interface'
import { Id } from '@user/domain/value-objects/id'

@Injectable()
export class PrismaUserFactory implements UserFactory {
  createUser(dto: CreateUserDto): UserEntity {
    const id = Id.generateUniqueId()

    return new UserEntity(
      id,
      dto.email,
      dto.name,
      dto.password,
      [],
      new Date(),
      new Date(),
    )
  }

  createUserFromExisting(user: UserEntity): UserEntity {
    return new UserEntity(
      Id.createFrom(user.id.toString()),
      user.email,
      user.name,
      user.password,
      user.postIds,
      user.createdAt,
      user.updatedAt,
      user.posts,
    )
  }
}
