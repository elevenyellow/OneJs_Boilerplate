import { Injectable } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'
import { TaskCompletedIntegrationEvent } from '@shared/events'

interface NotificationService {
  notifyTaskCompleted(task: unknown): void
}

@Injectable()
export class TaskCompletedIntegrationHandler {
  constructor(private readonly notificationService: NotificationService) {}

  @EventHandler(TaskCompletedIntegrationEvent)
  async handle(event: TaskCompletedIntegrationEvent): Promise<void> {
    const { title } = event.payload

    console.log(`Received TaskCompletedIntegrationEvent for task: ${title}`)
    this.notificationService.notifyTaskCompleted(event.payload)
  }
}
