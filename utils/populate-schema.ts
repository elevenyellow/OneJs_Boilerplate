import { ObjectId } from 'mongodb'
import { container } from '@EyJs'
import { MongoConnector } from '../mongo'
import type { PopulateMetadata } from '../decorators/populate'

export async function populateDocument<T extends object>(doc: T): Promise<T> {
  const ctor = doc.constructor as any
  const meta = ctor.__populateMeta as PopulateMetadata[] | undefined
  if (!meta) return doc

  const mongo = container.get(MongoConnector)

  for (const { field, collectionName, many, foreignField = '_id' } of meta) {
    const collection = mongo.collection(collectionName)
    const ref = (doc as any)[field]

    if (many && Array.isArray(ref)) {
      const ids = ref.map((v: any) => new ObjectId(v))
      const results = await collection
        .find({ [foreignField]: { $in: ids } })
        .toArray()
      const map = new Map(results.map((r) => [r[foreignField].toString(), r]))
      ;(doc as any)[field] = ids
        .map((id) => map.get(id.toString()))
        .filter(Boolean)
    }

    if (!many && ref) {
      const result = await collection.findOne({
        [foreignField]: new ObjectId(ref),
      })
      if (result) (doc as any)[field] = result
    }
  }

  return doc
}

export async function populateMany<T extends object>(docs: T[]): Promise<T[]> {
  const mongo = container.get(MongoConnector)
  const cache = new Map<string, Map<string, any>>() // collection → (id → doc)

  for (const doc of docs) {
    const ctor = doc.constructor as any
    const meta = ctor.__populateMeta as PopulateMetadata[] | undefined
    if (!meta) continue

    for (const { field, collectionName, many, foreignField = '_id' } of meta) {
      const ref = (doc as any)[field]
      if (!ref) continue

      const collection = mongo.collection(collectionName)
      const collectionCache = cache.get(collectionName) || new Map()
      cache.set(collectionName, collectionCache)

      if (many && Array.isArray(ref)) {
        const missing = ref.filter(
          (id: any) => !collectionCache.has(id.toString()),
        )
        if (missing.length) {
          const results = await collection
            .find({
              [foreignField]: {
                $in: missing.map((id: any) => new ObjectId(id)),
              },
            })
            .toArray()
          results.forEach((r) =>
            collectionCache.set(r[foreignField].toString(), r),
          )
        }
        ;(doc as any)[field] = ref
          .map((id: any) => collectionCache.get(id.toString()))
          .filter(Boolean)
      }

      if (!many && ref) {
        const key = ref.toString()
        if (!collectionCache.has(key)) {
          const result = await collection.findOne({
            [foreignField]: new ObjectId(key),
          })
          if (result) collectionCache.set(key, result)
        }
        ;(doc as any)[field] = collectionCache.get(key) || ref
      }
    }
  }

  return docs
}
