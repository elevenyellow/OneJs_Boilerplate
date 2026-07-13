/**
 * Test helper utilities
 */
export class TestHelpers {
  /**
   * Wait for a condition to be true (polling with timeout)
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeoutMs = 5000,
    intervalMs = 100,
  ): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      if (await condition()) return
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
    throw new Error(`waitFor timeout after ${timeoutMs}ms`)
  }

  /**
   * Create a spy function (like mock but simpler)
   */
  static spy<T extends (...args: any[]) => any>(
    implementation?: T,
  ): T & { calls: Array<Parameters<T>>; callCount: number } {
    const calls: Array<Parameters<T>> = []
    const fn = ((...args: Parameters<T>) => {
      calls.push(args)
      return implementation?.(...args)
    }) as T & { calls: Array<Parameters<T>>; callCount: number }
    fn.calls = calls
    Object.defineProperty(fn, 'callCount', {
      get: () => calls.length,
    })
    return fn
  }
}
