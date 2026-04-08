import { Inject, Injectable, Logger } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { Job, Worker } from 'bullmq'
import IORedis from 'ioredis'
import {
  RegisterWorkerEvent,
  WorkerStartedEvent,
  WorkerStoppedEvent,
} from '../domain/events'
import { RedisService } from '../infrastructure/redis'

type WorkerDefinition = {
  queueName: string
  processor: (job: Job) => Promise<any>
  concurrency: number
}

@Injectable()
export class WorkerService {
  private workerDefinitions: Map<string, WorkerDefinition>
  private activeWorkers: Map<string, Worker>
  private isRunning: boolean
  private readonly connection: IORedis

  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(RedisService) redisService: RedisService,
  ) {
    this.connection = redisService.connection
    this.workerDefinitions = new Map()
    this.activeWorkers = new Map()
    this.isRunning = false
  }

  registerWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    concurrency: number = 1,
  ) {
    if (this.workerDefinitions.has(queueName)) {
      throw new Error(`Worker for queue "${queueName}" is already registered.`)
    }

    this.workerDefinitions.set(queueName, { queueName, processor, concurrency })

    this.eventBus.publish(
      new RegisterWorkerEvent(queueName, processor, concurrency),
    )

    // Autoarranque si ya estaba activo
    if (this.isRunning) {
      this.startWorker(queueName)
    }
  }

  private startWorker(queueName: string) {
    const def = this.workerDefinitions.get(queueName)
    if (!def || this.activeWorkers.has(queueName)) return

    const worker = new Worker(def.queueName, def.processor, {
      concurrency: def.concurrency,
      connection: this.connection,
      // Extend lock duration for long-running jobs (30 minutes)
      lockDuration: 1800000,
      // Renew the lock every 5 minutes to prevent stalling
      lockRenewTime: 300000,
      // Check for stalled jobs every 10 minutes
      stalledInterval: 600000,
      // Maximum number of times a job can be stalled before being failed
      maxStalledCount: 2,
    })

    worker.on('completed', (job) => {
      this.logger.info(`✅ Job "${job.name}" completed in "${queueName}"`)
    })

    worker.on('failed', (job, err) => {
      this.logger.error(`❌ Job "${job?.name}" failed in "${queueName}":`, err)
    })

    this.activeWorkers.set(queueName, worker)
    this.logger.info(`🚀 Worker started for queue "${queueName}"`)

    this.eventBus.publish(new WorkerStartedEvent(queueName, worker))
  }

  startAll() {
    this.isRunning = true

    for (const queueName of this.workerDefinitions.keys()) {
      this.startWorker(queueName)
    }
  }

  async stopAll() {
    for (const [queueName, worker] of this.activeWorkers) {
      await worker.close()
      this.logger.info(`🛑 Worker for "${queueName}" stopped`)

      this.eventBus.publish(new WorkerStoppedEvent(queueName, worker))
    }

    this.activeWorkers.clear()
    this.isRunning = false
  }
}
