import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { WorkerService } from '../application/worker.service'

const mockGetAllWorkerHandlers = mock(() => [] as any[])

mock.module('../domain/store', () => ({
  getAllWorkerHandlers: mockGetAllWorkerHandlers,
  registerWorkerHandler: mock(() => {}),
}))

const { JobsPlugin } = await import('../jobs-plugin')

function makeWorkerService(): {
  registerWorker: ReturnType<typeof mock>
  startAll: ReturnType<typeof mock>
} {
  return {
    registerWorker: mock(() => {}),
    startAll: mock(() => {}),
  }
}

function makeContainer(
  fakeWorkerService: ReturnType<typeof makeWorkerService>,
) {
  return {
    get: mock((ctor: any) => {
      if (ctor === WorkerService) return fakeWorkerService
      throw new Error(`No service for: ${ctor?.name}`)
    }),
  }
}

describe('JobsPlugin', () => {
  beforeEach(() => {
    mockGetAllWorkerHandlers.mockClear()
    mockGetAllWorkerHandlers.mockReset()
    mockGetAllWorkerHandlers.mockImplementation(() => [])
  })

  describe('metadata', () => {
    test('has correct name', () => {
      expect(new JobsPlugin().name).toBe('jobs-plugin')
    })

    test('has priority 60', () => {
      expect(new JobsPlugin().priority).toBe(60)
    })

    test('dependsOn bootstrap-loader', () => {
      expect(new JobsPlugin().dependsOn).toEqual(['bootstrap-loader'])
    })

    test('is not critical by default', () => {
      expect(new JobsPlugin().critical).toBeUndefined()
    })
  })

  describe('register()', () => {
    test('does not throw with any container', () => {
      const plugin = new JobsPlugin()
      expect(() => plugin.register({} as any)).not.toThrow()
    })
  })

  describe('load()', () => {
    test('returns early when no worker handlers are registered', async () => {
      mockGetAllWorkerHandlers.mockImplementation(() => [])
      const workerService = makeWorkerService()
      const container = makeContainer(workerService)
      const plugin = new JobsPlugin()

      await plugin.load(container as any)

      expect(container.get).not.toHaveBeenCalled()
      expect(workerService.registerWorker).not.toHaveBeenCalled()
      expect(workerService.startAll).not.toHaveBeenCalled()
    })

    test('retrieves WorkerService from container when handlers exist', async () => {
      class EmailJob {}
      mockGetAllWorkerHandlers.mockImplementation(() => [
        {
          target: EmailJob,
          methodName: 'process',
          queueName: 'emails',
          concurrency: 1,
        },
      ])

      const workerService = makeWorkerService()
      const emailInstance = { process: mock(async () => {}) }
      const container = {
        get: mock((ctor: any) => {
          if (ctor === WorkerService) return workerService
          if (ctor === EmailJob) return emailInstance
          throw new Error(`No service for: ${ctor?.name}`)
        }),
      }

      await new JobsPlugin().load(container as any)

      expect(container.get).toHaveBeenCalledWith(WorkerService)
    })

    test('registers a worker for each handler', async () => {
      class EmailJob {}
      class SmsJob {}
      mockGetAllWorkerHandlers.mockImplementation(() => [
        {
          target: EmailJob,
          methodName: 'process',
          queueName: 'emails',
          concurrency: 3,
        },
        {
          target: SmsJob,
          methodName: 'send',
          queueName: 'sms',
          concurrency: 1,
        },
      ])

      const workerService = makeWorkerService()
      const container = {
        get: mock((ctor: any) => {
          if (ctor === WorkerService) return workerService
          if (ctor === EmailJob) return { process: async () => {} }
          if (ctor === SmsJob) return { send: async () => {} }
          throw new Error(`No service for: ${ctor?.name}`)
        }),
      }

      await new JobsPlugin().load(container as any)

      expect(workerService.registerWorker).toHaveBeenCalledTimes(2)
    })

    test('calls registerWorker with correct queueName and concurrency', async () => {
      class ReportJob {}
      mockGetAllWorkerHandlers.mockImplementation(() => [
        {
          target: ReportJob,
          methodName: 'generate',
          queueName: 'reports',
          concurrency: 5,
        },
      ])

      const workerService = makeWorkerService()
      const reportInstance = { generate: mock(async () => {}) }
      const container = {
        get: mock((ctor: any) => {
          if (ctor === WorkerService) return workerService
          if (ctor === ReportJob) return reportInstance
          throw new Error(`No service for: ${ctor?.name}`)
        }),
      }

      await new JobsPlugin().load(container as any)

      const [queueName, processor, concurrency] =
        workerService.registerWorker.mock.calls[0]
      expect(queueName).toBe('reports')
      expect(concurrency).toBe(5)
      expect(typeof processor).toBe('function')
    })

    test('registered processor delegates to the handler method', async () => {
      class InvoiceJob {}
      const processedJobs: any[] = []
      const invoiceInstance = {
        run: mock(async (job: any) => {
          processedJobs.push(job)
        }),
      }

      mockGetAllWorkerHandlers.mockImplementation(() => [
        {
          target: InvoiceJob,
          methodName: 'run',
          queueName: 'invoices',
          concurrency: 1,
        },
      ])

      const workerService = makeWorkerService()
      const container = {
        get: mock((ctor: any) => {
          if (ctor === WorkerService) return workerService
          if (ctor === InvoiceJob) return invoiceInstance
          throw new Error(`No service for: ${ctor?.name}`)
        }),
      }

      await new JobsPlugin().load(container as any)

      const [, processor] = workerService.registerWorker.mock.calls[0]
      const fakeJob = { name: 'generate-invoice', data: { id: 1 } }
      await processor(fakeJob)

      expect(invoiceInstance.run).toHaveBeenCalledTimes(1)
      expect(invoiceInstance.run).toHaveBeenCalledWith(fakeJob)
    })

    test('calls startAll() after registering all workers', async () => {
      class NotifyJob {}
      mockGetAllWorkerHandlers.mockImplementation(() => [
        {
          target: NotifyJob,
          methodName: 'notify',
          queueName: 'notifications',
          concurrency: 2,
        },
      ])

      const workerService = makeWorkerService()
      const container = {
        get: mock((ctor: any) => {
          if (ctor === WorkerService) return workerService
          if (ctor === NotifyJob) return { notify: mock(async () => {}) }
          throw new Error(`No service for: ${ctor?.name}`)
        }),
      }

      await new JobsPlugin().load(container as any)

      expect(workerService.startAll).toHaveBeenCalledTimes(1)
    })

    test('does not call startAll() when there are no handlers', async () => {
      mockGetAllWorkerHandlers.mockImplementation(() => [])

      const workerService = makeWorkerService()
      const container = makeContainer(workerService)

      await new JobsPlugin().load(container as any)

      expect(workerService.startAll).not.toHaveBeenCalled()
    })
  })
})
