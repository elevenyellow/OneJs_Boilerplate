import { Inject } from '@EyJs'
import {
  Collection,
  MongoRepository,
  MongoConnector,
  toObjectIdString,
} from '@EyJs/Mongo'
import { UserEntity } from '@user/domain/entities/user'
import { type OptionalUnlessRequiredId } from 'mongodb'
import { UserMongoModel } from './models/user.mongo'

@Collection('users')
export class UserMongoRepository extends MongoRepository<UserMongoModel> {
  constructor(@Inject(MongoConnector) mongo: MongoConnector) {
    super(mongo, UserMongoModel)
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.findOneById(id) // ✅ habilita populate
    return doc ? this.toEntity(doc) : null
  }

  async createEntity(user: UserEntity): Promise<UserEntity> {
    const result = await super.create(this.toDocument(user))
    const persisted = await this.findOneById(result.insertedId.toHexString())
    return this.toEntity(persisted!)
  }

  async updateEntity(user: UserEntity): Promise<void> {
    await this.updateById(user.id!, this.toDocument(user))
  }

  async deleteEntity(id: string): Promise<void> {
    await this.deleteById(id)
  }

  private toEntity(doc: UserMongoModel): UserEntity {
    return new UserEntity(
      doc.name,
      doc.email,
      doc.postIds,
      toObjectIdString(doc._id),
      doc.createdAt,
      doc.updatedAt,
      doc.posts, // ✅ usa posts poblados si existen
    )
  }

  private toDocument(
    entity: UserEntity,
  ): OptionalUnlessRequiredId<UserMongoModel> {
    return {
      name: entity.name,
      email: entity.email,
      postIds: entity.postIds,
    }
  }
}
