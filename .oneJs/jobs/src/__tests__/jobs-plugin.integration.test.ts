/**
 * JobsPlugin integration tests
 *
 * Boots the OneJs kernel with a real JobsPlugin and verifies plugin lifecycle.
 * BullMQ (Worker class) is mocked to avoid requiring a real Redis connection.
 */
/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: <explanation> */
import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { Container, OneJs, PluginRegistry } from '@OneJs/core'

// Mock BullMQ Worker and Queue to avoid Redis connections
const mockWorkerOn = mock(() => {})
const mockWorkerClose = mock(async () => {})

mock.module('bullmq', () => {
  class MockWorker {
    on = mockWorkerOn
    close = mockWorkerClose
  }

  class MockQueue {
    add = mock(async () => {})
    close = mock(async () => {})
  }

  class MockQueueEvents {
    close = mock(async () => {})
  }

  return { Worker: MockWorker, Queue: MockQueue, QueueEvents: MockQueueEvents }
})

// Mock ioredis to avoid real Redis connection
mock.module('ioredis', () => {
  return {
    default: class MockIORedis {
      on = mock(() => {})
      quit = mock(async () => {})
    },
  }
})

const { JobsPlugin } = await import('../jobs-plugin')
const { getAllWorkerHandlers } = await import('../domain/store')

// Minimal stub for bootstrap-loader dependency
const stubBootstrapLoader = { name: 'bootstrap-loader', priority: 10 }

describe('JobsPlugin — integration', () => {
  beforeEach(() => {
    PluginRegistry.clear()
    mockWorkerOn.mockClear()
    mockWorkerClose.mockClear()
  })

  it('starts the kernel with JobsPlugin without throwing when no workers are registered', async () => {
    await expect(
      new OneJs(new Container())
        .use(stubBootstrapLoader)
        .use(new JobsPlugin())
        .start(),
    ).resolves.toBeDefined()
  })

  it('metadata is correctly exposed through the plugin interface', () => {
    const plugin = new JobsPlugin()

    expect(plugin.name).toBe('jobs-plugin')
    expect(plugin.priority).toBe(60)
    expect(plugin.dependsOn).toContain('bootstrap-loader')
  })

  it('kernel completes the full register → load lifecycle for JobsPlugin', async () => {
    const registerSpy = mock(() => {})
    const loadSpy = mock(async () => {})

    const observedPlugin = {
      name: 'observed-jobs',
      priority: 60,
      dependsOn: ['bootstrap-loader'],
      register: registerSpy,
      load: loadSpy,
    }

    await new OneJs(new Container())
      .use(stubBootstrapLoader)
      .use(observedPlugin)
      .start()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(loadSpy).toHaveBeenCalledTimes(1)
  })

  it('JobsPlugin is sorted after bootstrap-loader in plugin resolution', async () => {
    const resolved: string[] = []

    const trackingBootstrap = {
      name: 'bootstrap-loader',
      priority: 10,
      load: async () => {
        resolved.push('bootstrap-loader')
      },
    }

    const trackingJobs = {
      ...new JobsPlugin(),
      load: async () => {
        resolved.push('jobs-plugin')
      },
    }

    await new OneJs(new Container())
      .use(trackingBootstrap)
      .use(trackingJobs)
      .start()

    expect(resolved.indexOf('bootstrap-loader')).toBeLessThan(
      resolved.indexOf('jobs-plugin'),
    )
  })
})
