import { beforeEach, describe, expect, test } from 'bun:test'
import { Container } from '.././container'
import type { ParamInfo } from '.././metadata-registry'

class ServiceA {}
class ServiceB {
  constructor(public readonly dep: ServiceA) {}
}
class ServiceC {
  constructor(public readonly b: ServiceB) {}
}

describe('Container', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  describe('register / get', () => {
    test('registers and resolves a simple service', () => {
      container.register(ServiceA)
      const instance = container.get(ServiceA)
      expect(instance).toBeInstanceOf(ServiceA)
    })

    test('returns the same singleton instance on repeated gets', () => {
      container.register(ServiceA)
      const first = container.get(ServiceA)
      const second = container.get(ServiceA)
      expect(first).toBe(second)
    })

    test('returns different instances for transient scope', () => {
      container.register(ServiceA, 'transient')
      const first = container.get(ServiceA)
      const second = container.get(ServiceA)
      expect(first).not.toBe(second)
    })

    test('does not re-register an already registered service', () => {
      container.register(ServiceA, 'singleton')
      container.register(ServiceA, 'transient') // should be ignored
      container.register(ServiceA) // ensures singleton stored
      const a = container.get(ServiceA)
      const b = container.get(ServiceA)
      expect(a).toBe(b) // still singleton because second call was ignored
    })

    test('throws when resolving an unregistered service', () => {
      expect(() => container.get(ServiceA)).toThrow(
        'No service registered for type: ServiceA',
      )
    })
  })

  describe('registerClass', () => {
    test('registers with default singleton scope', () => {
      container.registerClass(ServiceA)
      const a = container.get(ServiceA)
      const b = container.get(ServiceA)
      expect(a).toBe(b)
    })

    test('registers with explicit transient scope', () => {
      container.registerClass(ServiceA, { scope: 'transient' })
      const a = container.get(ServiceA)
      const b = container.get(ServiceA)
      expect(a).not.toBe(b)
    })
  })

  describe('registerAlias', () => {
    test('resolves a service via alias token', () => {
      const TOKEN = Symbol('ServiceA')
      container.register(ServiceA)
      container.registerAlias(TOKEN, ServiceA)

      const params: ParamInfo[] = [{ index: 0, type: TOKEN }]
      container.register(ServiceB as any, 'singleton', false, params)

      const b = container.get(ServiceB as any) as ServiceB
      expect(b.dep).toBeInstanceOf(ServiceA)
    })
  })

  describe('dependency resolution', () => {
    test('resolves a service with constructor dependencies', () => {
      container.register(ServiceA)
      const params: ParamInfo[] = [{ index: 0, type: ServiceA }]
      container.register(ServiceB, 'singleton', false, params)

      const b = container.get(ServiceB)
      expect(b).toBeInstanceOf(ServiceB)
      expect(b.dep).toBeInstanceOf(ServiceA)
    })

    test('resolves a transitive chain of dependencies', () => {
      container.register(ServiceA)
      const paramsB: ParamInfo[] = [{ index: 0, type: ServiceA }]
      container.register(ServiceB, 'singleton', false, paramsB)
      const paramsC: ParamInfo[] = [{ index: 0, type: ServiceB }]
      container.register(ServiceC, 'singleton', false, paramsC)

      const c = container.get(ServiceC)
      expect(c).toBeInstanceOf(ServiceC)
      expect(c.b).toBeInstanceOf(ServiceB)
      expect(c.b.dep).toBeInstanceOf(ServiceA)
    })

    test('throws for missing required dependency', () => {
      // ServiceB requires ServiceA but it is not registered
      const params: ParamInfo[] = [{ index: 0, type: ServiceA }]
      container.register(ServiceB, 'singleton', false, params)

      expect(() => container.get(ServiceB)).toThrow(
        "Missing required dependency 'ServiceA' for 'ServiceB' at index 0",
      )
    })

    test('returns fallback value for optional dependency (static)', () => {
      class OptionalConsumer {
        constructor(public readonly dep: ServiceA | null) {}
      }
      const params: ParamInfo[] = [
        { index: 0, type: ServiceA, optional: true, fallback: null },
      ]
      container.register(OptionalConsumer, 'singleton', false, params)

      const instance = container.get(OptionalConsumer)
      expect(instance.dep).toBeNull()
    })

    test('returns fallback value for optional dependency (function)', () => {
      class OptionalConsumer {
        constructor(public readonly dep: string) {}
      }
      const params: ParamInfo[] = [
        { index: 0, type: ServiceA, optional: true, fallback: () => 'default' },
      ]
      container.register(OptionalConsumer, 'singleton', false, params)

      const instance = container.get(OptionalConsumer)
      expect(instance.dep).toBe('default')
    })

    test('returns undefined for param with no type', () => {
      class NoTypeConsumer {
        constructor(public readonly dep: any) {}
      }
      const params: ParamInfo[] = [{ index: 0 }]
      container.register(NoTypeConsumer, 'singleton', false, params)

      const instance = container.get(NoTypeConsumer)
      expect(instance.dep).toBeUndefined()
    })
  })

  describe('cyclic dependency detection', () => {
    test('throws on direct self-dependency', () => {
      class SelfRef {
        constructor(public readonly self: SelfRef) {}
      }
      const params: ParamInfo[] = [{ index: 0, type: SelfRef }]
      container.register(SelfRef, 'singleton', false, params)

      expect(() => container.get(SelfRef)).toThrow(
        'Cyclic dependency detected for type: SelfRef',
      )
    })

    test('throws on indirect cyclic dependency', () => {
      class CycleA {
        constructor(public b: any) {}
      }
      class CycleB {
        constructor(public a: CycleA) {}
      }

      const paramsA: ParamInfo[] = [{ index: 0, type: CycleB }]
      const paramsB: ParamInfo[] = [{ index: 0, type: CycleA }]
      container.register(CycleA, 'singleton', false, paramsA)
      container.register(CycleB, 'singleton', false, paramsB)

      expect(() => container.get(CycleA)).toThrow('Cyclic dependency detected')
    })
  })

  describe('getAllServices', () => {
    test('returns empty array when no instances are resolved', () => {
      container.register(ServiceA)
      expect(container.getAllServices()).toEqual([])
    })

    test('returns resolved singleton instances', () => {
      container.register(ServiceA)
      container.get(ServiceA)
      const services = container.getAllServices()
      expect(services).toHaveLength(1)
      expect(services[0]).toBeInstanceOf(ServiceA)
    })

    test('transient instances are not stored', () => {
      container.register(ServiceA, 'transient')
      container.get(ServiceA)
      container.get(ServiceA)
      // Transient instances are not cached
      expect(container.getAllServices()).toHaveLength(0)
    })
  })

  describe('clear', () => {
    test('clears all registered services and instances', () => {
      container.register(ServiceA)
      container.get(ServiceA)
      container.clear()

      expect(() => container.get(ServiceA)).toThrow(
        'No service registered for type: ServiceA',
      )
      expect(container.getAllServices()).toHaveLength(0)
    })
  })
})
