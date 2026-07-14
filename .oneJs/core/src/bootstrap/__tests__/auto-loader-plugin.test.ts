import { describe, expect, mock, test } from 'bun:test'
import { Container } from '../../container'
import type { ClassConstructor } from '../../types'
import { AutoLoaderPlugin } from '../auto-loader-plugin'
import type { AutoLoaderOptions, IModuleLoader } from '../ports/IModuleLoader'

function makeLoader(): IModuleLoader & { load: ReturnType<typeof mock> } {
  return { load: mock((_options: AutoLoaderOptions) => Promise.resolve()) }
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
      expect(() => plugin.register(new Container())).not.toThrow()
    })
  })

  describe('load()', () => {
    test('delegates to loader with provided options', async () => {
      const loader = makeLoader()
      const options = { rootDir: '/app' }
      const plugin = new AutoLoaderPlugin(options, loader)

      await plugin.load(new Container())

      expect(loader.load).toHaveBeenCalledTimes(1)
      expect(loader.load).toHaveBeenCalledWith(options)
    })

    test('passes extraDirs to loader', async () => {
      const loader = makeLoader()
      const options = { rootDir: '/app', extraDirs: ['/packages', '/modules'] }
      const plugin = new AutoLoaderPlugin(options, loader)

      await plugin.load(new Container())

      expect(loader.load).toHaveBeenCalledWith(options)
    })

    test('ignores container parameter', async () => {
      const loader = makeLoader()
      const get = mock(() => {
        throw new Error('should not be called')
      })
      class ThrowingContainer extends Container {
        override get<T>(ctor: ClassConstructor<T>): T {
          get(ctor)
          throw new Error('should not be called')
        }
      }
      const container = new ThrowingContainer()
      const plugin = new AutoLoaderPlugin({ rootDir: '/app' }, loader)

      await plugin.load(container)

      expect(get).not.toHaveBeenCalled()
    })
  })
})
