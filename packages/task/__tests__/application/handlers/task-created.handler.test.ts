import { describe, expect, it, mock } from 'bun:test'
import { TaskCreatedHandler } from '../../../application/handlers/task-created.handler'
import { Task } from '../../../domain/entities/task'
import { TaskCreatedEvent } from '../../../domain/events/task-created.event'

const UUID = '550e8400-e29b-41d4-a716-446655440000'

function makeLogger() {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  }
}

describe('TaskCreatedHandler', () => {
  it('logs the created task id and title', async () => {
    const logger = makeLogger()
    const handler = new TaskCreatedHandler(logger as any)

    const task = Task.reconstitute(UUID, 'Buy milk', '', false, new Date())
    const event = new TaskCreatedEvent(task)

    await handler.handle(event)

    expect(logger.info).toHaveBeenCalledTimes(1)
    const [namespace, message] = (logger.info as any).mock.calls[0]
    expect(namespace).toBe('task:events')
    expect(message).toContain(UUID)
    expect(message).toContain('Buy milk')
  })
})
