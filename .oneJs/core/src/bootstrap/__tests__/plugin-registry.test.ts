import { describe, test, expect, beforeEach } from 'bun:test'
import { PluginRegistry } from '../plugin-registry'
import type { BootstrapPlugin } from '../plugin-registry'
import type { Container } from '../../container'

function makePlugin(name: string, priority?: number): BootstrapPlugin {
  return {
    name,
    priority,
    load: async (_container: Container) => undefined,
  }
}

function makePluginWithDeps(
  name: string,
  dependsOn: string[],
  priority?: number,
): BootstrapPlugin {
  return {
    name,
    priority,
    dependsOn,
    load: async (_container: Container) => undefined,
  }
}

describe('PluginRegistry', () => {
  beforeEach(() => {
    PluginRegistry.clear()
  })

  describe('register', () => {
    test('registers a plugin and returns it via getAll', () => {
      const plugin = makePlugin('my-plugin')
      PluginRegistry.register(plugin)

      const all = PluginRegistry.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].name).toBe('my-plugin')
    })

    test('does not register the same plugin name twice', () => {
      const plugin1 = makePlugin('duplicate')
      const plugin2 = makePlugin('duplicate')
      PluginRegistry.register(plugin1)
      PluginRegistry.register(plugin2)

      expect(PluginRegistry.getAll()).toHaveLength(1)
    })

    test('registers multiple unique plugins', () => {
      PluginRegistry.register(makePlugin('plugin-a'))
      PluginRegistry.register(makePlugin('plugin-b'))
      PluginRegistry.register(makePlugin('plugin-c'))

      expect(PluginRegistry.getAll()).toHaveLength(3)
    })
  })

  describe('getAll - ordering', () => {
    test('returns plugins sorted by priority ascending', () => {
      PluginRegistry.register(makePlugin('high', 50))
      PluginRegistry.register(makePlugin('low', 200))
      PluginRegistry.register(makePlugin('mid', 100))

      const names = PluginRegistry.getAll().map((p) => p.name)
      expect(names).toEqual(['high', 'mid', 'low'])
    })

    test('plugins without priority default to 100', () => {
      PluginRegistry.register(makePlugin('before', 50))
      PluginRegistry.register(makePlugin('no-priority')) // defaults to 100
      PluginRegistry.register(makePlugin('after', 150))

      const names = PluginRegistry.getAll().map((p) => p.name)
      expect(names).toEqual(['before', 'no-priority', 'after'])
    })

    test('returns a copy so mutations do not affect internal state', () => {
      PluginRegistry.register(makePlugin('stable'))
      const first = PluginRegistry.getAll()
      first.push(makePlugin('injected'))

      expect(PluginRegistry.getAll()).toHaveLength(1)
    })

    test('uses dependsOn relationships before priority', () => {
      PluginRegistry.register(makePlugin('db', 200))
      PluginRegistry.register(makePluginWithDeps('events', ['db'], 1))

      const names = PluginRegistry.getAll().map((p) => p.name)
      expect(names).toEqual(['db', 'events'])
    })

    test('orders equal-priority ready plugins deterministically by name', () => {
      PluginRegistry.register(makePlugin('zeta', 100))
      PluginRegistry.register(makePlugin('alpha', 100))
      PluginRegistry.register(makePlugin('beta', 100))

      const names = PluginRegistry.getAll().map((p) => p.name)
      expect(names).toEqual(['alpha', 'beta', 'zeta'])
    })

    test('throws when dependsOn references missing plugin', () => {
      PluginRegistry.register(makePluginWithDeps('events', ['db']))

      expect(() => PluginRegistry.getAll()).toThrow(
        'depends on "db", but it is not registered',
      )
    })

    test('throws on circular dependency graph', () => {
      PluginRegistry.register(makePluginWithDeps('a', ['b']))
      PluginRegistry.register(makePluginWithDeps('b', ['a']))

      expect(() => PluginRegistry.getAll()).toThrow(
        'Circular plugin dependency detected',
      )
    })
  })

  describe('clear', () => {
    test('removes all registered plugins', () => {
      PluginRegistry.register(makePlugin('a'))
      PluginRegistry.register(makePlugin('b'))
      PluginRegistry.clear()

      expect(PluginRegistry.getAll()).toHaveLength(0)
    })

    test('allows re-registration after clear', () => {
      const plugin = makePlugin('reusable')
      PluginRegistry.register(plugin)
      PluginRegistry.clear()
      PluginRegistry.register(plugin)

      expect(PluginRegistry.getAll()).toHaveLength(1)
    })
  })

  describe('register/load lifecycle', () => {
    test('plugin with optional register is accepted', () => {
      const plugin: BootstrapPlugin = {
        name: 'no-register',
        load: async () => undefined,
      }
      expect(() => PluginRegistry.register(plugin)).not.toThrow()
      expect(PluginRegistry.getAll()).toHaveLength(1)
    })

    test('plugin with register method is accepted', () => {
      const plugin: BootstrapPlugin = {
        name: 'with-register',
        register: async () => undefined,
        load: async () => undefined,
      }
      expect(() => PluginRegistry.register(plugin)).not.toThrow()
      expect(PluginRegistry.getAll()).toHaveLength(1)
    })
  })
})
