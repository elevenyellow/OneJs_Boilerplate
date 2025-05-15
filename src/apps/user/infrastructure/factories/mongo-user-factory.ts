import { Injectable } from '@EyJs'
import type { UserFactory } from '../../domain/factories/user-factory.interface'
import { UserEntity } from '@user/domain/entities/user.entity'
import { CreateUserDto } from '@user/domain/dtos/create-user.dto'
import { Id } from '@user/domain/value-objects/id'

@Injectable()
export class MongoUserFactory implements UserFactory {
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
    )
  }
}
