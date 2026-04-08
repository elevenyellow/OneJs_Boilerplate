import { describe, it, expect, beforeEach } from 'bun:test'
import {
  Container,
  OneJs,
  PluginRegistry,
  Module,
  clearMarkers,
} from '@OneJs/core'
import { AutoLoaderPlugin, BootstrapLoader } from '@OneJs/core/bootstrap'
import { clearModules } from '@OneJs/core/bootstrap/module'
import { clearBootstraps } from '@OneJs/core/bootstrap/store'
import { Task } from '../../domain/entities/task'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'
import { TaskSeeder } from '../../application/bootstrap/task-seeder'

describe('TaskSeeder — integration (OneJs bootstrap)', () => {
  beforeEach(() => {
    clearModules()
    clearBootstraps()
    clearMarkers()
    PluginRegistry.clear()
  })

  async function bootWithSeeder(): Promise<Container> {
    @Module({ bootstrap: [TaskSeeder] })
    class TestModule {}
    void TestModule

    const container = new Container()
    await new OneJs(container)
      .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
      .use(new BootstrapLoader())
      .start()
    return container
  }

  it('seeds tasks automatically during OneJs.start()', async () => {
    const container = await bootWithSeeder()
    const repo = container.get(InMemoryTaskRepository)
    const tasks = await repo.findAll()

    expect(tasks).toHaveLength(3)
  })

  it('each seeded task is a valid Task entity', async () => {
    const container = await bootWithSeeder()
    const repo = container.get(InMemoryTaskRepository)
    const tasks = await repo.findAll()

    for (const task of tasks) {
      expect(task).toBeInstanceOf(Task)
    }
  })

  it('seeded tasks have correct DTO structure', async () => {
    const container = await bootWithSeeder()
    const repo = container.get(InMemoryTaskRepository)
    const tasks = await repo.findAll()

    for (const task of tasks) {
      const dto = task.toDto()
      expect(typeof dto.id).toBe('string')
      expect(typeof dto.title).toBe('string')
      expect(typeof dto.description).toBe('string')
      expect(dto.done).toBe(false)
      expect(dto.createdAt).toBeInstanceOf(Date)
    }
  })

  it('skips seeding when repository already has data', async () => {
    const container = await bootWithSeeder()
    const repo = container.get(InMemoryTaskRepository)

    const extra = Task.create('Extra task', 'Should not be duplicated')
    await repo.save(extra)
    expect(await repo.findAll()).toHaveLength(4)

    const seeder = container.get(TaskSeeder)
    await seeder.bootstrap()

    expect(await repo.findAll()).toHaveLength(4)
  })

  it('seeder is retrievable from DI container', async () => {
    const container = await bootWithSeeder()
    const seeder = container.get(TaskSeeder)

    expect(seeder).toBeInstanceOf(TaskSeeder)
  })
})
