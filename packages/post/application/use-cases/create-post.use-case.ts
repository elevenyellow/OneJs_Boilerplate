import { Inject, Injectable } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { CreatePostDto } from '@post/domain/dtos/create-post.dto'
import type { PostEntity } from '@post/domain/entities/post'
import { PostCreatedEvent } from '@post/domain/events/post-created.event'
import type { PostFactory } from '@post/domain/factories/post-factory.interface'
import { PrismaPostFactory } from '@post/infrastructure/factories/prisma-post.factory'
import { PostPrismaRepository } from '@post/infrastructure/persistence/prisma/post.repository'
import { UserPrismaRepository } from '@user/infrastructure/persistence/prisma/user.repository'

@Injectable()
export class CreatePostUseCase {
  constructor(
    @Inject(PostPrismaRepository)
    private readonly postRepository: PostPrismaRepository,
    @Inject(PrismaPostFactory) private readonly postFactory: PostFactory,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(UserPrismaRepository)
    private readonly userRepository: UserPrismaRepository,
  ) {}

  async execute(dto: CreatePostDto): Promise<PostEntity> {
    // Crear post usando la factory
    const post = await this.postFactory.createPost(dto)

    // Guardar post en la base de datos
    await this.postRepository.createEntity(post)

    await this.userRepository.addPost(
      post.userId.toString(),
      post.id.toString(),
    )

    // Publicar evento usando el patrón Observer
    await this.eventBus.publish(new PostCreatedEvent(post))

    return post
  }
}
