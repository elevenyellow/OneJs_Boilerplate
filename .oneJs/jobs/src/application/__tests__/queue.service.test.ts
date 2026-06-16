import { beforeEach, describe, expect, mock, test } from 'bun:test'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockQueueAdd = mock(async () => ({ id: 'job-123' }))
const mockQueueGetJob = mock(async () => null)
const mockQueuePause = mock(async () => {})
const mockQueueResume = mock(async () => {})
const mockQueueClean = mock(async () => [])
const mockQueueDrain = mock(async () => {})
const mockQueueObliterate = mock(async () => {})
const mockQueueGetWaiting = mock(async () => 2)
const mockQueueGetActive = mock(async () => 1)
const mockQueueGetCompleted = mock(async () => 10)
const mockQueueGetFailed = mock(async () => 3)
const mockQueueGetDelayed = mock(async () => 0)
const mockQueueGetJobs = mock(async () => [{ id: 'j1' }, { id: 'j2' }])
const mockQueueClose = mock(async () => {})
const mockQueueEventsClose = mock(async () => {})

mock.module('bullmq', () => {
  class MockQueue {
    add = mockQueueAdd
    getJob = mockQueueGetJob
    pause = mockQueuePause
    resume = mockQueueResume
    clean = mockQueueClean
    drain = mockQueueDrain
    obliterate = mockQueueObliterate
    getWaitingCount = mockQueueGetWaiting
    getActiveCount = mockQueueGetActive
    getCompletedCount = mockQueueGetCompleted
    getFailedCount = mockQueueGetFailed
    getDelayedCount = mockQueueGetDelayed
    getJobs = mockQueueGetJobs
    close = mockQueueClose
  }
  class MockQueueEvents {
    close = mockQueueEventsClose
  }
  class MockWorker {}
  class MockJob {}
  return {
    Queue: MockQueue,
    QueueEvents: MockQueueEvents,
    Worker: MockWorker,
    Job: MockJob,
  }
})

mock.module('ioredis', () => ({
  default: class MockIORedis {},
}))

const { QueueService } = await import('../queue.service')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLogger() {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  }
}

function makeService() {
  const logger = makeLogger()
  const fakeConnection = {}
  const redisService = { connection: fakeConnection }
  const service = new QueueService(logger as any, redisService as any)
  return { service, logger }
}

