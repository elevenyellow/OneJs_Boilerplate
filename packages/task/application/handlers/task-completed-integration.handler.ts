import { Injectable } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'
import { TaskCompletedIntegrationEvent } from '@shared/events'

@Injectable()
export class TaskCompletedIntegrationHandler {
  constructor() {}

  @EventHandler(TaskCompletedIntegrationEvent)
  async handle(event: TaskCompletedIntegrationEvent): Promise<void> {
    const { title } = event.payload

    console.log(`Received TaskCompletedIntegrationEvent for task: ${title}`)
  }
}
