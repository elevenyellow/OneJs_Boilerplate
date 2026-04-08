# @OneJs/event-bus

Event bus system for OneJs framework with domain event support.

## Installation

```bash
npm install @OneJs/event-bus
```

## Features

- **Domain Events**: Type-safe domain event system
- **Event Handlers**: Decorator-based event handling
- **Middleware Support**: Event processing middleware
- **In-Memory Publisher**: Default in-memory event publishing

## Usage

### Basic Setup

```typescript
import { OneJs, PluginRegistry } from '@OneJs/core'
import { EventBusPlugin } from '@OneJs/event-bus'

PluginRegistry.register(new EventBusPlugin())

const oneJs = new OneJs(import.meta.url)
await oneJs.start()
```

### Creating Domain Events

```typescript
import { DomainEvent } from '@OneJs/event-bus'

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly user: User,
    public readonly occurredOn: Date = new Date()
  ) {
    super(occurredOn)
  }
}
```

### Creating Event Handlers

```typescript
import { Injectable, Inject } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'

@Injectable()
export class UserCreatedHandler {
  constructor(@Inject(EmailService) private emailService: EmailService) {}

  @EventHandler(UserCreatedEvent)
  async handle(event: UserCreatedEvent): Promise<void> {
    await this.emailService.sendWelcomeEmail(event.user.email)
  }
}
```

### Publishing Events

```typescript
import { Injectable, Inject } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'

@Injectable()
export class UserService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(userData)
    
    // Publish domain event
    await this.eventBus.publish(new UserCreatedEvent(user))
    
    return user
  }
}
```

## Event Bus Plugin

The `EventBusPlugin` automatically:
- Registers `EventBus` and `InMemoryEventPublisher` services
- Discovers and registers all `@EventHandler` decorated methods
- Sets up event subscriptions

## Middleware

You can add middleware to the event bus for cross-cutting concerns:

```typescript
import { EventBusMiddlewareInterface } from '@OneJs/event-bus'

class LoggingMiddleware implements EventBusMiddlewareInterface {
  async handle(event: DomainEvent, next: () => Promise<void>): Promise<void> {
    console.log(`Processing event: ${event.constructor.name}`)
    await next()
  }
}
```
