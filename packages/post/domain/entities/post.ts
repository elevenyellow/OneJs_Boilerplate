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

  toJSON() {
    return {
      id: this.id.toString(),
      title: this.title,
      content: this.content,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      user: this.user?.toJSON() || null,
    }
  }
}
