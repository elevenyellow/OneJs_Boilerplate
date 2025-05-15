import { Inject } from '@EyJs'
import { Collection, MongoRepository, MongoConnector } from '@EyJs/Mongo'
import { UserEntity } from '@user/domain/entities/user.entity'
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
      doc._id.toHexString(),
      doc.name,
      doc.email,
      doc.postIds,
      doc.createdAt,
      doc.updatedAt,
      doc.posts, // ✅ usa posts poblados si existen
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
    }
  }
}
