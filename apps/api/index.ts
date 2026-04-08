import { AuthPlugin, ClerkStrategy, logger, OneJs } from '@OneJs/core'
import { AutoLoaderPlugin, BootstrapLoader } from '@OneJs/core/bootstrap'
import { EventBus, EventBusPlugin, RedisBridge } from '@OneJs/event-bus'
import { type AnyMiddleware, Server, ServerPlugin } from '@OneJs/server'
import cors from '@elysiajs/cors'
import { TaskCreatedIntegrationEvent } from '@shared'
import { Task } from '@task/domain/entities/task'

const container = await new OneJs()
  .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
  .use(new BootstrapLoader())
  .use(new AuthPlugin(ClerkStrategy))
  .use(new ServerPlugin())
  .use(new EventBusPlugin(new RedisBridge()))
  .start()

const port = Number(process.env.PORT ?? 4000)

container
  .get(Server)
  .setPrefix('/api')
  .use(cors({ credentials: true }) as unknown as AnyMiddleware)
  .start(port, () => {
    logger.info('api:startup', `Server started on port ${port}`)
  })

const eventBus = container.get(EventBus)

const _task = Task.create('Test task', 'This is a test task')
const task2 = Task.create(
  'Completed task',
  'This is another completed test task',
)

// const integrationEvent = new TaskCreatedIntegrationEvent(task)
// const integrationEvent2 = new TaskCreatedIntegrationEvent(task2)
const taskCompletedIntegrationEvent = new TaskCreatedIntegrationEvent(task2)

// eventBus.publish(integrationEvent)
eventBus.publish(taskCompletedIntegrationEvent)
