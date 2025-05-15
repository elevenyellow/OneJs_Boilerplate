import { Entity, OneToMany, type MongoEntityBase } from '@EyJs/Mongo'
import type { ObjectId } from 'mongodb'
import { PostMongoModel } from '@post/infrastructure/persistance/mongo/models/post.mongo'

@Entity({
  name: 'users',
  schema: {
    id: 'string',
    name: 'string',
    email: 'string',
    password: 'string',
    postIds: 'array',
    createdAt: 'date',
    updatedAt: 'date',
  },
})
export class UserMongoModel implements MongoEntityBase {
  _id!: ObjectId
  id!: string
  name!: string
  email!: string
  password!: string
  postIds!: string[]
  createdAt!: Date
  updatedAt!: Date

  @OneToMany({
    collection: 'posts',
    foreignField: '_id',
    localField: 'postIds',
  })
  posts?: PostMongoModel[]
}
