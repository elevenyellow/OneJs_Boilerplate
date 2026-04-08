import { describe, test, expect, mock, afterEach } from 'bun:test'
import { ContainerProvider } from '../../../../core/src/container/container-provider'
import { useClassMiddleware } from '../use-class-middleware'

// ── Helpers ──────────────────────────────────────────────────────────────────

function withContainer(instanceMap: Map<any, any>) {
  const fakeContainer = {
    get: (ctor: any) => {
      if (instanceMap.has(ctor)) return instanceMap.get(ctor)
      throw new Error(`No service for: ${ctor?.name}`)
    },
  }
  ContainerProvider.setContainer(fakeContainer as any)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClassMiddleware', () => {
  afterEach(() => {
    ContainerProvider.clear()
  })

  test('throws when the instance has no handle method', () => {
    class BrokenMiddleware {}
    withContainer(new Map([[BrokenMiddleware, {}]]))

    expect(() => useClassMiddleware(BrokenMiddleware as any)).toThrow(
      "Middleware class 'BrokenMiddleware' must implement a method named 'handle' or decorated with @Middleware()",
    )
  })

  test('returns an async function', () => {
    class GoodMiddleware {
      handle = async (_ctx: any) => {}
    }
    const instance = new GoodMiddleware()
    withContainer(new Map([[GoodMiddleware, instance]]))

    const fn = useClassMiddleware(GoodMiddleware as any)
    expect(typeof fn).toBe('function')
  })

  test('calls the handle method on the resolved instance with the context', async () => {
    const handleMock = mock(async (_ctx: any) => {})

    class MyMiddleware {
      handle = handleMock
    }
    withContainer(new Map([[MyMiddleware, new MyMiddleware()]]))

    const fn = useClassMiddleware(MyMiddleware as any)
    const fakeContext = { request: {}, set: {} }

    await fn(fakeContext as any)

    expect(handleMock).toHaveBeenCalledTimes(1)
    expect(handleMock).toHaveBeenCalledWith(fakeContext)
  })

  test('uses __middlewareMethod when set on the class', async () => {
    const customHandle = mock(async (_ctx: any) => {})

    class CustomMiddleware {
      customHandle = customHandle
    }
    ;(CustomMiddleware as any).__middlewareMethod = 'customHandle'
    withContainer(new Map([[CustomMiddleware, new CustomMiddleware()]]))

    const fn = useClassMiddleware(CustomMiddleware as any)
    const fakeContext = {}

    await fn(fakeContext as any)

    expect(customHandle).toHaveBeenCalledTimes(1)
  })

  test('throws when the custom method name is not a function', () => {
    class WeirdMiddleware {
      notAFn = 'oops'
    }
    ;(WeirdMiddleware as any).__middlewareMethod = 'notAFn'
    withContainer(new Map([[WeirdMiddleware, new WeirdMiddleware()]]))

    expect(() => useClassMiddleware(WeirdMiddleware as any)).toThrow(
      "Middleware class 'WeirdMiddleware' must implement a method named 'handle' or decorated with @Middleware()",
    )
  })
})
