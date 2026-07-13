import { beforeEach, describe, expect, test } from 'bun:test'
import { Container } from '.././container'
import { ContainerProvider } from '.././container-provider'

describe('ContainerProvider', () => {
  beforeEach(() => {
    ContainerProvider.clear()
  })

  describe('setContainer / getContainer', () => {
    test('returns the container that was set', () => {
      const c = new Container()
      ContainerProvider.setContainer(c)
      expect(ContainerProvider.getContainer()).toBe(c)
    })

    test('throws when no container has been set', () => {
      expect(() => ContainerProvider.getContainer()).toThrow(
        'Container not initialized. Call ContainerProvider.setContainer() first.',
      )
    })

    test('replaces the previous container when set again', () => {
      const first = new Container()
      const second = new Container()
      ContainerProvider.setContainer(first)
      ContainerProvider.setContainer(second)
      expect(ContainerProvider.getContainer()).toBe(second)
    })
  })

  describe('hasContainer', () => {
    test('returns false before any container is set', () => {
      expect(ContainerProvider.hasContainer()).toBe(false)
    })

    test('returns true after a container is set', () => {
      ContainerProvider.setContainer(new Container())
      expect(ContainerProvider.hasContainer()).toBe(true)
    })

    test('returns false after clear', () => {
      ContainerProvider.setContainer(new Container())
      ContainerProvider.clear()
      expect(ContainerProvider.hasContainer()).toBe(false)
    })
  })

  describe('clear', () => {
    test('is a no-op when no container is set', () => {
      expect(() => ContainerProvider.clear()).not.toThrow()
    })

    test('makes getContainer throw after clearing', () => {
      ContainerProvider.setContainer(new Container())
      ContainerProvider.clear()
      expect(() => ContainerProvider.getContainer()).toThrow()
    })
  })
})
