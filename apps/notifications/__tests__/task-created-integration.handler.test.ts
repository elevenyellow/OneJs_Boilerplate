import { describe, expect, it, mock } from 'bun:test'
import { TaskCreatedIntegrationHandler } from '../../../packages/task/application/handlers/task-created-integration.handler'
import { TaskCreatedIntegrationEvent } from '@shared/events'
import { Task } from '@task/domain/entities/task'

function makeNotificationService() {
  return {
    notifyTaskCreated: mock((_task: unknown) => undefined),
    notifyTaskCompleted: mock((_task: unknown) => undefined),
  }
}

describe('TaskCreatedIntegrationHandler', () => {
  it('notifies when receiving a cross-app task created event', async () => {
    const notificationService = makeNotificationService()
    const handler = new TaskCreatedIntegrationHandler(
      notificationService as any,
    )
    const task = Task.create('Task from task app', 'cross-app event')

    await handler.handle(new TaskCreatedIntegrationEvent(task))

    expect(notificationService.notifyTaskCreated).toHaveBeenCalledTimes(1)
    const dto = notificationService.notifyTaskCreated.mock
      .calls[0][0] as ReturnType<typeof task.toDto>
    expect(dto.id).toBe(task.getId().getValue())
    expect(dto.title).toBe('Task from task app')
  })
})
