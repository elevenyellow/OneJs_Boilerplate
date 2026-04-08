import { beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  Container,
  Injectable,
  Module,
  OneJs,
  PluginRegistry,
  clearMarkers,
} from '@OneJs/core'
import { AutoLoaderPlugin, BootstrapLoader } from '@OneJs/core/bootstrap'
import { EventBus, EventBusPlugin, EventHandler } from '@OneJs/event-bus'
import { clearEventHandlers } from '@OneJs/event-bus/domain/store'
import { TaskCreatedIntegrationEvent } from '@shared/events'
import { clearModules } from '@OneJs/core/bootstrap/module'
import { TaskService } from '../../application/task.service'
import { TaskCreatedEvent } from '../../domain/events/task-created.event'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'
import { createTestLogger } from '../helpers/event-bus-test.utils'

describe('Task module + EventBusPlugin (integration)', () => {
  beforeEach(() => {
    clearModules()
    clearMarkers()
    clearEventHandlers()
    PluginRegistry.clear()
  })

  it('wires @EventHandler and receives TaskCreatedEvent from TaskService.create()', async () => {
    const onTaskCreated = mock(async (_event: TaskCreatedEvent) => undefined)
    const onTaskCreatedIntegration = mock(
      async (_event: TaskCreatedIntegrationEvent) => undefined,
    )

    @Injectable()
    class TaskCreatedProbeHandler {
      @EventHandler(TaskCreatedEvent)
      async handle(event: TaskCreatedEvent): Promise<void> {
        await onTaskCreated(event)
      }
    }

    @Injectable()
    class TaskCreatedIntegrationProbeHandler {
      @EventHandler(TaskCreatedIntegrationEvent)
      async handle(event: TaskCreatedIntegrationEvent): Promise<void> {
        await onTaskCreatedIntegration(event)
      }
    }

    @Module({
      handlers: [TaskCreatedProbeHandler, TaskCreatedIntegrationProbeHandler],
    })
    class TaskEventBusIntegrationModule {}
    void TaskEventBusIntegrationModule

    PluginRegistry.register(new EventBusPlugin())

    const container = new Container()
    await new OneJs(container)
      .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
      .use(new BootstrapLoader())
      .start()

    const eventBus = container.get(EventBus)
    const repository = new InMemoryTaskRepository()
    const logger = createTestLogger()
    const taskService = new TaskService(repository, eventBus, logger)
    const created = await taskService.create('Integration event', 'Bus wiring')

    expect(onTaskCreated).toHaveBeenCalledTimes(1)
    const received = onTaskCreated.mock.calls[0][0] as TaskCreatedEvent
    expect(received).toBeInstanceOf(TaskCreatedEvent)
    expect(received.payload.id).toBe(created.getId().getValue())
    expect(received.payload.title).toBe('Integration event')

    expect(onTaskCreatedIntegration).toHaveBeenCalledTimes(1)
    const integrationReceived = onTaskCreatedIntegration.mock
      .calls[0][0] as TaskCreatedIntegrationEvent
    expect(integrationReceived).toBeInstanceOf(TaskCreatedIntegrationEvent)
    expect(integrationReceived.payload.id).toBe(created.getId().getValue())
    expect(integrationReceived.payload.title).toBe('Integration event')
  })

  it('continues dispatching events when one decorated handler throws in test environment', async () => {
    const onResilientHandler = mock(
      async (_event: TaskCreatedIntegrationEvent) => undefined,
    )

    @Injectable()
    class FailingTaskCreatedHandler {
      @EventHandler(TaskCreatedEvent)
      async handle(): Promise<void> {
        throw new Error('handler failure')
      }
    }

    @Injectable()
    class ResilientTaskCreatedIntegrationHandler {
      @EventHandler(TaskCreatedIntegrationEvent)
      async handle(event: TaskCreatedIntegrationEvent): Promise<void> {
        await onResilientHandler(event)
      }
    }

    @Module({
      handlers: [
        FailingTaskCreatedHandler,
        ResilientTaskCreatedIntegrationHandler,
      ],
    })
    class TaskEventBusResilientModule {}
    void TaskEventBusResilientModule

    PluginRegistry.register(new EventBusPlugin())

    const container = new Container()
    await new OneJs(container)
      .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
      .use(new BootstrapLoader())
      .start()

    const eventBus = container.get(EventBus)
    const repository = new InMemoryTaskRepository()
    const logger = createTestLogger()
    const taskService = new TaskService(repository, eventBus, logger)

    const created = await taskService.create(
      'Resilience integration',
      'event bus',
    )

    expect(created.title.getValue()).toBe('Resilience integration')
    expect(onResilientHandler).toHaveBeenCalledTimes(1)
    const received = onResilientHandler.mock
      .calls[0][0] as TaskCreatedIntegrationEvent
    expect(received.payload.id).toBe(created.getId().getValue())
  })
})
