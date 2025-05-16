import { Worker, Job } from 'bullmq'
import { Injectable, ConfigService, Logger, Inject, EventBus } from '@EyJs'
import { RedisService } from '../infraestructure/redis.service'
import {
  RegisterWorkerEvent,
  WorkerStartedEvent,
  WorkerStoppedEvent,
} from '../domain/events'

type WorkerDefinition = {
  queueName: string
  processor: (job: Job) => Promise<any>
  concurrency: number
}

@Injectable()
export class WorkerService extends RedisService {
  private workerDefinitions: Map<string, WorkerDefinition>
  private activeWorkers: Map<string, Worker>
  private isRunning: boolean;

  constructor(
    @Inject(ConfigService) config: ConfigService,
    @Inject(Logger) private readonly logger: Logger,
    @Inject(EventBus) private readonly eventBus: EventBus,
  ) {
    super(config)

    this.workerDefinitions = new Map()
    this.activeWorkers = new Map()
    this.isRunning = false
    this.logger = logger
    this.eventBus = eventBus
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

    // Si ya está en marcha, iniciar automáticamente el nuevo worker
    if (this.isRunning) {
      this.startWorker(queueName)
    }

    this.eventBus.publish(
      new RegisterWorkerEvent(queueName, processor, concurrency),
    )
  }

  private startWorker(queueName: string) {
    const def = this.workerDefinitions.get(queueName)
    if (!def || this.activeWorkers.has(queueName)) return

    const worker = new Worker(def.queueName, def.processor, {
      concurrency: def.concurrency,
      connection: this.redisConnection,
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
    this.workerDefinitions.forEach((_, queueName) =>
      this.startWorker(queueName),
    )
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
