import { MongoRepository, MongoConnector, Collection } from '@EyJs/Mongo'
import { Inject } from '@EyJs'
import { PostEntity } from '@post/domain/entities/post'
import { PostMongoModel } from './models/post.mongo'
import { type OptionalUnlessRequiredId } from 'mongodb'
import { Id } from '@user/domain/value-objects/id'
import { UserEntity } from '@user/domain/entities/user.entity'
@Collection('posts')
export class PostMongoRepository extends MongoRepository<PostMongoModel> {
  constructor(@Inject(MongoConnector) mongo: MongoConnector) {
    super(mongo, PostMongoModel)
  }

  /** Sobrescribe el modelo para permitir populate */
  protected getModelCtor(): new () => PostMongoModel {
    return PostMongoModel
  }

  async findByUserId(
    userId: string,
    options?: { populate?: boolean },
  ): Promise<PostEntity[]> {
    const docs = await this.findAll({ userId }, options)

    return docs.map(this.toEntity)
  }

  async findByTitle(title: string): Promise<PostEntity[]> {
    const docs = await this.findAll({
      title: { $regex: title, $options: 'i' },
    })

    return docs.map(this.toEntity)
  }

  async createEntity(post: PostEntity): Promise<PostEntity> {
    const doc = this.toDocument(post)

    await this.create(doc)

    const persisted = await this.findOneById(post.id.toString())

    return this.toEntity(persisted!)
  }

  async updateEntity(post: PostEntity): Promise<void> {
    await this.updateById(post.id!, this.toDocument(post))
  }

  async deleteEntity(id: string): Promise<void> {
    await this.deleteById(id)
  }

  private toEntity = (doc: PostMongoModel): PostEntity => {
    return new PostEntity(
      Id.createFrom(doc.id),
      doc.title,
      doc.content,
      doc.userId,
      doc.createdAt,
      doc.updatedAt,
      doc.user
        ? new UserEntity(
            Id.createFrom(doc.user.id),
            doc.user.name,
            doc.user.email,
            doc.user.password,
            doc.user.postIds,
            doc.user.createdAt,
            doc.user.updatedAt,
          )
        : undefined,
    )
  }

  private toDocument(
    post: PostEntity,
  ): OptionalUnlessRequiredId<PostMongoModel> {
    return {
      id: post.id.toString(),
      title: post.title,
      content: post.content,
      userId: post.userId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }
  }
}
