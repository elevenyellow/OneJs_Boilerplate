import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { OneJs } from '../oneJs'
import { type BootstrapPlugin, PluginRegistry } from '../plugin-registry'

function makePlugin(
  name: string,
  options?: {
    registerImpl?: () => Promise<void> | void
    loadImpl?: () => Promise<void> | void
    dependsOn?: string[]
    critical?: boolean
    priority?: number
  },
): BootstrapPlugin {
  return {
    name,
    priority: options?.priority,
    dependsOn: options?.dependsOn,
    critical: options?.critical,
    register: options?.registerImpl,
    load: options?.loadImpl,
  }
}

describe('OneJs kernel lifecycle', () => {
  beforeEach(() => {
    PluginRegistry.clear()
  })

  test('throws when critical plugin registration fails', async () => {
    const kernel = new OneJs(undefined, { failFast: false }).use(
      makePlugin('critical-register', {
        critical: true,
        registerImpl: () => {
          throw new Error('register failed')
        },
      }),
    )

    await expect(kernel.start()).rejects.toThrow(
      'Kernel startup failed during plugin registration: critical-register',
    )
  })

  test('throws when non-critical plugin fails and failFast=true', async () => {
    const kernel = new OneJs(undefined, { failFast: true }).use(
      makePlugin('non-critical-load', {
        critical: false,
        loadImpl: () => {
          throw new Error('load failed')
        },
      }),
    )

    await expect(kernel.start()).rejects.toThrow(
      'Kernel startup failed during plugin loading: non-critical-load',
    )
  })

  test('continues when non-critical plugin fails and failFast=false', async () => {
    const loaded = mock(() => undefined)

    const kernel = new OneJs(undefined, { failFast: false })
      .use(
        makePlugin('non-critical-load', {
          critical: false,
          loadImpl: () => {
            throw new Error('load failed')
          },
        }),
      )
      .use(
        makePlugin('next-plugin', {
          dependsOn: ['non-critical-load'],
          loadImpl: loaded,
        }),
      )

    await expect(kernel.start()).resolves.toBeDefined()
    expect(loaded).toHaveBeenCalledTimes(1)
  })

  test('resolves instance plugins and legacy registry plugins together', async () => {
    const registrationOrder: string[] = []

    const fromInstance = makePlugin('instance-plugin', {
      registerImpl: () => {
        registrationOrder.push('instance-plugin')
      },
    })

    const fromLegacy = makePlugin('legacy-plugin', {
      dependsOn: ['instance-plugin'],
      registerImpl: () => {
        registrationOrder.push('legacy-plugin')
      },
    })

    PluginRegistry.register(fromLegacy)

    await new OneJs(undefined, { failFast: true }).use(fromInstance).start()

    expect(registrationOrder).toEqual(['instance-plugin', 'legacy-plugin'])
  })

  test('clears legacy plugin registry after startup', async () => {
    PluginRegistry.register(
      makePlugin('legacy-plugin', {
        registerImpl: () => undefined,
      }),
    )

    await new OneJs(undefined, { failFast: true }).start()

    expect(PluginRegistry.getAll()).toHaveLength(0)
  })
})
