import type { PostEntity } from '@post/domain/entities/post'

export class UserEntity {
  constructor(
    public name: string,
    public email: string,
    public postIds: string[],
    public id?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public posts?: PostEntity[], // ✅ opcional
  ) {}

  addPost(postId: string) {
    this.postIds.push(postId)
  }

  touch() {
    this.updatedAt = new Date()
  }
}
