import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { AutoLoaderPlugin } from '../auto-loader-plugin'
import type { IModuleLoader, AutoLoaderOptions } from '../ports/IModuleLoader'

function makeLoader(): IModuleLoader & { load: ReturnType<typeof mock> } {
  return { load: mock(async (_options: AutoLoaderOptions) => {}) }
}

describe('AutoLoaderPlugin', () => {
  describe('metadata', () => {
    test('has correct name', () => {
      const plugin = new AutoLoaderPlugin({ rootDir: '/app' })
      expect(plugin.name).toBe('auto-loader-plugin')
    })

    test('has priority 5', () => {
      const plugin = new AutoLoaderPlugin({ rootDir: '/app' })
      expect(plugin.priority).toBe(5)
    })

    test('is critical', () => {
      const plugin = new AutoLoaderPlugin({ rootDir: '/app' })
      expect(plugin.critical).toBe(true)
    })

    test('has no dependsOn', () => {
      const plugin = new AutoLoaderPlugin({ rootDir: '/app' })
      expect(plugin.dependsOn).toBeUndefined()
    })
  })

  describe('register()', () => {
    test('does not throw with any container', () => {
      const plugin = new AutoLoaderPlugin({ rootDir: '/app' })
      expect(() => plugin.register({} as any)).not.toThrow()
    })
  })

  describe('load()', () => {
    test('delegates to loader with provided options', async () => {
      const loader = makeLoader()
      const options = { rootDir: '/app' }
      const plugin = new AutoLoaderPlugin(options, loader)

      await plugin.load({} as any)

      expect(loader.load).toHaveBeenCalledTimes(1)
      expect(loader.load).toHaveBeenCalledWith(options)
    })

    test('passes extraDirs to loader', async () => {
      const loader = makeLoader()
      const options = { rootDir: '/app', extraDirs: ['/packages', '/modules'] }
      const plugin = new AutoLoaderPlugin(options, loader)

      await plugin.load({} as any)

      expect(loader.load).toHaveBeenCalledWith(options)
    })

    test('ignores container parameter', async () => {
      const loader = makeLoader()
      const container = {
        get: mock(() => {
          throw new Error('should not be called')
        }),
      }
      const plugin = new AutoLoaderPlugin({ rootDir: '/app' }, loader)

      await plugin.load(container as any)

      expect(container.get).not.toHaveBeenCalled()
    })
  })
})
