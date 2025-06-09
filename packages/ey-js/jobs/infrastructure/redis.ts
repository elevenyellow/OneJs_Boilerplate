import { Injectable, ConfigService, Inject } from '@EyJs'
import IORedis from 'ioredis'

@Injectable()
export class RedisService {
  readonly connection: IORedis

  constructor(@Inject(ConfigService) config: ConfigService) {
    const redisUrl = config.get('REDIS_URL')

    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined')
    }

    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    })
  }
}
