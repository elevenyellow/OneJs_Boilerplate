import { Injectable } from '@EyJs'
import type { PostFactory } from '@post/domain/factories/post-factory.interface'
import { Id } from '@user/domain/value-objects/id'
import { PostEntity } from '@post/domain/entities/post'
import { CreatePostDto } from '@post/domain/dtos/create-post.dto'

@Injectable()
export class PrismaPostFactory implements PostFactory {
  async createPost(dto: CreatePostDto): Promise<PostEntity> {
    const id = Id.generateUniqueId()

    return new PostEntity(
      id,
      dto.title,
      dto.content,
      dto.userId,
      new Date(),
      new Date(),
    )
  }

  createPostFromExisting(post: PostEntity): PostEntity {
    return new PostEntity(
      post.id,
      post.title,
      post.content,
      post.userId,
      post.createdAt,
      post.updatedAt,
    )
  }
}
