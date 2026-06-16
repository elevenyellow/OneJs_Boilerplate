import { describe, expect, it, mock } from 'bun:test'
import { TaskCompletedIntegrationEvent } from '@shared/events'
import { Task } from '@task/domain/entities/task'
import { TaskCompletedIntegrationHandler } from '../../../packages/task/application/handlers/task-completed-integration.handler'

function makeNotificationService() {
  return {
    notifyTaskCreated: mock((_task: unknown) => undefined),
    notifyTaskCompleted: mock((_task: unknown) => undefined),
  }
}

describe('TaskCompletedIntegrationHandler', () => {
  it('notifies when receiving a cross-app task completed event', async () => {
    const notificationService = makeNotificationService()
    const handler = new TaskCompletedIntegrationHandler(
      notificationService as any,
    )
    const task = Task.create('Fix production bug', 'urgent').complete()

    await handler.handle(new TaskCompletedIntegrationEvent(task))

    expect(notificationService.notifyTaskCompleted).toHaveBeenCalledTimes(1)
    const dto = notificationService.notifyTaskCompleted.mock
      .calls[0][0] as ReturnType<typeof task.toDto>
    expect(dto.title).toBe('Fix production bug')
    expect(dto.done).toBe(true)
  })
})
