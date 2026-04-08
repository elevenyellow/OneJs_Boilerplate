/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: <explanation> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { metadataRegistry } from '@OneJs/core'
import { Server } from '../http-server'

const mockGetAllControllers = mock(() => [] as any[])

mock.module('../controller-registry', () => ({
  getAllControllers: mockGetAllControllers,
  registerController: mock(() => {}),
  clearControllers: mock(() => {}),
}))

const { ServerPlugin } = await import('../server-plugin')

function makeContainer() {
  return {
    get: mock(() => undefined as any),
    registerClass: mock(() => {}),
  }
}

describe('ServerPlugin', () => {
  beforeEach(() => {
    mockGetAllControllers.mockReset()
    mockGetAllControllers.mockImplementation(() => [])
  })

  describe('metadata', () => {
    test('has correct name', () => {
      expect(new ServerPlugin().name).toBe('server-plugin')
    })

    test('has priority 70', () => {
      expect(new ServerPlugin().priority).toBe(70)
    })

    test('is critical', () => {
      expect(new ServerPlugin().critical).toBe(true)
    })

    test('dependsOn bootstrap-loader', () => {
      expect(new ServerPlugin().dependsOn).toEqual(['bootstrap-loader'])
    })
  })

  describe('register()', () => {
    test('removes Server from metadataRegistry', () => {
      const removeSpy = mock(() => {})
      const originalRemove =
        metadataRegistry.removeService.bind(metadataRegistry)
      ;(metadataRegistry as any).removeService = removeSpy

      try {
        const plugin = new ServerPlugin()
        plugin.register(makeContainer() as any)

        expect(removeSpy).toHaveBeenCalledWith(Server)
      } finally {
        ;(metadataRegistry as any).removeService = originalRemove
      }
    })

    test('registers Server as a singleton in the container', () => {
      const container = makeContainer()
      const plugin = new ServerPlugin()

      plugin.register(container as any)

      expect(container.registerClass).toHaveBeenCalledTimes(1)
      expect(container.registerClass).toHaveBeenCalledWith(Server, {
        scope: 'singleton',
      })
    })

    test('does not throw with a valid container', () => {
      const plugin = new ServerPlugin()
      expect(() => plugin.register(makeContainer() as any)).not.toThrow()
    })
  })

  describe('load()', () => {
    test('returns early when no controllers are registered', async () => {
      mockGetAllControllers.mockImplementation(() => [])
      const container = makeContainer()
      const plugin = new ServerPlugin()

      await plugin.load(container as any)

      expect(container.get).not.toHaveBeenCalled()
    })

    test('retrieves the Server from the container when controllers exist', async () => {
      class HealthController {}
      mockGetAllControllers.mockImplementation(() => [HealthController])

      const fakeServer = { addControllers: mock(() => {}) }
      const container = {
        get: mock((ctor: any) => {
          if (ctor === Server) return fakeServer
          throw new Error(`No service for: ${ctor?.name}`)
        }),
        registerClass: mock(() => {}),
      }

      await new ServerPlugin().load(container as any)

      expect(container.get).toHaveBeenCalledWith(Server)
    })

    test('calls addControllers with all registered controllers', async () => {
      class TaskController {}
      class UserController {}
      mockGetAllControllers.mockImplementation(() => [
        TaskController,
        UserController,
      ])

      const fakeServer = { addControllers: mock(() => {}) }
      const container = {
        get: mock(() => fakeServer),
        registerClass: mock(() => {}),
      }

      await new ServerPlugin().load(container as any)

      expect(fakeServer.addControllers).toHaveBeenCalledTimes(1)
      expect(fakeServer.addControllers).toHaveBeenCalledWith([
        TaskController,
        UserController,
      ])
    })

    test('does not call addControllers when there are no controllers', async () => {
      mockGetAllControllers.mockImplementation(() => [])

      const fakeServer = { addControllers: mock(() => {}) }
      const container = {
        get: mock(() => fakeServer),
        registerClass: mock(() => {}),
      }

      await new ServerPlugin().load(container as any)

      expect(fakeServer.addControllers).not.toHaveBeenCalled()
    })

    test('passes exactly the controllers returned by getAllControllers', async () => {
      class OrderController {}
      mockGetAllControllers.mockImplementation(() => [OrderController])

      const fakeServer = { addControllers: mock(() => {}) }
      const container = {
        get: mock(() => fakeServer),
        registerClass: mock(() => {}),
      }

      await new ServerPlugin().load(container as any)

      const [passedControllers] = fakeServer.addControllers.mock.calls[0]
      expect(passedControllers).toContain(OrderController)
      expect(passedControllers).toHaveLength(1)
    })
  })
})
