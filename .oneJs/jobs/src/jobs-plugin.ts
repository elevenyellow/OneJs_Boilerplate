import { type BootstrapPlugin, type Container, logger } from '@OneJs/core'
import { WorkerService } from './application/worker.service'
import { getAllWorkerHandlers } from './domain/store'

export class JobsPlugin implements BootstrapPlugin {
  name = 'jobs-plugin'
  priority = 60
  dependsOn = ['bootstrap-loader']

  register(container: Container): void {
    // Plugin itself doesn't need to register services - decorators handle it
    // Just log plugin registration
    logger.debug('oneJs:jobs', '📝 Jobs plugin registered')
  }

  async load(container: Container): Promise<void> {
    const handlers = getAllWorkerHandlers()

    if (handlers.length === 0) {
      logger.debug('oneJs:jobs', 'No worker handlers found')
      return
    }

    logger.debug(
      'oneJs:jobs',
      `🚀 Registering ${handlers.length} worker handler(s)...`,
    )

    const workerService = container.get(WorkerService)

    for (const { target, methodName, queueName, concurrency } of handlers) {
      const instance = container.get(target)
      const processor = instance[methodName].bind(instance)
      workerService.registerWorker(queueName, processor, concurrency)
    }

    if (handlers.length > 0) {
      logger.debug('oneJs:jobs', '🔧 Starting workers...')
      workerService.startAll()
    }

    logger.debug('oneJs:jobs', '✅ Worker handlers registered')
  }
}
