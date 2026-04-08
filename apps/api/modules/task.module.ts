import { Module } from '@OneJs/core'
import { TaskSeeder } from '@task/application/bootstrap/task-seeder'
import { TaskCreatedHandler } from '@task/application/handlers/task-created.handler'
import { TaskController } from '@task/infrastructure/controllers/task.controller'

@Module({
  controllers: [TaskController],
  handlers: [TaskCreatedHandler],
  bootstrap: [TaskSeeder],
})
export class TaskModule {}
