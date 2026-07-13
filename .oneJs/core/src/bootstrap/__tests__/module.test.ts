import { beforeEach, describe, expect, it } from 'bun:test'
import { clearMarkers, markAs } from '../../markers'
import { BootstrapBase } from '../bootstrap-base'
import { clearModules, getAllModules, Module } from '../module'

beforeEach(() => {
  clearModules()
  clearMarkers()
})

describe('@Module', () => {
  it('registers a module with controllers and handlers', () => {
    class FakeController {}
    class FakeHandler {
      handle() {}
    }
    markAs(FakeController, 'controller')
    markAs(FakeHandler, 'handler')

    @Module({
      controllers: [FakeController],
      handlers: [FakeHandler],
    })
    class TestModule {}

    const modules = getAllModules()
    expect(modules).toHaveLength(1)
    expect(modules[0].target).toBe(TestModule)
    expect(modules[0].options.controllers).toEqual([FakeController])
    expect(modules[0].options.handlers).toEqual([FakeHandler])
  })

  it('registers a module with providers', () => {
    class FakeService {}
    markAs(FakeService, 'provider')

    @Module({ providers: [FakeService] })
    class ServiceModule {}

    const modules = getAllModules()
    expect(modules).toHaveLength(1)
    expect(modules[0].options.providers).toEqual([FakeService])
  })

  it('registers a module with empty options', () => {
    @Module()
    class EmptyModule {}

    const modules = getAllModules()
    expect(modules).toHaveLength(1)
    expect(modules[0].target).toBe(EmptyModule)
    expect(modules[0].options).toEqual({})
  })

  it('registers multiple modules independently', () => {
    class CtrlA {}
    class CtrlB {}
    markAs(CtrlA, 'controller')
    markAs(CtrlB, 'controller')

    @Module({ controllers: [CtrlA] })
    class ModuleA {}

    @Module({ controllers: [CtrlB] })
    class ModuleB {}

    const modules = getAllModules()
    expect(modules).toHaveLength(2)
    expect(modules[0].target).toBe(ModuleA)
    expect(modules[1].target).toBe(ModuleB)
  })

  it('clears all modules', () => {
    @Module({ controllers: [] })
    class SomeModule {}

    expect(getAllModules()).toHaveLength(1)
    clearModules()
    expect(getAllModules()).toHaveLength(0)
  })

  it('throws when a non-controller class is in controllers', () => {
    class NotAController {}

    expect(() => {
      @Module({ controllers: [NotAController] })
      class BadModule {}
    }).toThrow(
      '"NotAController" was declared in "controllers" but is not decorated with @Controller',
    )
  })

  it('throws when a non-handler class is in handlers', () => {
    class NotAHandler {
      handle() {}
    }

    expect(() => {
      @Module({ handlers: [NotAHandler] })
      class BadModule {}
    }).toThrow(
      '"NotAHandler" was declared in "handlers" but is not decorated with @EventHandler',
    )
  })

  it('throws when a non-provider class is in providers', () => {
    class NotAProvider {}

    expect(() => {
      @Module({ providers: [NotAProvider] })
      class BadModule {}
    }).toThrow(
      '"NotAProvider" was declared in "providers" but is not decorated with @Injectable',
    )
  })

  it('throws when a non-BootstrapBase class is in bootstrap', () => {
    class NotBootstrap {}
    markAs(NotBootstrap, 'provider')

    expect(() => {
      @Module({ bootstrap: [NotBootstrap as any] })
      class BadModule {}
    }).toThrow(
      '"NotBootstrap" was declared in "bootstrap" but does not extend BootstrapBase',
    )
  })

  it('accepts a valid BootstrapBase subclass in bootstrap', () => {
    class ValidSeeder extends BootstrapBase {
      async bootstrap() {}
    }

    expect(() => {
      @Module({ bootstrap: [ValidSeeder] })
      class GoodModule {}
    }).not.toThrow()
  })
})
