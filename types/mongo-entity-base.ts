import { ObjectId } from 'mongodb'

export interface MongoEntityBase {
  _id?: ObjectId
  createdAt?: Date
  updatedAt?: Date
}
