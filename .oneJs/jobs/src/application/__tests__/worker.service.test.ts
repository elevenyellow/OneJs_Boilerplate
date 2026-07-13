import { beforeEach, describe, expect, mock, test } from 'bun:test'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockWorkerOn = mock(() => {})
const mockWorkerClose = mock(async () => {})

mock.module('bullmq', () => {
  class MockWorker {
    on = mockWorkerOn
    close = mockWorkerClose
  }
  class MockJob {}
  class MockQueue {}
  class MockQueueEvents {}
  return {
    Worker: MockWorker,
    Job: MockJob,
    Queue: MockQueue,
    QueueEvents: MockQueueEvents,
  }
})

mock.module('ioredis', () => ({
  default: class MockIORedis {},
}))

const { WorkerService } = await import('../worker.service')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLogger() {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  }
}

function makeEventBus() {
  return { publish: mock(() => {}) }
}

function makeService() {
  const logger = makeLogger()
  const eventBus = makeEventBus()
  const redisService = { connection: {} }
  const service = new WorkerService(
    logger as any,
    eventBus as any,
    redisService as any,
  )
  return { service, logger, eventBus }
}

const fakeProcessor = mock(async (_job: any) => {})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('WorkerService', () => {
  beforeEach(() => {
    mockWorkerOn.mockClear()
    mockWorkerClose.mockClear()
    fakeProcessor.mockClear()
  })

  describe('registerWorker()', () => {
    test('registers a worker definition without throwing', () => {
      const { service } = makeService()
      expect(() =>
        service.registerWorker('emails', fakeProcessor, 2),
      ).not.toThrow()
    })

    test('throws when the same queueName is registered twice', () => {
      const { service } = makeService()
      service.registerWorker('emails', fakeProcessor)

      expect(() => service.registerWorker('emails', fakeProcessor)).toThrow(
        'Worker for queue "emails" is already registered.',
      )
    })

    test('publishes RegisterWorkerEvent', () => {
      const { service, eventBus } = makeService()
      service.registerWorker('emails', fakeProcessor, 3)

      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      const event = (eventBus.publish.mock.calls[0] as any)[0]
      expect(event.constructor.name).toBe('RegisterWorkerEvent')
      expect(event.queueName).toBe('emails')
      expect(event.concurrency).toBe(3)
    })

    test('defaults concurrency to 1', () => {
      const { service, eventBus } = makeService()
      service.registerWorker('sms', fakeProcessor)

      const event = (eventBus.publish.mock.calls[0] as any)[0]
      expect(event.concurrency).toBe(1)
    })
  })

  describe('startAll()', () => {
    test('no workers are started when nothing is registered', () => {
      const { service } = makeService()
      service.startAll()

      expect(mockWorkerOn).not.toHaveBeenCalled()
    })

    test('starts a Worker for each registered queue', () => {
      const { service } = makeService()
      service.registerWorker('emails', fakeProcessor)
      service.registerWorker('sms', fakeProcessor)

      mockWorkerOn.mockClear()
      service.startAll()

      // Each Worker registers 'completed' and 'failed' listeners
      expect(mockWorkerOn.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    test('publishes WorkerStartedEvent for each started worker', () => {
      const { service, eventBus } = makeService()
      service.registerWorker('email', fakeProcessor)

      // Clear register events
      ;(eventBus.publish as any).mockClear()
      service.startAll()

      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      const event = (eventBus.publish.mock.calls[0] as any)[0]
      expect(event.constructor.name).toBe('WorkerStartedEvent')
      expect(event.queueName).toBe('email')
    })

    test('auto-starts worker when registered after startAll', () => {
      const { service } = makeService()
      service.startAll()

      mockWorkerOn.mockClear()
      service.registerWorker('late-queue', fakeProcessor)

      // Worker was started immediately on registration
      expect(mockWorkerOn).toHaveBeenCalled()
    })

    test('does not start the same worker twice', () => {
      const { service } = makeService()
      service.registerWorker('emails', fakeProcessor)
      service.startAll()

      const callsAfterFirst = mockWorkerOn.mock.calls.length
      service.startAll()

      // Should not create additional workers
      expect(mockWorkerOn.mock.calls.length).toBe(callsAfterFirst)
    })
  })

  describe('stopAll()', () => {
    test('stops all active workers', async () => {
      const { service } = makeService()
      service.registerWorker('emails', fakeProcessor)
      service.registerWorker('sms', fakeProcessor)
      service.startAll()

      await service.stopAll()

      expect(mockWorkerClose).toHaveBeenCalledTimes(2)
    })

    test('publishes WorkerStoppedEvent for each stopped worker', async () => {
      const { service, eventBus } = makeService()
      service.registerWorker('emails', fakeProcessor)
      service.startAll()

      ;(eventBus.publish as any).mockClear()
      await service.stopAll()

      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      const event = (eventBus.publish.mock.calls[0] as any)[0]
      expect(event.constructor.name).toBe('WorkerStoppedEvent')
      expect(event.queueName).toBe('emails')
    })

    test('does nothing when no workers are active', async () => {
      const { service } = makeService()
      await service.stopAll()

      expect(mockWorkerClose).not.toHaveBeenCalled()
    })

    test('clears active workers after stopping', async () => {
      const { service } = makeService()
      service.registerWorker('emails', fakeProcessor)
      service.startAll()
      await service.stopAll()

      mockWorkerClose.mockClear()
      await service.stopAll()

      // Second stopAll should do nothing
      expect(mockWorkerClose).not.toHaveBeenCalled()
    })
  })
})
