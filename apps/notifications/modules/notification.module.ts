import { Module } from '@OneJs/core'
import { TaskCompletedIntegrationHandler } from '../../../packages/task/application/handlers/task-completed-integration.handler'
import { TaskCreatedIntegrationHandler } from '../../../packages/task/application/handlers/task-created-integration.handler'
import { NotificationService } from '../services/notification.service'

@Module({
  providers: [NotificationService],
  handlers: [TaskCreatedIntegrationHandler, TaskCompletedIntegrationHandler],
})
export class NotificationModule {}
