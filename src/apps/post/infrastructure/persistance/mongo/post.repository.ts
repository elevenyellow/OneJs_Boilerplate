import {
  MongoRepository,
  MongoConnector,
  toObjectIdString,
  Collection,
} from '@EyJs/Mongo'
import { Inject } from '@EyJs'
import { PostEntity } from '@post/domain/entities/post'
import { PostMongoModel } from './models/post.mongo'
import { type OptionalUnlessRequiredId } from 'mongodb'

@Collection('posts')
export class PostMongoRepository extends MongoRepository<PostMongoModel> {
  constructor(@Inject(MongoConnector) mongo: MongoConnector) {
    super(mongo, PostMongoModel)
  }

  /** Sobrescribe el modelo para permitir populate */
  protected getModelCtor(): new () => PostMongoModel {
    return PostMongoModel
  }

  async findByUserId(userId: string): Promise<PostEntity[]> {
    const docs = await this.findAll({ userId })
    return docs.map(this.toEntity)
  }

  async findByTitle(title: string): Promise<PostEntity[]> {
    const docs = await this.findAll({
      title: { $regex: title, $options: 'i' },
    })
    return docs.map(this.toEntity)
  }

  async createEntity(post: PostEntity): Promise<PostEntity> {
    const result = await this.create(this.toDocument(post))
    const persisted = await this.findOneById(result.insertedId.toHexString())
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
      doc.title,
      doc.content,
      doc.userId,
      toObjectIdString(doc._id),
      doc.createdAt,
      doc.updatedAt,
    )
  }

  private toDocument(
    post: PostEntity,
  ): OptionalUnlessRequiredId<PostMongoModel> {
    return {
      title: post.title,
      content: post.content,
      userId: post.userId,
    }
  }
}
