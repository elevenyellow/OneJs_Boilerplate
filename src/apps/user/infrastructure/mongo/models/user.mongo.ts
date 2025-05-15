import { Entity, OneToMany, type MongoEntityBase } from '@EyJs/Mongo'
import type { ObjectId } from 'mongodb'
import { PostMongoModel } from '@post/infrastructure/persistance/mongo/models/post.mongo'

@Entity({
  name: 'users',
  schema: {
    name: 'string',
    email: 'string',
    postIds: 'array',
  },
})
export class UserMongoModel implements MongoEntityBase {
  _id?: ObjectId
  createdAt?: Date
  updatedAt?: Date

  name!: string
  email!: string
  postIds!: string[]

  @OneToMany({
    collection: 'posts',
    foreignField: '_id',
    localField: 'postIds',
  })
  posts?: PostMongoModel[]
}
