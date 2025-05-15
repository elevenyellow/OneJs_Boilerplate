// models/post.mongo.ts
import { Entity, type MongoEntityBase, OneToOne } from '@EyJs/Mongo'
import type { UserMongoModel } from '@user/infrastructure/mongo/models/user.mongo'
import type { ObjectId } from 'mongodb'

@Entity({
  name: 'posts',
  schema: {
    id: 'string',
    title: 'string',
    content: 'string',
    userId: 'string',
    createdAt: 'date',
    updatedAt: 'date',
  },
})
export class PostMongoModel implements MongoEntityBase {
  _id?: ObjectId
  id!: string
  title!: string
  content!: string
  userId!: string
  createdAt?: Date
  updatedAt?: Date

  @OneToOne({ collection: 'users', foreignField: 'id', localField: 'userId' })
  user?: UserMongoModel
}
