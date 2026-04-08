import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { TaskSeeder } from '../../../application/bootstrap/task-seeder'
import { InMemoryTaskRepository } from '../../../infrastructure/repositories/in-memory-task.repository'

const mockLogger = {
  info: mock(() => {}),
  debug: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
} as any

describe('TaskSeeder', () => {
  let seeder: TaskSeeder
  let repository: InMemoryTaskRepository

  beforeEach(() => {
    repository = new InMemoryTaskRepository()
    seeder = new TaskSeeder(repository, mockLogger)
    mockLogger.info.mockClear()
    mockLogger.debug.mockClear()
  })

  it('seeds 3 default tasks into an empty repository', async () => {
    await seeder.bootstrap()

    const tasks = await repository.findAll()
    expect(tasks).toHaveLength(3)
  })

  it('seeds tasks with the correct titles', async () => {
    await seeder.bootstrap()

    const tasks = await repository.findAll()
    const titles = tasks.map((t) => t.title.getValue())

    expect(titles).toContain('Setup project')
    expect(titles).toContain('Configure database')
    expect(titles).toContain('Write tests')
  })

  it('seeds tasks with pending status', async () => {
    await seeder.bootstrap()

    const tasks = await repository.findAll()
    for (const task of tasks) {
      expect(task.status.getValue()).toBe(false)
    }
  })

  it('skips seeding when tasks already exist', async () => {
    await seeder.bootstrap()
    const countAfterFirst = (await repository.findAll()).length

    await seeder.bootstrap()
    const countAfterSecond = (await repository.findAll()).length

    expect(countAfterFirst).toBe(3)
    expect(countAfterSecond).toBe(3)
  })

  it('logs info message after seeding', async () => {
    await seeder.bootstrap()

    expect(mockLogger.info).toHaveBeenCalledWith(
      'task:seeder',
      'Seeded 3 default tasks',
    )
  })

  it('logs debug skip message when tasks exist', async () => {
    await seeder.bootstrap()
    mockLogger.debug.mockClear()

    await seeder.bootstrap()

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'task:seeder',
      'Tasks already exist, skipping seed',
    )
  })
})
