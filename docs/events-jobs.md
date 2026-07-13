# Events & Background Jobs

OneJs splits async work into two complementary systems:

- **`@OneJs/event-bus`** — in-process pub/sub for domain & integration events. Optional Redis bridge for cross-process fan-out.
- **`@OneJs/jobs`** — BullMQ-backed durable job queue for retryable, scheduled, or long-running work.

## Event Bus (`@OneJs/event-bus`)

### Concepts

| Term | Meaning |
|------|---------|
| **Domain event** | Something that happened inside a single bounded context (e.g. `TaskCreatedEvent`). Consumed in-process. |
| **Integration event** | Cross-context contract (lives in `packages/shared/events/`). Consumed by other apps/contexts via Redis bridge. |
| **`EventBus`** | Service that publishes events and dispatches to registered handlers. |
| **`@EventHandler(EventClass)`** | Method decorator that registers the method as a handler for a given event class. |
| **`DomainEvent`** | Abstract base class — every event extends this. |
| **`EventPublisher`** | Transport port (default in-process; `RedisBridge` for distributed). |

### Define an event

```typescript
// packages/task/domain/events/task-created.event.ts
import { DomainEvent } from '@OneJs/event-bus'
import type { TaskDto } from '../../application/dtos/task.dto'
import type { Task } from '../entities/task'

export class TaskCreatedEvent extends DomainEvent {
  readonly payload: TaskDto

  constructor(task: Task) {
    super()
    this.payload = task.toDto()
  }
}
```

Always carry the **DTO** (not the entity) in the payload. The DTO is the persistence/transport boundary.

### Publish an event

```typescript
// packages/task/application/task.service.ts
import { Inject, Injectable, Logger } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { TaskCreatedEvent } from '../domain/events/task-created.event'
import { TaskCreatedIntegrationEvent } from '@shared/events'

@Injectable()
export class TaskService {
  constructor(
    @Inject(InMemoryTaskRepository) private readonly repo: ITaskRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async create(title: string, description: string): Promise<Task> {
    const task = Task.create(title, description)
    await this.repo.save(task)

    // In-context event
    await this.eventBus.publish(new TaskCreatedEvent(task))
    // Cross-app integration event
    await this.eventBus.publish(new TaskCreatedIntegrationEvent(task))

    return task
  }
}
```

### Handle an event

Handlers are normal `@Injectable()` services. Methods decorated with `@EventHandler(EventClass)` are auto-registered by the bootstrap process.

```typescript
// apps/notifications/handlers/task-created.handler.ts
import { Inject, Injectable } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'
import { TaskCreatedIntegrationEvent } from '@shared/events'
import { NotificationService } from '../application/notification.service'

@Injectable()
export class TaskCreatedHandler {
  constructor(
    @Inject(NotificationService)
    private readonly notifications: NotificationService,
  ) {}

  @EventHandler(TaskCreatedIntegrationEvent)
  async handle(event: TaskCreatedIntegrationEvent): Promise<void> {
    await this.notifications.notifyTaskCreated(event.payload)
  }
}
```

**Rules**:
1. Handlers MUST have a constructor — even empty `constructor() {}` works, but real handlers inject the collaborators they need.
2. The decorated method MUST accept exactly the event instance (typed) and return `Promise<void>`.
3. Handlers MUST NOT throw inside `handle()` if you need the publisher to succeed — wrap with try/catch and route failures to a dead-letter queue or job retry.

> **Past bug**: handlers in `apps/notifications/` shipped with empty constructors and only logged events. Fixed by injecting `NotificationService` and delegating. See git history around June 2026.

### Bootstrap

Register `EventBusPlugin` in your app entry point:

```typescript
// apps/api/index.ts
import { OneJs } from '@OneJs/core'
import { EventBusPlugin, RedisBridge } from '@OneJs/event-bus'

const container = await new OneJs()
  .use(new EventBusPlugin(new RedisBridge()))   // RedisBridge for cross-process
  .start()
```

Omit `RedisBridge` for single-process apps. Cross-context handlers in other apps require the same Redis bridge to subscribe.

### Internal vs Integration events — pattern

| | Domain event | Integration event |
|---|---|---|
| **Location** | `packages/<context>/domain/events/` | `packages/shared/events/` |
| **Audience** | Same bounded context | Other contexts / apps |
| **Stability** | Can change freely | Versioned contract — break = breaking change |
| **Transport** | In-process | Usually Redis-bridged |

The boilerplate ships both: `TaskCreatedEvent` (in-context, in `packages/task/domain/events/`) and `TaskCreatedIntegrationEvent` (cross-context, in `packages/shared/events/`). `apps/notifications/` subscribes only to the integration event.

### Testing handlers

Use `InMemoryEventBus` from `@OneJs/testing` for unit tests. See [Testing package](testing-package.md) for the full pattern.

```typescript
import { InMemoryEventBus } from '@OneJs/testing'

const bus = new InMemoryEventBus()
await service.create('hello', 'world')

const events = bus.getEventsByType(TaskCreatedEvent)
expect(events).toHaveLength(1)
```

## Background Jobs (`@OneJs/jobs`)

### Concepts

| Term | Meaning |
|------|---------|
| **Worker** | Class with `@WorkerJob(name)` method that processes queued jobs |
| **`QueueService`** | Injectable service to enqueue jobs |
| **`WorkerService`** | Internal — registers workers from decorated methods |
| **BullMQ** | Backend; requires Redis |

### Define a worker

```typescript
import { Injectable } from '@OneJs/core'
import { WorkerJob } from '@OneJs/jobs'

@Injectable()
export class EmailWorker {
  @WorkerJob('send-email')
  async process(data: { to: string; subject: string; body: string }) {
    // sending logic
    // throw to trigger BullMQ retry
  }
}
```

### Enqueue jobs

```typescript
import { Inject, Injectable } from '@OneJs/core'
import { QueueService } from '@OneJs/jobs'

@Injectable()
export class NotificationService {
  constructor(@Inject(QueueService) private readonly queue: QueueService) {}

  async notifyUser(email: string) {
    await this.queue.add('send-email', {
      to: email,
      subject: 'Welcome',
      body: '...',
    })
  }
}
```

### Bootstrap

```typescript
import { JobsPlugin } from '@OneJs/jobs'

const container = await new OneJs()
  .use(new JobsPlugin())
  .start()
```

### When to use a job (vs an event handler)

| Use a **job** when... | Use an **event handler** when... |
|---|---|
| Work is slow (> 1s) | Work is fast and in-process |
| Need retry on failure | Failure is acceptable / logged |
| Need scheduling / delay | Reaction is immediate |
| Need backpressure | No throughput concerns |
| Cross-process distribution required (via Redis) | Already covered by event bus + RedisBridge |

### Redis requirement

Both `RedisBridge` (event bus) and `@OneJs/jobs` require Redis. Default Podman setup exposes it on `localhost:6379`.

```bash
bun run start:db    # starts Postgres + Redis via podman-compose
```

Configure via env:

```bash
REDIS_URL=redis://localhost:6379
```

> Currently `RedisBridge` throws if `REDIS_URL` is missing. Single-process dev workflows that don't need cross-process fan-out can omit the bridge entirely (`new EventBusPlugin()`).

## See also

- [`@OneJs/testing`](testing-package.md) — InMemoryEventBus for unit tests
- [DDD principles](conventions/architecture/ddd-principles.md) — when to publish events
- [Service patterns](conventions/patterns/service-patterns.md) — service shape that publishes events
