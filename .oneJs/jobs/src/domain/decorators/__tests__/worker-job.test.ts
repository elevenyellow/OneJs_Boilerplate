import { describe, expect, mock, test } from 'bun:test'

const mockRegisterWorkerHandler = mock(() => {})

mock.module('../../store', () => ({
  registerWorkerHandler: mockRegisterWorkerHandler,
  getAllWorkerHandlers: mock(() => []),
}))

const { WorkerJob } = await import('../worker-job')

describe('WorkerJob decorator', () => {
  test('calls registerWorkerHandler with correct metadata', () => {
    class MyWorker {
      @WorkerJob('invoices', 3)
      process() {}
    }

    expect(mockRegisterWorkerHandler).toHaveBeenCalledTimes(1)
    const call = mockRegisterWorkerHandler.mock.calls[0][0] as any
    expect(call.target).toBe(MyWorker)
    expect(call.methodName).toBe('process')
    expect(call.queueName).toBe('invoices')
    expect(call.concurrency).toBe(3)
  })

  test('defaults concurrency to 1 when not specified', () => {
    mockRegisterWorkerHandler.mockReset()

    class AnotherWorker {
      @WorkerJob('notifications')
      handle() {}
    }

    const call = mockRegisterWorkerHandler.mock.calls[0][0] as any
    expect(call.concurrency).toBe(1)
  })

  test('registers different methods independently', () => {
    mockRegisterWorkerHandler.mockReset()

    class MultiWorker {
      @WorkerJob('queue-a', 2)
      processA() {}

      @WorkerJob('queue-b', 4)
      processB() {}
    }

    expect(mockRegisterWorkerHandler).toHaveBeenCalledTimes(2)
    const queueNames = mockRegisterWorkerHandler.mock.calls.map(
      (c: any) => c[0].queueName,
    )
    expect(queueNames).toContain('queue-a')
    expect(queueNames).toContain('queue-b')
  })

  test('returns the original descriptor unchanged', () => {
    const originalFn = function () {
      return 'original'
    }

    class TestWorker {
      @WorkerJob('test-q')
      run = originalFn
    }

    const instance = new TestWorker()
    expect(instance.run()).toBe('original')
  })
})
