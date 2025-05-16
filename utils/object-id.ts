import { ObjectId } from 'mongodb'

export function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`)
  }
  return new ObjectId(id)
}

export function toObjectIdString(
  id?: ObjectId | string | null,
): string | undefined {
  return typeof id === 'string' ? id : id?.toHexString()
}
