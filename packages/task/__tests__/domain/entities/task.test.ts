import { describe, expect, it } from 'bun:test'
import { Task } from '../../../domain/entities/task'
import { TaskDescription } from '../../../domain/value-objects/task-description'
import { TaskTitle } from '../../../domain/value-objects/task-title'

const UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('Task', () => {
  describe('create()', () => {
    it('creates a task with a generated UUID v4, done=false and a createdAt date', () => {
      const task = Task.create(
        TaskTitle.create('Buy milk'),
        TaskDescription.create('From the supermarket'),
      )

      expect(task.getId().getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
      expect(task.getTitle().getValue()).toBe('Buy milk')
      expect(task.getDescription().getValue()).toBe('From the supermarket')
      expect(task.getStatus().getValue()).toBe(false)
      expect(task.getCreatedAt()).toBeInstanceOf(Date)
    })

    it('each call generates a unique id', () => {
      const a = Task.create(TaskTitle.create('A'), TaskDescription.create(''))
      const b = Task.create(TaskTitle.create('B'), TaskDescription.create(''))
      expect(a.getId().getValue()).not.toBe(b.getId().getValue())
    })

    it('throws when title is empty', () => {
      expect(() =>
        Task.create(TaskTitle.create(''), TaskDescription.create('')),
      ).toThrow('TaskTitle cannot be empty')
    })

    it('throws when title exceeds max length', () => {
      expect(() =>
        Task.create(
          TaskTitle.create('a'.repeat(101)),
          TaskDescription.create(''),
        ),
      ).toThrow('TaskTitle cannot exceed')
    })

    it('throws when description exceeds max length', () => {
      expect(() =>
        Task.create(
          TaskTitle.create('Title'),
          TaskDescription.create('x'.repeat(501)),
        ),
      ).toThrow('TaskDescription cannot exceed')
    })
  })

  describe('reconstitute()', () => {
    it('restores a task with a known UUID and state', () => {
      const createdAt = new Date('2024-01-01')
      const task = Task.reconstitute(UUID, 'Buy milk', 'Desc', true, createdAt)

      expect(task.getId().getValue()).toBe(UUID)
      expect(task.getTitle().getValue()).toBe('Buy milk')
      expect(task.getDescription().getValue()).toBe('Desc')
      expect(task.getStatus().getValue()).toBe(true)
      expect(task.getCreatedAt()).toBe(createdAt)
    })

    it('throws when id is not a valid UUID v4', () => {
      expect(() =>
        Task.reconstitute('not-a-uuid', 'Title', '', false, new Date()),
      ).toThrow('Invalid TaskId format')
    })
  })

  describe('complete()', () => {
    it('returns a new Task with done=true', () => {
      expect(
        Task.create(TaskTitle.create('Buy milk'), TaskDescription.create(''))
          .complete()
          .getStatus()
          .getValue(),
      ).toBe(true)
    })

    it('does not mutate the original task', () => {
      const task = Task.create(
        TaskTitle.create('Buy milk'),
        TaskDescription.create(''),
      )
      task.complete()
      expect(task.getStatus().getValue()).toBe(false)
    })

    it('preserves all other fields', () => {
      const createdAt = new Date('2024-01-01')
      const task = Task.reconstitute(
        UUID,
        'Write tests',
        'Use bun:test',
        false,
        createdAt,
      )
      const completed = task.complete()

      expect(completed.getId().getValue()).toBe(UUID)
      expect(completed.getTitle().getValue()).toBe('Write tests')
      expect(completed.getDescription().getValue()).toBe('Use bun:test')
      expect(completed.getCreatedAt()).toBe(createdAt)
    })
  })

  describe('toDto()', () => {
    it('returns a TaskDto with primitive values', () => {
      const task = Task.reconstitute(
        UUID,
        'Title',
        'Desc',
        false,
        new Date('2024-01-01'),
      )
      const dto = task.toDto()

      expect(dto.id).toBe(UUID)
      expect(dto.title).toBe('Title')
      expect(dto.description).toBe('Desc')
      expect(dto.done).toBe(false)
    })
  })
})
