// DEPRECATED: Worker job example - no longer needed

/*
import { Injectable, logger } from '@OneJs'
import { WorkerJob } from '@OneJs/jobs'

@Injectable()
export class SampleWorker {
  @WorkerJob('sample-queue')
  async process(data: { message: string }) {
    logger.info('worker:sample', `Processing job with message: ${data.message}`)
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1000))
    logger.info('worker:sample', 'Job completed')
  }
}
*/
