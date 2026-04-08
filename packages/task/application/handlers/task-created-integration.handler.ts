import { Injectable } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'
import { TaskCreatedIntegrationEvent } from '@shared/events'

@Injectable()
export class TaskCreatedIntegrationHandler {
  constructor() {}

  @EventHandler(TaskCreatedIntegrationEvent)
  async handle(event: TaskCreatedIntegrationEvent): Promise<void> {
    console.log(
      `Received TaskCreatedIntegrationEvent for task: ${event.payload.title}, description: ${event.payload.description}`,
    )
  }
}
