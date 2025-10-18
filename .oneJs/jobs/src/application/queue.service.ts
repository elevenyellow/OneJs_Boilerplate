import { Inject, Injectable, Logger } from '@OneJs'
import { Job, Queue, QueueEvents, type JobsOptions } from 'bullmq'
import crypto from 'crypto'
import IORedis from 'ioredis'
import moment from 'moment'
import { RedisService } from '../infrastructure/redis'

@Injectable()
export class QueueService {
  private queues: Map<string, Queue>
  private queueEvents: Map<string, QueueEvents>
  private readonly redisConnection: IORedis

  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(RedisService) redisService: RedisService,
  ) {
    this.redisConnection = redisService.connection

    this.queues = new Map()
    this.queueEvents = new Map()
  }

  /** Obtiene o crea una cola con conexión compartida */
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, { connection: this.redisConnection })
      this.queues.set(name, queue)

      const events = new QueueEvents(name, {
        connection: this.redisConnection,
      })
      this.queueEvents.set(name, events)
    }
    return this.queues.get(name)!
  }

  /** Añadir un trabajo a la cola con nombre y opciones */
  async add(
    queueName: string,
    jobName: string,
    data: Record<string, any>,
    options?: JobsOptions,
  ) {
    const queue = this.getQueue(queueName)
    this.logger.debug(
      'oneJs:jobs',
      `add ${queueName} ${jobName} ${JSON.stringify(data)} ${JSON.stringify(options)}`,
    )

    return queue.add(jobName, data, options)
  }

  /** Añadir trabajo único (usando jobId explícito) */
  async addUnique(
    queueName: string,
    jobName: string,
    jobId: string,
    data: Record<string, any>,
    options?: JobsOptions,
  ) {
    const queue = this.getQueue(queueName)
    return queue.add(jobName, data, {
      jobId,
      ...options,
    })
  }

  /**
   * Añadir trabajo único usando un jobId derivado del contenido del job.
   * Evita duplicados sin buscar manualmente en toda la cola.
   */
  async addUniqueByData(
    queueName: string,
    jobName: string,
    data: Record<string, any>,
    options?: JobsOptions,
  ): Promise<Job | null> {
    const jobId = this.generateJobId(jobName, data)
    const queue = this.getQueue(queueName)
    const existing = await queue.getJob(jobId)

    if (existing) {
      this.logger.debug(
        'oneJs:jobs',
        `[SKIP] Job "${jobId}" for ${JSON.stringify(data)} already exists`,
      )
      return null
    }

    this.logger.debug(
      'oneJs:jobs',
      `[ADD] Unique job "${jobId}" will run in ${options?.delay ? `${moment().add(options?.delay, 'milliseconds').fromNow()}` : ''}`,
      data,
    )
    return queue.add(jobName, data, {
      jobId,
      ...options,
    })
  }

  /** Generador de jobId hash desde nombre + contenido */
  private generateJobId(jobName: string, data: Record<string, any>): string {
    const key = JSON.stringify(data, Object.keys(data).sort())
    const base = `${jobName}:${key}`
    return crypto.createHash('sha1').update(base).digest('hex')
  }

  async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName)
    await queue.pause()
  }

  async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName)
    await queue.resume()
  }

  async cleanQueue(
    queueName: string,
    graceTime = 0,
    status: 'completed' | 'failed' = 'completed',
  ) {
    const queue = this.getQueue(queueName)
    return queue.clean(graceTime, 1000, status)
  }

  async getQueueMetrics(queueName: string) {
    const queue = this.getQueue(queueName)
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])

    return { waiting, active, completed, failed, delayed }
  }

  async getJobs(
    queueName: string,
    status: 'completed' | 'failed' | 'delayed' | 'waiting' | 'active',
    start = 0,
    end = -1,
  ) {
    const queue = this.getQueue(queueName)
    return queue.getJobs([status], start, end)
  }

  async closeQueue(queueName: string) {
    const queue = this.queues.get(queueName)
    if (queue) {
      await queue.close()
      this.queues.delete(queueName)
    }

    const events = this.queueEvents.get(queueName)
    if (events) {
      await events.close()
      this.queueEvents.delete(queueName)
    }
  }
}
