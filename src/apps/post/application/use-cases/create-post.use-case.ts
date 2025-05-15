import { Injectable, Inject } from '@EyJs'
import type { PostFactory } from '../../domain/factories/post-factory.interface'
import type { PostEntity } from '../../domain/entities/post'
import { CreatePostDto } from '../../domain/dtos/create-post.dto'
import { MongoPostFactory } from '@post/infrastructure/factories/mongo-post-factory'
import { PostCreatedEvent } from '../../domain/events/post-created.event'
import { EventBus } from '@EyJs'
import { PostMongoRepository } from '@post/infrastructure/persistance/mongo/post.repository'

@Injectable()
export class CreatePostUseCase {
  constructor(
    @Inject(PostMongoRepository) private readonly postRepository: PostMongoRepository,
    @Inject(MongoPostFactory) private readonly postFactory: PostFactory,
    @Inject(EventBus) private readonly eventBus: EventBus
  ) {}

  async execute(dto: CreatePostDto): Promise<PostEntity> {
    // Crear post usando la factory
    const post = await this.postFactory.createPost(dto)

    // Guardar post en la base de datos
    await this.postRepository.createEntity(post)

    // Publicar evento usando el patrón Observer
    await this.eventBus.publish(new PostCreatedEvent(post))

    return post
  }
}
