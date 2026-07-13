import { Injectable } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'
import { TaskCreatedIntegrationEvent } from '@shared/events'

interface NotificationService {
  notifyTaskCreated(task: unknown): void
}

@Injectable()
export class TaskCreatedIntegrationHandler {
  constructor(private readonly notificationService: NotificationService) {}

  @EventHandler(TaskCreatedIntegrationEvent)
  async handle(event: TaskCreatedIntegrationEvent): Promise<void> {
    console.log(
      `Received TaskCreatedIntegrationEvent for task: ${event.payload.title}, description: ${event.payload.description}`,
    )
    this.notificationService.notifyTaskCreated(event.payload)
  }
}
