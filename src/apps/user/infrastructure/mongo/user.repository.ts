import { Inject, EyJsError } from '@EyJs'
import { Collection, MongoRepository, MongoConnector } from '@EyJs/Mongo'
import { UserEntity } from '@user/domain/entities/user.entity'
import { type OptionalUnlessRequiredId } from 'mongodb'
import { UserMongoModel } from './models/user.mongo'
import { Id } from '@user/domain/value-objects/id'
import { PostEntity } from '@post/domain/entities/post'

@Collection('users')
export class UserMongoRepository extends MongoRepository<
  UserMongoModel & Document
> {
  constructor(@Inject(MongoConnector) mongo: MongoConnector) {
    super(mongo, UserMongoModel as any)
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.findOneById(id, { populate: true }) // Habilitamos populate para cargar los posts
    return doc ? this.toEntity(doc) : null
  }

  async createEntity(user: UserEntity): Promise<UserEntity> {
    const result = await super.create(this.toDocument(user))

    const persisted = await this.findOneById(result.insertedId.toHexString())
    return this.toEntity(persisted!)
  }

  async updateEntity(user: UserEntity): Promise<void> {
    await this.updateById(user.id.toString(), this.toDocument(user))
  }

  async addPost(userId: string, postId: string): Promise<void> {
    const user = await this.findOneById(userId)

    if (!user) throw new EyJsError('USER_NOT_FOUND', 404, 'User not found')

    await this.updateById(userId, {
      postIds: [...user.postIds, postId],
    })
  }

  async deleteEntity(id: string): Promise<void> {
    await this.deleteById(id)
  }

  private toEntity(doc: UserMongoModel): UserEntity {
    const posts =
      doc.posts?.map(
        (post) =>
          new PostEntity(
            Id.createFrom(post.id),
            post.title,
            post.content,
            post.userId,
            post.createdAt,
            post.updatedAt,
          ),
      ) || []

    return new UserEntity(
      Id.createFrom(doc.id),
      doc.name,
      doc.email,
      doc.password,
      doc.postIds,
      doc.createdAt,
      doc.updatedAt,
      posts,
    )
  }

  private toDocument(
    entity: UserEntity,
  ): OptionalUnlessRequiredId<UserMongoModel> {
    return {
      id: entity.id.toString(),
      name: entity.name,
      email: entity.email,
      password: entity.password,
      postIds: entity.postIds,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
      posts: entity.posts?.map((post) => ({
        id: post.id.toString(),
        title: post.title,
        content: post.content,
        userId: post.userId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
    }
  }
}
