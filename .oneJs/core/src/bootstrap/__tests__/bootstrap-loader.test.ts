import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { BootstrapLoader } from '../bootstrap-loader'
import { BootstrapBase } from '../bootstrap-base'
import { clearBootstraps, registerBootstrap } from '../store'
import { Container } from '../../container'

function makeContainer(instances: Map<any, any>): Container {
  const container = new Container() as any
  container.get = mock((ctor: any) => {
    if (instances.has(ctor)) return instances.get(ctor)
    throw new Error(`No service registered for type: ${ctor.name}`)
  })
  return container
}

class ConcreteBootstrap extends BootstrapBase {
  public bootstrapCalled = false
  async bootstrap(): Promise<void> {
    this.bootstrapCalled = true
  }
}

class FailingBootstrap extends BootstrapBase {
  async bootstrap(): Promise<void> {
    throw new Error('bootstrap failure')
  }
}

class NotABootstrap {
  run() {}
}

describe('BootstrapLoader', () => {
  let loader: BootstrapLoader

  beforeEach(() => {
    clearBootstraps()
    loader = new BootstrapLoader()
  })

  test('has correct name and priority', () => {
    expect(loader.name).toBe('bootstrap-loader')
    expect(loader.priority).toBe(10)
  })

  test('does nothing when no bootstrap services are registered', async () => {
    const container = makeContainer(new Map())
    await expect(loader.load(container)).resolves.toBeUndefined()
  })

  test('calls bootstrap() on each registered BootstrapBase service', async () => {
    const instance = new ConcreteBootstrap()
    registerBootstrap({ target: ConcreteBootstrap as any })

    const container = makeContainer(new Map([[ConcreteBootstrap, instance]]))
    await loader.load(container)

    expect(instance.bootstrapCalled).toBe(true)
  })

  test('continues loading remaining services even when one throws', async () => {
    const goodInstance = new ConcreteBootstrap()
    const failingInstance = new FailingBootstrap()

    registerBootstrap({ target: FailingBootstrap as any })
    registerBootstrap({ target: ConcreteBootstrap as any })

    const instances = new Map<any, any>([
      [FailingBootstrap, failingInstance],
      [ConcreteBootstrap, goodInstance],
    ])

    const container = makeContainer(instances)
    await expect(loader.load(container)).resolves.toBeUndefined()
    expect(goodInstance.bootstrapCalled).toBe(true)
  })

  test('handles container.get throwing for a target gracefully', async () => {
    registerBootstrap({ target: ConcreteBootstrap as any })
    // Container does not have ConcreteBootstrap registered - get() will throw
    const container = makeContainer(new Map())
    await expect(loader.load(container)).resolves.toBeUndefined()
  })

  test('does not call bootstrap() on instances that are not BootstrapBase', async () => {
    const instance = new NotABootstrap()
    registerBootstrap({ target: NotABootstrap as any })

    const container = makeContainer(new Map([[NotABootstrap, instance]]))
    const runSpy = mock(() => {})
    instance.run = runSpy

    await loader.load(container)
    expect(runSpy).not.toHaveBeenCalled()
  })
})
