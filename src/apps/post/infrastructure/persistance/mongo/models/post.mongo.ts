// models/post.mongo.ts
import { Entity, type MongoEntityBase, OneToOne } from '@EyJs/Mongo'
import type { UserMongoModel } from '@user/infrastructure/mongo/models/user.mongo'
import type { ObjectId } from 'mongodb'

@Entity({
  name: 'posts',
  schema: {
    title: 'string',
    content: 'string',
    userId: 'string',
  },
})
export class PostMongoModel implements MongoEntityBase {
  _id?: ObjectId
  createdAt?: Date
  updatedAt?: Date

  title!: string
  content!: string

  userId!: string

  @OneToOne({ collection: 'users', foreignField: '_id', localField: 'userId' })
  user?: UserMongoModel
}
