import type { PostEntity } from '@post/domain/entities/post'
import { Id } from '@user/domain/value-objects/id'
export class UserEntity {
  constructor(
    public id: Id,
    public name: string,
    public email: string,
    public password: string,
    public postIds: string[],
    public createdAt?: Date,
    public updatedAt?: Date,
    public posts?: PostEntity[],
  ) {}

  addPost(postId: string) {
    this.postIds.push(postId)
  }

  touch() {
    this.updatedAt = new Date()
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      name: this.name,
      email: this.email,
      password: this.password,
      postIds: this.postIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      posts: this.posts?.map((post) => post.toJSON()) || [],
    }
  }
}
