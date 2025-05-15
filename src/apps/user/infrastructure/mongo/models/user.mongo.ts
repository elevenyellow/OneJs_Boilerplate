import { Entity, OneToMany, type MongoEntityBase } from '@EyJs/Mongo'
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
  id!: string
  name!: string
  email!: string
  password!: string
  postIds!: string[]
  createdAt!: Date
  updatedAt!: Date

  @OneToMany({
    collection: 'posts',
    foreignField: 'id',
    localField: 'postIds',
  })
  posts?: PostMongoModel[]
}
