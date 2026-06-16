import { BootstrapBase, Inject, Injectable, Logger } from '@OneJs/core'
import { Task } from '../../domain/entities/task'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'

const DEFAULT_TASKS = [
  { title: 'Setup project', description: 'Initialize the project structure' },
  { title: 'Configure database', description: 'Set up PostgreSQL connection' },
  { title: 'Write tests', description: 'Add unit and integration tests' },
]

@Injectable()
export class TaskSeeder extends BootstrapBase {
  constructor(
    @Inject(InMemoryTaskRepository)
    private readonly repository: InMemoryTaskRepository,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    super()
  }

  async bootstrap(): Promise<void> {
    const existing = await this.repository.findAll()
    if (existing.length > 0) {
      this.logger.debug('task:seeder', 'Tasks already exist, skipping seed')
      return
    }

    for (const { title, description } of DEFAULT_TASKS) {
      const task = Task.create(title, description)
      await this.repository.save(task)
    }

    this.logger.info(
      'task:seeder',
      `Seeded ${DEFAULT_TASKS.length} default tasks`,
    )
  }
}