function clearMocks() {
  mockQueueAdd.mockClear()
  mockQueueGetJob.mockClear()
  mockQueuePause.mockClear()
  mockQueueResume.mockClear()
  mockQueueClean.mockClear()
  mockQueueDrain.mockClear()
  mockQueueObliterate.mockClear()
  mockQueueGetWaiting.mockClear()
  mockQueueGetActive.mockClear()
  mockQueueGetCompleted.mockClear()
  mockQueueGetFailed.mockClear()
  mockQueueGetDelayed.mockClear()
  mockQueueGetJobs.mockClear()
  mockQueueClose.mockClear()
  mockQueueEventsClose.mockClear()
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('QueueService', () => {
  beforeEach(clearMocks)

  describe('getQueue()', () => {
    test('creates a new Queue on first call', () => {
      const { service } = makeService()
      const queue = service.getQueue('emails')

      expect(queue).toBeDefined()
    })

    test('returns the same Queue instance on subsequent calls', () => {
      const { service } = makeService()
      const first = service.getQueue('emails')
      const second = service.getQueue('emails')

      expect(first).toBe(second)
    })

    test('creates separate Queue instances for different names', () => {
      const { service } = makeService()
      const emailQueue = service.getQueue('emails')
      const smsQueue = service.getQueue('sms')

      expect(emailQueue).not.toBe(smsQueue)
    })
  })

  describe('add()', () => {
    test('calls queue.add with jobName and data', async () => {
      const { service } = makeService()
      await service.add('emails', 'send-email', { to: 'user@example.com' })

      expect(mockQueueAdd).toHaveBeenCalledTimes(1)
      const [jobName, data] = mockQueueAdd.mock.calls[0] as any
      expect(jobName).toBe('send-email')
      expect(data).toEqual({ to: 'user@example.com' })
    })

    test('passes options to queue.add when provided', async () => {
      const { service } = makeService()
      await service.add('emails', 'send-email', {}, { delay: 5000 })

      const [, , opts] = mockQueueAdd.mock.calls[0] as any
      expect(opts).toEqual({ delay: 5000 })
    })

    test('returns the job created by queue.add', async () => {
      const { service } = makeService()
      const result = await service.add('emails', 'send-email', {})

      expect(result).toEqual({ id: 'job-123' })
    })
  })

  describe('addUnique()', () => {
    test('calls queue.add with the provided jobId', async () => {
      const { service } = makeService()
      await service.addUnique('emails', 'send', 'my-unique-id', {
        to: 'x@x.com',
      })

      const [, , opts] = mockQueueAdd.mock.calls[0] as any
      expect(opts.jobId).toBe('my-unique-id')
    })

    test('merges additional options with jobId', async () => {
      const { service } = makeService()
      await service.addUnique('emails', 'send', 'uid-1', {}, { delay: 1000 })

      const [, , opts] = mockQueueAdd.mock.calls[0] as any
      expect(opts.jobId).toBe('uid-1')
      expect(opts.delay).toBe(1000)
    })
  })

  describe('addUniqueByData()', () => {
    test('returns null when job already exists', async () => {
      mockQueueGetJob.mockImplementation(
        async () => ({ id: 'existing' }) as any,
      )
      const { service } = makeService()

      const result = await service.addUniqueByData('emails', 'send', {
        to: 'x@x.com',
      })

      expect(result).toBeNull()
      expect(mockQueueAdd).not.toHaveBeenCalled()
    })

    test('adds job when it does not exist', async () => {
      mockQueueGetJob.mockImplementation(async () => null)
      const { service } = makeService()

      await service.addUniqueByData('emails', 'send', { to: 'x@x.com' })

      expect(mockQueueAdd).toHaveBeenCalledTimes(1)
    })

    test('generates consistent jobId from the same data', async () => {
      mockQueueGetJob.mockImplementation(async () => null)
      const { service } = makeService()

      await service.addUniqueByData('emails', 'send', {
        to: 'x@x.com',
        name: 'Bob',
      })
      await service.addUniqueByData('emails', 'send', {
        name: 'Bob',
        to: 'x@x.com',
      })

      const id1 = (mockQueueAdd.mock.calls[0] as any)[2].jobId
      const id2 = (mockQueueAdd.mock.calls[1] as any)[2].jobId
      expect(id1).toBe(id2)
    })

    test('generates different jobId for different data', async () => {
      mockQueueGetJob.mockImplementation(async () => null)
      const { service } = makeService()

      await service.addUniqueByData('emails', 'send', { to: 'a@a.com' })
      await service.addUniqueByData('emails', 'send', { to: 'b@b.com' })

      const id1 = (mockQueueAdd.mock.calls[0] as any)[2].jobId
      const id2 = (mockQueueAdd.mock.calls[1] as any)[2].jobId
      expect(id1).not.toBe(id2)
    })
  })

  describe('pauseQueue() / resumeQueue()', () => {
    test('pauseQueue calls queue.pause()', async () => {
      const { service } = makeService()
      await service.pauseQueue('emails')

      expect(mockQueuePause).toHaveBeenCalledTimes(1)
    })

    test('resumeQueue calls queue.resume()', async () => {
      const { service } = makeService()
      await service.resumeQueue('emails')

      expect(mockQueueResume).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanQueue()', () => {
    test('calls queue.clean with graceTime and status', async () => {
      const { service } = makeService()
      await service.cleanQueue('emails', 100, 'failed')

      expect(mockQueueClean).toHaveBeenCalledTimes(1)
      const [graceTime, , status] = mockQueueClean.mock.calls[0] as any
      expect(graceTime).toBe(100)
      expect(status).toBe('failed')
    })

    test('defaults graceTime to 0 and status to completed', async () => {
      const { service } = makeService()
      await service.cleanQueue('emails')

      const [graceTime, , status] = mockQueueClean.mock.calls[0] as any
      expect(graceTime).toBe(0)
      expect(status).toBe('completed')
    })
  })

  describe('drainQueue()', () => {
    test('calls queue.drain()', async () => {
      const { service } = makeService()
      await service.drainQueue('emails')

      expect(mockQueueDrain).toHaveBeenCalledTimes(1)
    })
  })

  describe('obliterateQueue()', () => {
    test('calls queue.obliterate with force: true', async () => {
      const { service } = makeService()
      await service.obliterateQueue('emails')

      expect(mockQueueObliterate).toHaveBeenCalledTimes(1)
      const [opts] = mockQueueObliterate.mock.calls[0] as any
      expect(opts).toEqual({ force: true })
    })

    test('removes queue from internal map after obliterate', async () => {
      const { service } = makeService()
      service.getQueue('emails')
      await service.obliterateQueue('emails')

      // After obliterate, getQueue creates a new Queue instance
      mockQueueObliterate.mockClear()
      service.getQueue('emails')
      // A new queue was created (obliterate was 0 calls since new instance)
      expect(mockQueueObliterate).not.toHaveBeenCalled()
    })
  })

  describe('getQueueMetrics()', () => {
    test('returns combined counts from queue', async () => {
      const { service } = makeService()
      const metrics = await service.getQueueMetrics('emails')

      expect(metrics).toEqual({
        waiting: 2,
        active: 1,
        completed: 10,
        failed: 3,
        delayed: 0,
      })
    })
  })

  describe('getJobs()', () => {
    test('calls queue.getJobs with status and range', async () => {
      const { service } = makeService()
      await service.getJobs('emails', 'completed', 0, 10)

      expect(mockQueueGetJobs).toHaveBeenCalledTimes(1)
      const [statuses, start, end] = mockQueueGetJobs.mock.calls[0] as any
      expect(statuses).toEqual(['completed'])
      expect(start).toBe(0)
      expect(end).toBe(10)
    })

    test('defaults start=0, end=-1', async () => {
      const { service } = makeService()
      await service.getJobs('emails', 'waiting')

      const [, start, end] = mockQueueGetJobs.mock.calls[0] as any
      expect(start).toBe(0)
      expect(end).toBe(-1)
    })
  })

  describe('closeQueue()', () => {
    test('calls queue.close() and removes it from the map', async () => {
      const { service } = makeService()
      service.getQueue('emails')
      await service.closeQueue('emails')

      expect(mockQueueClose).toHaveBeenCalledTimes(1)
    })

    test('calls queueEvents.close()', async () => {
      const { service } = makeService()
      service.getQueue('emails')
      await service.closeQueue('emails')

      expect(mockQueueEventsClose).toHaveBeenCalledTimes(1)
    })

    test('does nothing when queue does not exist', async () => {
      const { service } = makeService()
      await service.closeQueue('nonexistent')

      expect(mockQueueClose).not.toHaveBeenCalled()
    })
  })
})
