import { beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  Container,
  Injectable,
  Logger,
  Module,
  OneJs,
  PluginRegistry,
  clearMarkers,
} from '@OneJs/core'
import { AutoLoaderPlugin, BootstrapLoader } from '@OneJs/core/bootstrap'
import { clearModules } from '@OneJs/core/bootstrap/module'
import { EventBus, EventBusPlugin, EventHandler } from '@OneJs/event-bus'
import { clearEventHandlers } from '@OneJs/event-bus/domain/store'
import { TaskService } from '@task/application/task.service'
import { TaskCreatedIntegrationEvent } from '@shared/events'
import { InMemoryTaskRepository } from '@task/infrastructure/repositories/in-memory-task.repository'

describe('Cross-app event communication (task -> notifications)', () => {
  beforeEach(() => {
    clearModules()
    clearMarkers()
    clearEventHandlers()
    PluginRegistry.clear()
  })

  it('delivers TaskCreatedIntegrationEvent to a handler from another app', async () => {
    const onTaskCreatedIntegration = mock(
      async (_event: TaskCreatedIntegrationEvent) => undefined,
    )

    @Injectable()
    class NotificationProbeHandler {
      @EventHandler(TaskCreatedIntegrationEvent)
      async handle(event: TaskCreatedIntegrationEvent): Promise<void> {
        await onTaskCreatedIntegration(event)
      }
    }

    @Module({
      handlers: [NotificationProbeHandler],
    })
    class NotificationProbeModule {}
    void NotificationProbeModule

    PluginRegistry.register(new EventBusPlugin())

    const container = new Container()
    await new OneJs(container)
      .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
      .use(new BootstrapLoader())
      .start()

    const eventBus = container.get(EventBus)
    const repository = new InMemoryTaskRepository()
    const logger = new Logger({}, false)
    const service = new TaskService(repository, eventBus, logger)

    const created = await service.create('Cross App', 'Task app emitted this')

    expect(onTaskCreatedIntegration).toHaveBeenCalledTimes(1)
    const received = onTaskCreatedIntegration.mock
      .calls[0][0] as TaskCreatedIntegrationEvent

    expect(received).toBeInstanceOf(TaskCreatedIntegrationEvent)
    expect(received.payload.id).toBe(created.getId().getValue())
    expect(received.payload.title).toBe('Cross App')
  })
})
