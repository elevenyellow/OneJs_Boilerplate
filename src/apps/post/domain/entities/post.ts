import type { UserEntity } from '@user/domain/entities/user.entity'
import { Id } from '@user/domain/value-objects/id'

export class PostEntity {
  constructor(
    public id: Id,
    public title: string,
    public content: string,
    public userId: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public user?: UserEntity,
  ) {}
}
