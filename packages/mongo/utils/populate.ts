import { Collection } from 'mongodb'

type PopulateOptions<T, K extends keyof T> = {
  field: K // el campo a reemplazar (userId o postIds)
  collection: Collection<any> // colección de destino
  many?: boolean // 1:N si es true
  foreignField?: string // default: "_id"
  localField?: string // default: field
}

export async function populate<
  T extends Record<string, any>,
  K extends keyof T,
>(docs: T[], options: PopulateOptions<T, K>): Promise<T[]> {
  const {
    field,
    collection,
    many = false,
    localField,
    foreignField = 'id',
  } = options

  const values = docs.flatMap((doc) => {
    const val = localField && doc[localField] ? doc[localField] : doc[field]

    if (many && Array.isArray(val)) return val
    if (!many && val) return [val]
    return []
  })

  const ids = [...new Set(values.map((v) => v))]

  const relatedDocs = await collection
    .find({ [foreignField]: { $in: ids } })
    .toArray()

  const relatedMap = new Map(
    relatedDocs.map((doc) => [doc[foreignField]?.toString(), doc]),
  )

  const fullDocs = docs.map((doc) => {
    const val = localField && doc[localField] ? doc[localField] : doc[field]

    if (many && Array.isArray(val)) {
      doc[field] = val
        .map((v: any) => {
          return relatedMap.get(v)
        })
        .filter(Boolean)
    } else if (!many && val) {
      doc[field] = relatedMap.get(val) || val
    }

    if (localField) delete doc[localField]

    return doc
  })

  return fullDocs
}
