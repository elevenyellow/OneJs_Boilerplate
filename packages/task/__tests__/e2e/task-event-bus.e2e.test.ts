import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Elysia } from 'elysia'
import { TaskCreatedIntegrationEvent } from '@shared/events'
import { createSuccessResponse } from '@OneJs/server/types/response'
import { TaskService } from '../../application/task.service'
import { TaskController } from '../../infrastructure/controllers/task.controller'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'
import { TaskCreatedEvent } from '../../domain/events/task-created.event'
import { createTestEventBus } from '../helpers/event-bus-test.utils'

const BASE_URL = 'http://test'

function post(path: string, body: object) {
  return new Request(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Task API + EventBus (e2e)', () => {
  let app: Elysia
  const onTaskCreated = mock(async (_event: TaskCreatedEvent) => undefined)
  const onTaskCreatedIntegration = mock(
    async (_event: TaskCreatedIntegrationEvent) => undefined,
  )

  beforeEach(() => {
    onTaskCreated.mockClear()
    onTaskCreatedIntegration.mockClear()

    const repository = new InMemoryTaskRepository()
    const { eventBus, logger } = createTestEventBus()

    eventBus.subscribe('TaskCreatedEvent', {
      handle: async (event) => {
        await onTaskCreated(event as TaskCreatedEvent)
      },
    })

    eventBus.subscribe('TaskCreatedIntegrationEvent', {
      handle: async (event) => {
        await onTaskCreatedIntegration(event as TaskCreatedIntegrationEvent)
      },
    })

    const service = new TaskService(repository, eventBus, logger)
    const controller = new TaskController(service)

    app = new Elysia({ prefix: '/api' }).post('/tasks', async (ctx) => {
      const result = await controller.create(ctx)
      return createSuccessResponse(result)
    })
  })

  it('POST /api/tasks publishes internal and integration events and notifies subscribers', async () => {
    const response = await app.handle(
      post('/api/tasks', { title: 'E2E Event', description: 'verificar bus' }),
    )

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.title).toBe('E2E Event')

    expect(onTaskCreated).toHaveBeenCalledTimes(1)
    const received = onTaskCreated.mock.calls[0][0] as TaskCreatedEvent
    expect(received).toBeInstanceOf(TaskCreatedEvent)
    expect(received.payload.id).toBe(body.data.id)
    expect(received.payload.title).toBe('E2E Event')

    expect(onTaskCreatedIntegration).toHaveBeenCalledTimes(1)
    const integrationReceived = onTaskCreatedIntegration.mock
      .calls[0][0] as TaskCreatedIntegrationEvent
    expect(integrationReceived).toBeInstanceOf(TaskCreatedIntegrationEvent)
    expect(integrationReceived.payload.id).toBe(body.data.id)
    expect(integrationReceived.payload.title).toBe('E2E Event')
  })

  it('POST /api/tasks still returns 201 when one internal subscriber fails', async () => {
    const repository = new InMemoryTaskRepository()
    const { eventBus, logger } = createTestEventBus()

    const resilientIntegrationHandler = mock(
      async (_event: TaskCreatedIntegrationEvent) => undefined,
    )

    eventBus.subscribe('TaskCreatedEvent', {
      handle: async () => {
        throw new Error('internal subscriber failure')
      },
    })

    eventBus.subscribe('TaskCreatedIntegrationEvent', {
      handle: async (event) => {
        await resilientIntegrationHandler(event as TaskCreatedIntegrationEvent)
      },
    })

    const service = new TaskService(repository, eventBus, logger)
    const controller = new TaskController(service)
    const resilientApp = new Elysia({ prefix: '/api' }).post(
      '/tasks',
      async (ctx) => {
        const result = await controller.create(ctx)
        return createSuccessResponse(result)
      },
    )

    const response = await resilientApp.handle(
      post('/api/tasks', { title: 'Resilience E2E', description: 'event bus' }),
    )

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.title).toBe('Resilience E2E')

    expect(resilientIntegrationHandler).toHaveBeenCalledTimes(1)
    const received = resilientIntegrationHandler.mock
      .calls[0][0] as TaskCreatedIntegrationEvent
    expect(received.payload.id).toBe(body.data.id)
  })
})
