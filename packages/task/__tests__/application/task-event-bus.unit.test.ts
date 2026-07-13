import { beforeEach, describe, expect, it } from 'bun:test'
import { TaskCreatedIntegrationEvent } from '@shared/events'
import { TaskService } from '../../application/task.service'
import { TaskCreatedEvent } from '../../domain/events/task-created.event'
import { TaskDescription } from '../../domain/value-objects/task-description'
import { TaskTitle } from '../../domain/value-objects/task-title'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'
import { createTestEventBus } from '../helpers/event-bus-test.utils'

describe('TaskService + EventBus (unit)', () => {
  let service: TaskService
  let receivedInternalEvents: TaskCreatedEvent[]
  let receivedIntegrationEvents: TaskCreatedIntegrationEvent[]

  beforeEach(() => {
    receivedInternalEvents = []
    receivedIntegrationEvents = []

    const repository = new InMemoryTaskRepository()
    const { eventBus, logger } = createTestEventBus()

    eventBus.subscribe('TaskCreatedEvent', {
      handle: async (event) => {
        receivedInternalEvents.push(event as TaskCreatedEvent)
      },
    })

    eventBus.subscribe('TaskCreatedIntegrationEvent', {
      handle: async (event) => {
        receivedIntegrationEvents.push(event as TaskCreatedIntegrationEvent)
      },
    })

    service = new TaskService(repository, eventBus, logger)
  })

  it('publishes both internal and integration events and delivers them to subscribers', async () => {
    const created = await service.create(
      TaskTitle.create('Comprar leche'),
      TaskDescription.create('Descremada'),
    )

    expect(receivedInternalEvents).toHaveLength(1)
    expect(receivedInternalEvents[0]).toBeInstanceOf(TaskCreatedEvent)
    expect(receivedInternalEvents[0].payload.id).toBe(
      created.getId().getValue(),
    )
    expect(receivedInternalEvents[0].payload.title).toBe('Comprar leche')
    expect(receivedInternalEvents[0].payload.description).toBe('Descremada')

    expect(receivedIntegrationEvents).toHaveLength(1)
    expect(receivedIntegrationEvents[0]).toBeInstanceOf(
      TaskCreatedIntegrationEvent,
    )
    expect(receivedIntegrationEvents[0].payload.id).toBe(
      created.getId().getValue(),
    )
    expect(receivedIntegrationEvents[0].payload.title).toBe('Comprar leche')
    expect(receivedIntegrationEvents[0].payload.description).toBe('Descremada')
  })

  it('does not break task creation when one subscriber throws in test environment', async () => {
    const repository = new InMemoryTaskRepository()
    const { eventBus, logger } = createTestEventBus()

    eventBus.subscribe('TaskCreatedEvent', {
      handle: async () => {
        throw new Error('subscriber failure')
      },
    })

    const deliveredEvents: TaskCreatedEvent[] = []
    eventBus.subscribe('TaskCreatedEvent', {
      handle: async (event) => {
        deliveredEvents.push(event as TaskCreatedEvent)
      },
    })

    const resilientService = new TaskService(repository, eventBus, logger)
    const created = await resilientService.create(
      TaskTitle.create('Resilient task'),
      TaskDescription.create('event bus'),
    )

    expect(created.getTitle().getValue()).toBe('Resilient task')
    expect(deliveredEvents).toHaveLength(1)
    expect(deliveredEvents[0].payload.id).toBe(created.getId().getValue())
  })
})
