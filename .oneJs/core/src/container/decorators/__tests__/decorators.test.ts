import { describe, expect, test } from 'bun:test'
import { metadataRegistry } from '../../metadata-registry'
import { Inject } from '.././inject'
import { Injectable } from '.././injectable'
import { Optional } from '.././optional'

// Helper to clean up registry entries after each test
function cleanRegistry(...ctors: Function[]) {
  for (const ctor of ctors) {
    metadataRegistry.removeService(ctor as any)
  }
}

describe('Decorators', () => {
  describe('@Injectable', () => {
    test('registers a class with default singleton scope', () => {
      @Injectable()
      class MyService {}

      const meta = metadataRegistry.getMetadata(MyService as any)
      expect(meta).toBeDefined()
      expect(meta!.scope).toBe('singleton')
      expect(meta!.autorun).toBe(false)

      cleanRegistry(MyService)
    })

    test('registers with explicit transient scope', () => {
      @Injectable({ scope: 'transient' })
      class TransientService {}

      const meta = metadataRegistry.getMetadata(TransientService as any)
      expect(meta!.scope).toBe('transient')

      cleanRegistry(TransientService)
    })

    test('registers with autorun=true', () => {
      @Injectable({ autorun: true })
      class AutorunService {}

      const meta = metadataRegistry.getMetadata(AutorunService as any)
      expect(meta!.autorun).toBe(true)

      cleanRegistry(AutorunService)
    })

    test('registers with combined options', () => {
      @Injectable({ scope: 'transient', autorun: true })
      class CombinedService {}

      const meta = metadataRegistry.getMetadata(CombinedService as any)
      expect(meta!.scope).toBe('transient')
      expect(meta!.autorun).toBe(true)

      cleanRegistry(CombinedService)
    })

    test('registers with no options (uses defaults)', () => {
      @Injectable()
      class DefaultService {}

      const meta = metadataRegistry.getMetadata(DefaultService as any)
      expect(meta!.scope).toBe('singleton')
      expect(meta!.autorun).toBe(false)

      cleanRegistry(DefaultService)
    })
  })

  describe('@Inject', () => {
    test('stores the token type in param metadata', () => {
      class Dependency {}

      @Injectable()
      class ConsumerClass {
        constructor(@Inject(Dependency) public dep: Dependency) {}
      }

      const meta = metadataRegistry.getMetadata(ConsumerClass as any)
      expect(meta).toBeDefined()
      const param = meta!.params.find((p) => p.index === 0)
      expect(param).toBeDefined()
      expect(param!.type).toBe(Dependency)

      cleanRegistry(ConsumerClass, Dependency)
    })

    test('stores a symbol token', () => {
      const TOKEN = Symbol('MyToken')

      @Injectable()
      class SymbolConsumer {
        constructor(@Inject(TOKEN) public dep: any) {}
      }

      const meta = metadataRegistry.getMetadata(SymbolConsumer as any)
      const param = meta!.params.find((p) => p.index === 0)
      expect(param!.type).toBe(TOKEN)

      cleanRegistry(SymbolConsumer)
    })

    test('stores a string token', () => {
      const TOKEN = 'MY_SERVICE'

      @Injectable()
      class StringConsumer {
        constructor(@Inject(TOKEN) public dep: any) {}
      }

      const meta = metadataRegistry.getMetadata(StringConsumer as any)
      const param = meta!.params.find((p) => p.index === 0)
      expect(param!.type).toBe(TOKEN)

      cleanRegistry(StringConsumer)
    })

    test('handles multiple @Inject at different indices', () => {
      class DepA {}
      class DepB {}

      @Injectable()
      class MultiConsumer {
        constructor(
          @Inject(DepA) public a: DepA,
          @Inject(DepB) public b: DepB,
        ) {}
      }

      const meta = metadataRegistry.getMetadata(MultiConsumer as any)
      const paramA = meta!.params.find((p) => p.index === 0)
      const paramB = meta!.params.find((p) => p.index === 1)
      expect(paramA!.type).toBe(DepA)
      expect(paramB!.type).toBe(DepB)

      cleanRegistry(MultiConsumer, DepA, DepB)
    })
  })

  describe('@Optional', () => {
    test('marks a parameter as optional with no fallback', () => {
      class MaybeDep {}

      @Injectable()
      class OptConsumer {
        constructor(@Optional() public dep: MaybeDep | undefined) {}
      }

      const meta = metadataRegistry.getMetadata(OptConsumer as any)
      const param = meta!.params.find((p) => p.index === 0)
      expect(param!.optional).toBe(true)
      expect(param!.fallback).toBeUndefined()

      cleanRegistry(OptConsumer, MaybeDep)
    })

    test('marks a parameter as optional with a static fallback', () => {
      @Injectable()
      class FallbackConsumer {
        constructor(@Optional('fallback') public dep: string) {}
      }

      const meta = metadataRegistry.getMetadata(FallbackConsumer as any)
      const param = meta!.params.find((p) => p.index === 0)
      expect(param!.optional).toBe(true)
      expect(param!.fallback).toBe('fallback')

      cleanRegistry(FallbackConsumer)
    })

    test('marks a parameter as optional with a function fallback', () => {
      const fallback = () => 99

      @Injectable()
      class FnFallbackConsumer {
        constructor(@Optional(fallback) public dep: number) {}
      }

      const meta = metadataRegistry.getMetadata(FnFallbackConsumer as any)
      const param = meta!.params.find((p) => p.index === 0)
      expect(param!.optional).toBe(true)
      expect(typeof param!.fallback).toBe('function')

      cleanRegistry(FnFallbackConsumer)
    })

    test('combined @Inject and @Optional on same param', () => {
      class OptDep {}

      @Injectable()
      class CombinedConsumer {
        constructor(
          @Inject(OptDep) @Optional(null) public dep: OptDep | null,
        ) {}
      }

      const meta = metadataRegistry.getMetadata(CombinedConsumer as any)
      const param = meta!.params.find((p) => p.index === 0)
      expect(param!.type).toBe(OptDep)
      expect(param!.optional).toBe(true)
      expect(param!.fallback).toBeNull()

      cleanRegistry(CombinedConsumer, OptDep)
    })
  })
})
