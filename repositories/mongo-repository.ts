import {
  Collection,
  type Filter,
  type Sort,
  type OptionalUnlessRequiredId,
  type InsertOneResult,
  type UpdateResult,
  type DeleteResult,
  type WithId,
  type Db,
  type EnhancedOmit,
} from 'mongodb'
import { MongoConnector } from '../mongo'
import { Inject } from '@EyJs'
import { populate as populateField } from '../utils/populate'
import { getEntityModel } from '../utils/registry'

interface PopulateMeta {
  field: string
  collectionName: string
  many: boolean
  foreignField: string
  localField: string
}

export abstract class MongoRepository<T extends Document> {
  protected collection: Collection<T>
  protected db: Db
  protected modelCtor: new () => T

  constructor(
    @Inject(MongoConnector) mongo: MongoConnector,
    modelCtor: new () => T,
  ) {
    const collectionName = (this.constructor as any).__collectionName

    if (!collectionName) {
      throw new Error(
        `MongoRepository: Missing @Collection() on ${this.constructor.name}`,
      )
    }

    this.db = mongo.db!
    this.modelCtor = modelCtor
    this.collection = mongo.collection(
      collectionName,
    ) as unknown as Collection<T>
  }

  protected hydrate(data: Partial<T> | WithId<T>): T {
    return Object.assign(new this.modelCtor(), data)
  }

  async findAll(
    filter: Filter<T> = {},
    options?: { populate?: boolean },
  ): Promise<WithId<T>[]> {
    const docs = await this.collection.find(filter).toArray()
    const hydrated = docs.map((doc) => this.hydrate(doc) as WithId<T>)

    return options?.populate
      ? this.populateMany(hydrated as WithId<T>[])
      : (hydrated as WithId<T>[])
  }

  async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
    const doc = await this.collection.findOne(filter)
    return doc ? (this.hydrate(doc) as WithId<T>) : null
  }

  async findOneById(
    id: string,
    options: { populate?: boolean } = {},
  ): Promise<WithId<T> | null> {
    const rawDoc = await this.collection.findOne({ id } as unknown as Filter<T>)
    if (!rawDoc) return null

    const doc = this.hydrate(rawDoc) as WithId<T>

    return options.populate ? (this.populate(doc) as unknown as WithId<T>) : doc
  }

  async create(data: OptionalUnlessRequiredId<T>): Promise<InsertOneResult<T>> {
    const now = new Date()
    const document = {
      ...data,
      createdAt: now,
      updatedAt: now,
    } as OptionalUnlessRequiredId<T>

    return this.collection.insertOne(document)
  }

  async updateById(
    id: string,
    data: Partial<T>,
  ): Promise<UpdateResult<Document>> {
    return this.collection.updateOne({ id } as unknown as Filter<T>, {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    })
  }

  async deleteById(id: string): Promise<DeleteResult> {
    return this.collection.deleteOne({ id } as unknown as Filter<T>)
  }

  async findWithPagination(options: {
    filter?: Filter<T>
    limit?: number
    skip?: number
    sort?: Sort
    projection?: Partial<Record<keyof T, 0 | 1>>
    textSearch?: string
    populate?: boolean
  }): Promise<{ data: WithId<T>[]; total: number }> {
    const {
      filter = {},
      limit = 10,
      skip = 0,
      sort = { createdAt: -1 },
      projection,
      textSearch,
      populate = false,
    } = options

    const finalFilter: Filter<T> = textSearch
      ? { ...filter, $text: { $search: textSearch } }
      : filter

    const cursor = this.collection
      .find(finalFilter, { projection })
      .skip(skip)
      .limit(limit)
      .sort(sort)

    const [docs, total] = await Promise.all([
      cursor.toArray(),
      this.collection.countDocuments(finalFilter),
    ])

    const hydrated = docs.map((doc) => this.hydrate(doc as WithId<T>))
    const result = populate
      ? await this.populateMany(hydrated as WithId<T>[])
      : (hydrated as WithId<T>[])
    return { data: result, total }
  }

  async populate(doc: WithId<T>): Promise<WithId<T>> {
    const meta: PopulateMeta[] =
      (doc.constructor as unknown as { __populateMeta: PopulateMeta[] })
        .__populateMeta || []

    for (const rel of meta) {
      const RelatedModel = getEntityModel(rel.collectionName)

      if (!RelatedModel) {
        throw new Error(
          `Did not find model for collection ${rel.collectionName}`,
        )
      }
      await populateField([doc], {
        field: rel.field as keyof EnhancedOmit<T, '_id'>,
        collection: this.db.collection(RelatedModel.__entityMeta.name),
        many: rel.many,
        foreignField: rel.foreignField,
        localField: rel.localField,
      })

      const val = doc[rel.field as keyof WithId<T>]

      if (RelatedModel) {
        if (rel.many && Array.isArray(val)) {
          doc[rel.field as keyof WithId<T>] = val.map((v) =>
            v ? Object.assign(new RelatedModel(), v) : v,
          ) as unknown as WithId<T>[rel.field]
        } else if (val) {
          doc[rel.field as keyof WithId<T>] = Object.assign(
            new RelatedModel(),
            val,
          ) as unknown as WithId<T>[rel.field]
        }
      }
    }

    return doc
  }

  async populateMany(docs: WithId<T>[]): Promise<WithId<T>[]> {
    const meta: PopulateMeta[] =
      (docs[0].constructor as unknown as { __populateMeta: PopulateMeta[] })
        .__populateMeta || []

    for (const rel of meta) {
      const RelatedModel = getEntityModel(rel.collectionName)
      await populateField(docs, {
        field: rel.field as keyof EnhancedOmit<T, '_id'>,
        collection: this.db.collection(RelatedModel.__entityMeta.name),
        many: rel.many,
        foreignField: rel.foreignField,
        localField: rel.localField,
      })

      for (const doc of docs) {
        const val = doc[rel.field as keyof WithId<T>]

        if (RelatedModel) {
          if (rel.many && Array.isArray(val)) {
            doc[rel.field as keyof WithId<T>] = val.map((v) => {
              return v ? Object.assign(new RelatedModel(), v) : v
            }) as unknown as WithId<T>[rel.field]
          } else if (val) {
            doc[rel.field as keyof WithId<T>] = Object.assign(
              new RelatedModel(),
              val,
            ) as unknown as WithId<T>[rel.field]
          }
        }
      }
    }

    return docs
  }
}
