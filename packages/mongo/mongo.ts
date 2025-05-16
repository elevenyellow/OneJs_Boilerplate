import { MongoClient, Db } from 'mongodb'
import { Inject, Injectable, Logger } from '@EyJs'

@Injectable()
export class MongoConnector {
  public db?: Db;

  constructor(@Inject(Logger) private readonly logger: Logger) {
    this.db = undefined
  }

  async connect(url: string) {
    this.logger.info(`Connection to mongo url ${url}`)

    const client = new MongoClient(url, { retryWrites: false })
    await client.connect()

    const dbName = url.split('/').slice(-1)[0].split('?')[0]

    this.db = client.db(dbName)
  }

  collection(collection: string) {
    if (this.db) return this.db.collection(collection)
    throw new Error('MongoClient.collection: db is not initialized')
  }
}
