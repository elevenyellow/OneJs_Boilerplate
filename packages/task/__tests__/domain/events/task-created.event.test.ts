import { describe, expect, it } from 'bun:test'
import { Task } from '../../../domain/entities/task'
import { TaskCreatedEvent } from '../../../domain/events/task-created.event'

const UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('TaskCreatedEvent', () => {
  it('creates an event with the task DTO as payload', () => {
    const task = Task.reconstitute(
      UUID,
      'Buy milk',
      'Full fat',
      false,
      new Date(),
    )
    const event = new TaskCreatedEvent(task)

    expect(event.payload.id).toBe(UUID)
    expect(event.payload.title).toBe('Buy milk')
    expect(event.payload.description).toBe('Full fat')
    expect(event.payload.done).toBe(false)
    expect(event.payload.createdAt).toBeInstanceOf(Date)
  })

  it('sets occurredOn to the current date by default', () => {
    const before = new Date()
    const task = Task.reconstitute(UUID, 'Test', '', false, new Date())
    const event = new TaskCreatedEvent(task)
    const after = new Date()

    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('getOccurredOn() returns the event timestamp', () => {
    const task = Task.reconstitute(UUID, 'Test', '', false, new Date())
    const event = new TaskCreatedEvent(task)

    expect(event.getOccurredOn()).toBe(event.occurredOn)
  })
})
