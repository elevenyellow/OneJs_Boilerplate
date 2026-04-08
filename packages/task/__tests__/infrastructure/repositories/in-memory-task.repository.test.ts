import { beforeEach, describe, expect, it } from 'bun:test'
import { Task } from '../../../domain/entities/task'
import { InMemoryTaskRepository } from '../../../infrastructure/repositories/in-memory-task.repository'

const uuid = (n: number) => `550e8400-e29b-41d4-a716-4466554400${String(n).padStart(2, '0')}`
const task = (n: number, title = 'Test', done = false) =>
  Task.reconstitute(uuid(n), title, '', done, new Date())

describe('InMemoryTaskRepository', () => {
  let repo: InMemoryTaskRepository

  beforeEach(() => {
    repo = new InMemoryTaskRepository()
  })

  it('returns empty array when no tasks exist', async () => {
    expect(await repo.findAll()).toEqual([])
  })

  it('saves and retrieves a task by id', async () => {
    await repo.save(task(1, 'Buy milk'))

    const found = await repo.findById(uuid(1))
    expect(found).not.toBeNull()
    expect(found!.getId().getValue()).toBe(uuid(1))
    expect(found!.title.getValue()).toBe('Buy milk')
  })

  it('returns null for unknown id', async () => {
    expect(await repo.findById(uuid(99))).toBeNull()
  })

  it('findAll returns all saved tasks', async () => {
    await repo.save(task(1, 'First'))
    await repo.save(task(2, 'Second'))
    expect(await repo.findAll()).toHaveLength(2)
  })

  it('overwrites a task on save with same id', async () => {
    const original = task(1, 'Original')
    await repo.save(original)
    await repo.save(original.complete())

    expect((await repo.findById(uuid(1)))!.status.getValue()).toBe(true)
  })

  it('deletes a task by id', async () => {
    await repo.save(task(1))
    await repo.delete(uuid(1))
    expect(await repo.findById(uuid(1))).toBeNull()
  })

  it('does nothing when deleting non-existent id', async () => {
    await expect(repo.delete(uuid(99))).resolves.toBeUndefined()
  })
})
