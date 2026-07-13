# Testing Package (`@OneJs/testing`)

Reusable test doubles for OneJs projects: InMemory fakes for the EventBus, a silent Logger, and a minimal spy helper.

This package replaces ad-hoc `mock()` / `spyOn()` usage in unit tests, aligning with the project rule: **unit tests use zero mocks** (see [`docs/conventions/patterns/testing.md`](conventions/patterns/testing.md)).

## Package

```typescript
import {
  InMemoryEventBus,   // synchronous, in-process EventBus
  SilentLogger,       // no-op Logger
  TestHelpers,        // waitFor + spy utilities
} from '@OneJs/testing'
```

## When to use

| Scenario | Use |
|----------|-----|
| Unit test of a service that publishes events | `InMemoryEventBus` |
| Unit test of any service that needs `Logger` | `SilentLogger` |
| Waiting on async state in integration tests | `TestHelpers.waitFor` |
| Capturing function calls without `bun:test mock()` | `TestHelpers.spy` |

For repository fakes, use the **InMemory adapter that already lives next to your production adapter** (e.g. `InMemoryUserRepository`) — don't reinvent it here.

## `InMemoryEventBus`

Drop-in replacement for `EventBus` in unit tests. Publishes synchronously, captures events for assertions, lets you subscribe handlers manually.

```typescript
import { describe, it, expect, beforeEach } from 'bun:test'
import { InMemoryEventBus, SilentLogger } from '@OneJs/testing'
import { TaskService } from '../task.service'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'
import { TaskCreatedEvent } from '../../domain/events/task-created.event'

describe('TaskService.create', () => {
  let service: TaskService
  let eventBus: InMemoryEventBus
  let repo: InMemoryTaskRepository

  beforeEach(() => {
    eventBus = new InMemoryEventBus()
    repo = new InMemoryTaskRepository()
    service = new TaskService(repo, eventBus as any, new SilentLogger())
  })

  it('publishes TaskCreatedEvent when a task is created', async () => {
    // Act
    await service.create('Buy milk', 'Whole milk only')

    // Assert
    const events = eventBus.getEventsByType(TaskCreatedEvent)
    expect(events).toHaveLength(1)
    expect(events[0].payload.title).toBe('Buy milk')
  })
})
```

### API

```typescript
class InMemoryEventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe(eventName: string, handler: (e: any) => Promise<void>): void

  getPublishedEvents(): DomainEvent[]
  getEventsByType<T extends DomainEvent>(type: new (...args: any[]) => T): T[]

  clear(): void   // reset between tests
}
```

### Limits

- **No middleware support** (production `EventBus` runs registered middlewares; this fake does not). If your test depends on middleware behavior, write it as an integration test using the real `EventBus`.
- **No Redis bridge** — events stay in-process. Cross-process scenarios require an integration test against a real `RedisBridge`.
- **No priority ordering** — handlers fire in subscription order.

## `SilentLogger`

Implements the `Logger` interface but discards every message. Use it whenever you inject `Logger` into a service under test and don't want noise in test output.

```typescript
import { SilentLogger } from '@OneJs/testing'

const logger = new SilentLogger()
const service = new MyService(repo, eventBus, logger)
```

If a specific test needs to assert a log was emitted, write a small inline fake instead — `SilentLogger` is for the 99% case where logs are irrelevant to the assertion.

## `TestHelpers.waitFor`

Polling helper for async state in integration / e2e tests.

```typescript
import { TestHelpers } from '@OneJs/testing'

await TestHelpers.waitFor(
  () => notificationService.received.length === 1,
  5000,   // timeoutMs (default 5000)
  50,     // intervalMs (default 100)
)
```

Throws `Error('waitFor timeout after 5000ms')` if condition is never true.

## `TestHelpers.spy`

Lightweight call recorder. Use this instead of `mock()` from `bun:test` when you just need to capture calls and (optionally) return a value.

```typescript
import { TestHelpers } from '@OneJs/testing'

const notificationService = {
  notifyTaskCreated: TestHelpers.spy((task: unknown) => undefined),
}

const handler = new TaskCreatedIntegrationHandler(notificationService as any)
await handler.handle(new TaskCreatedIntegrationEvent(task))

expect(notificationService.notifyTaskCreated.callCount).toBe(1)
expect(notificationService.notifyTaskCreated.calls[0][0]).toEqual(task.toDto())
```

Each spy exposes:
- `.calls` — array of argument tuples for every call
- `.callCount` — number of calls

## Worked example: service + event publication

This mirrors the real test in `packages/task/__tests__/application/task.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'bun:test'
import { InMemoryEventBus, SilentLogger } from '@OneJs/testing'
import { TaskService } from '../../application/task.service'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'
import { TaskCreatedEvent } from '../../domain/events/task-created.event'
import { TaskCreatedIntegrationEvent } from '@shared/events'

describe('TaskService', () => {
  let service: TaskService
  let bus: InMemoryEventBus

  beforeEach(() => {
    bus = new InMemoryEventBus()
    service = new TaskService(
      new InMemoryTaskRepository(),
      bus as any,
      new SilentLogger(),
    )
  })

  describe('create', () => {
    it('persists the task and publishes both internal and integration events', async () => {
      // Act
      const task = await service.create('Ship Phase 1', 'Modularize @OneJs/core')

      // Assert (persistence)
      expect(task.getId().getValue()).toBeDefined()

      // Assert (events)
      const internalEvents = bus.getEventsByType(TaskCreatedEvent)
      const integrationEvents = bus.getEventsByType(TaskCreatedIntegrationEvent)
      expect(internalEvents).toHaveLength(1)
      expect(integrationEvents).toHaveLength(1)
      expect(internalEvents[0].payload.title).toBe('Ship Phase 1')
    })
  })
})
```

## Worked example: event handler with injected dependency

This mirrors `apps/notifications/__tests__/task-created-integration.handler.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test'
import { TestHelpers } from '@OneJs/testing'
import { TaskCreatedIntegrationEvent } from '@shared/events'
import { Task } from '@task/domain/entities/task'
import { TaskCreatedIntegrationHandler } from '../../packages/task/application/handlers/task-created-integration.handler'

describe('TaskCreatedIntegrationHandler', () => {
  it('forwards the event payload to the notification service', async () => {
    // Arrange
    const notificationService = {
      notifyTaskCreated: TestHelpers.spy(() => undefined),
      notifyTaskCompleted: TestHelpers.spy(() => undefined),
    }
    const handler = new TaskCreatedIntegrationHandler(notificationService as any)
    const task = Task.create('Cross-app event', 'fan-out')

    // Act
    await handler.handle(new TaskCreatedIntegrationEvent(task))

    // Assert
    expect(notificationService.notifyTaskCreated.callCount).toBe(1)
    const dto = notificationService.notifyTaskCreated.calls[0][0] as any
    expect(dto.id).toBe(task.getId().getValue())
  })
})
```

## See also

- [Testing conventions](conventions/patterns/testing.md) — AAA, FIRST, unit vs integration boundaries
- [TDD practices](conventions/patterns/tdd-practices.md) — Reason → Red → Green → Refactor → Re-evaluate cycle
- [Events & Jobs](events-jobs.md) — how the real `EventBus` and handlers work
