import { Injectable } from '@EyJs'
import type { PostFactory } from '../../domain/factories/post-factory.interface'
import { PostEntity } from '@src/post/domain/entities/post'
import type { CreatePostDto } from '@src/post/domain/dtos/create-post.dto'
import { Id } from '@user/domain/value-objects/id'

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
