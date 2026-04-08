# Events & Background Jobs

OneJs provides robust support for event-driven architecture and asynchronous task processing.

## Event Bus

The Event Bus allows different parts of your application to communicate without being tightly coupled.

### Publishing Events
Define a domain event and publish it using the `EventBus`.

```typescript
import { EventBus } from '@OneJs/event-bus'
import { UserCreatedEvent } from '../events/user-created.event'

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus
  ) {}

  async execute(data: any) {
    // ... logic ...
    await this.eventBus.publish(new UserCreatedEvent(user))
  }
}
```

### Handling Events
Create an observer (handler) to react to specific events.

```typescript
import { OnEvent } from '@OneJs/event-bus'
import { UserCreatedEvent } from '../events/user-created.event'

@Injectable()
export class UserCreatedObserver {
  @OnEvent(UserCreatedEvent)
  async handle(event: UserCreatedEvent) {
    console.log(`User created: ${event.user.email}`)
    // e.g., send a welcome email
  }
}
```

## Example: Internal vs Cross-App Events

This boilerplate now includes both event styles:

1. Internal event in `task`: `TaskCreatedEvent`
2. Cross-app integration event: `TaskCreatedIntegrationEvent`

`TaskService.create()` publishes both events:

```typescript
await this.eventBus.publish(new TaskCreatedEvent(task))
await this.eventBus.publish(new TaskCreatedIntegrationEvent(task))
```

The notifications app (`apps/notifications`) subscribes only to the integration event.

Run it with:

```bash
bun run --cwd apps/notifications start:dev
```

## Background Jobs

OneJs integrates **BullMQ** for handling long-running or delayed tasks.

### Defining a Worker
Use the `@WorkerJob` decorator to define a task handler.

```typescript
import { WorkerJob } from '@OneJs/jobs'

@Injectable()
export class EmailWorker {
  @WorkerJob('send-email')
  async process(data: { to: string, subject: string }) {
    // ... sending email logic ...
  }
}
```

### Queueing Jobs
Inject the `QueueService` to add jobs to the queue.

```typescript
import { QueueService } from '@OneJs/jobs'

@Injectable()
export class NotificationService {
  constructor(
    @Inject(QueueService) private readonly queue: QueueService
  ) {}

  async notify(email: string) {
    await this.queue.add('send-email', { to: email, subject: 'Hello!' })
  }
}
```

### Redis Requirement
BullMQ requires a **Redis** instance to manage the job queues. Ensure Redis is running in your environment (included in the default Docker setup).

