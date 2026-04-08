import { describe, test, expect, beforeEach } from 'bun:test'
import { metadataRegistry } from '.././metadata-registry'

class ServiceA {}
class ServiceB {}
class ServiceC {}

// We operate on the singleton metadataRegistry so we must clean up after each test.
// The MetadataRegistry class is not exported, so we use the singleton and call
// removeService / cleanup manually.

describe('MetadataRegistry', () => {
  beforeEach(() => {
    // Remove any registrations created by previous tests
    metadataRegistry.removeService(ServiceA as any)
    metadataRegistry.removeService(ServiceB as any)
    metadataRegistry.removeService(ServiceC as any)
  })

  describe('registerService / getMetadata', () => {
    test('returns undefined for an unregistered class', () => {
      expect(metadataRegistry.getMetadata(ServiceA as any)).toBeUndefined()
    })

    test('returns metadata after registering a service', () => {
      metadataRegistry.registerService(ServiceA as any, 'singleton', false)
      const meta = metadataRegistry.getMetadata(ServiceA as any)

      expect(meta).toBeDefined()
      expect(meta!.scope).toBe('singleton')
      expect(meta!.autorun).toBe(false)
      expect(meta!.constructor).toBe(ServiceA)
      expect(meta!.params).toEqual([])
    })

    test('registers a service with transient scope', () => {
      metadataRegistry.registerService(ServiceB as any, 'transient', false)
      const meta = metadataRegistry.getMetadata(ServiceB as any)
      expect(meta!.scope).toBe('transient')
    })

    test('registers a service with autorun=true', () => {
      metadataRegistry.registerService(ServiceA as any, 'singleton', true)
      const meta = metadataRegistry.getMetadata(ServiceA as any)
      expect(meta!.autorun).toBe(true)
    })
  })

  describe('registerParamType', () => {
    test('stores param type at correct index', () => {
      metadataRegistry.registerService(ServiceB as any, 'singleton', false)
      metadataRegistry.registerParamType(ServiceB as any, 0, ServiceA)

      const meta = metadataRegistry.getMetadata(ServiceB as any)
      expect(meta!.params[0]).toMatchObject({ index: 0, type: ServiceA })
    })

    test('stores multiple params preserving indices', () => {
      metadataRegistry.registerService(ServiceC as any, 'singleton', false)
      metadataRegistry.registerParamType(ServiceC as any, 0, ServiceA)
      metadataRegistry.registerParamType(ServiceC as any, 1, ServiceB)

      const meta = metadataRegistry.getMetadata(ServiceC as any)
      expect(meta!.params[0]).toMatchObject({ index: 0, type: ServiceA })
      expect(meta!.params[1]).toMatchObject({ index: 1, type: ServiceB })
    })
  })

  describe('registerParamOptional', () => {
    test('marks param as optional with no fallback', () => {
      metadataRegistry.registerService(ServiceB as any, 'singleton', false)
      metadataRegistry.registerParamOptional(ServiceB as any, 0)

      const meta = metadataRegistry.getMetadata(ServiceB as any)
      expect(meta!.params[0]).toMatchObject({ index: 0, optional: true })
      expect(meta!.params[0].fallback).toBeUndefined()
    })

    test('marks param as optional with a static fallback value', () => {
      metadataRegistry.registerService(ServiceB as any, 'singleton', false)
      metadataRegistry.registerParamOptional(ServiceB as any, 0, 'default-value')

      const meta = metadataRegistry.getMetadata(ServiceB as any)
      expect(meta!.params[0].optional).toBe(true)
      expect(meta!.params[0].fallback).toBe('default-value')
    })

    test('marks param as optional with a function fallback', () => {
      const fallback = () => 42
      metadataRegistry.registerService(ServiceB as any, 'singleton', false)
      metadataRegistry.registerParamOptional(ServiceB as any, 0, fallback)

      const meta = metadataRegistry.getMetadata(ServiceB as any)
      expect(meta!.params[0].fallback).toBe(fallback)
    })

    test('merges optional flag onto existing param type registration', () => {
      metadataRegistry.registerService(ServiceB as any, 'singleton', false)
      metadataRegistry.registerParamType(ServiceB as any, 0, ServiceA)
      metadataRegistry.registerParamOptional(ServiceB as any, 0, null)

      const meta = metadataRegistry.getMetadata(ServiceB as any)
      const param = meta!.params[0]
      expect(param.type).toBe(ServiceA)
      expect(param.optional).toBe(true)
      expect(param.fallback).toBeNull()
    })
  })

  describe('getAllMetadata', () => {
    test('returns empty array when no services are registered', () => {
      // Ensure none of our test classes are registered
      const all = metadataRegistry.getAllMetadata()
      const relevant = all.filter(
        (m) => m.constructor === ServiceA || m.constructor === ServiceB || m.constructor === ServiceC,
      )
      expect(relevant).toHaveLength(0)
    })

    test('includes all registered services', () => {
      metadataRegistry.registerService(ServiceA as any, 'singleton', false)
      metadataRegistry.registerService(ServiceB as any, 'transient', true)

      const all = metadataRegistry.getAllMetadata()
      const ctors = all.map((m) => m.constructor)
      expect(ctors).toContain(ServiceA)
      expect(ctors).toContain(ServiceB)
    })
  })

  describe('removeService', () => {
    test('removes a registered service and its params', () => {
      metadataRegistry.registerService(ServiceA as any, 'singleton', false)
      metadataRegistry.registerParamType(ServiceA as any, 0, ServiceB)

      metadataRegistry.removeService(ServiceA as any)
      expect(metadataRegistry.getMetadata(ServiceA as any)).toBeUndefined()
    })

    test('is a no-op for an unregistered service', () => {
      expect(() => metadataRegistry.removeService(ServiceC as any)).not.toThrow()
    })
  })
})
