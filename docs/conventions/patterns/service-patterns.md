# Service Patterns

This document outlines the service patterns used in the monorepo, following Domain-Driven Design principles on top of the **OneJs framework**.

## Framework Imports

```typescript
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
```

## Service Types

### Domain Services
Domain services represent domain concepts and operations that don't belong to a specific entity.

**Location:** `packages/[context]/domain/services/`
**Purpose:** Pure business logic and domain rules
**Dependencies:** Only domain objects (entities, value objects, other domain services)

### Application Services
Application services represent a bounded context's use cases and orchestrate domain objects.

**Location:** `packages/[context]/application/`
**Purpose:** Use case orchestration, external integrations, event publishing
**Dependencies:** Domain services, repositories, EventBus, Logger

## Standard Service Structure

**One application service per bounded context**, named `[Context]Service` (e.g. `UserService`, `TaskService`). The service exposes **one public method per use case**, named after the operation (`register`, `login`, `create`, `complete`, …). There is no single `run()` entry point, no `UseCase` suffix, and no one-class-per-use-case.

### Template Pattern

```typescript
// user.service.ts
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { UserErrorTypes, UserErrorMessages, UserLogScopes } from '../domain/constants'
import type { IUserRepository } from '../domain/repositories/user.repository.interface'
import { InMemoryUserRepository } from '../infrastructure/repositories/in-memory-user.repository'
import { User } from '../domain/entities/user'
import { UserRegisteredEvent } from '../domain/events/user-registered.event'
import type { Email } from '../domain/value-objects/email'
import { PasswordHash } from '../domain/value-objects/password-hash'

@Injectable()
export class UserService {
  constructor(
    @Inject(InMemoryUserRepository)
    private readonly repository: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  // One public method per use case
  async register(email: Email, password: string): Promise<User> {
    const existing = await this.repository.findByEmail(email)
    if (existing)
      throw new OneJsError(UserErrorTypes.CONFLICT, 409, UserErrorMessages.EMAIL_IN_USE, {}, ErrorCodes.USER_ALREADY_EXISTS)

    const hash = await Bun.password.hash(password)
    const user = User.register(email, PasswordHash.create(hash))

    await this.repository.save(user)
    await this.eventBus.publish(new UserRegisteredEvent(user))

    this.logger.debug(UserLogScopes.SERVICE, `User registered: ${user.getId().getValue()}`)
    return user
  }

  async getById(userId: UserId): Promise<User | null> {
    return this.repository.findById(userId)
  }
}
```

## Key Patterns

### 1. One service per context, use-case methods

Each bounded context has a single application service; each use case is a public method named after the operation:

```typescript
✅ Correct
class UserService {
  async register(email: Email, password: string): Promise<User> { }
  async login(email: Email, password: string): Promise<{ token: string; user: User }> { }
  async getById(id: UserId): Promise<User | null> { }
}

class TaskService {
  async create(title: TaskTitle, description: TaskDescription): Promise<Task> { }
  async complete(id: TaskId): Promise<Task> { }
  async delete(id: TaskId): Promise<void> { }
}

❌ Wrong — one class per use case with a generic entry point
class UserCreator {
  async run(email: Email, hash: PasswordHash): Promise<User> { }
}
class UserCreator {
  async execute(input: any): Promise<User> { }   // also wrong: `execute`, `any`
}
```

### 2. No Primitive Parameters

Service methods **never accept primitive types** (`string`, `number`, `boolean`) as parameters. Always use value objects, entities, or aggregates:

```typescript
✅ Correct — VOs and entities as params
class UserService {
  async getById(id: UserId): Promise<User | null> { }
}

class TaskService {
  async complete(id: TaskId): Promise<Task> { }
}

❌ Wrong — primitives as params
class TaskService {
  async complete(id: string): Promise<Task> { }
}
```

The VO is created and validated at the **system boundary** (controller / API handler), not inside the service.

**The one exception is a raw plaintext password** (a transient credential — there is no `Password` VO). It stays a `string` from the controller into the service, where it is hashed (→ `PasswordHash`) or verified, then discarded.

> **Authoritative reference**: The [No Primitives Rule](../architecture/ddd-principles.md#no-primitives-rule) in `ddd-principles.md` is the canonical source for this rule across the codebase.

### 3. Constructor-Based Dependency Injection

Use `@Injectable()` on the class and `@Inject(Token)` on constructor params:

```typescript
✅ Correct
@Injectable()
export class UserService {
  constructor(
    @Inject(InMemoryUserRepository)
    private readonly repository: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}
}

❌ Wrong — setter injection
export class UserService {
  private repository: IUserRepository
  setRepository(repo: IUserRepository) { this.repository = repo }
}
```

Always inject against the **interface** (port), bind to the **implementation** (adapter) via the `@Inject(ConcreteClass)` token.

### 4. Structured Execution Flow

*(Imports omitted for brevity — all error type labels, messages, and log scopes are named constants per context.)*

```typescript
async complete(id: TaskId): Promise<Task> {
  // 1. Load/validate domain objects
  const task = await this.repository.findById(id)
  if (!task) throw new OneJsError(TaskErrorTypes.NOT_FOUND, 404, TaskErrorMessages.NOT_FOUND, {}, ErrorCodes.RESOURCE_NOT_FOUND)

  // 2. Business logic (delegates to entities/domain services)
  const completed = task.complete()

  // 3. Persist
  await this.repository.save(completed)

  // 4. Publish domain events
  await this.eventBus.publish(new TaskCompletedIntegrationEvent(completed))

  // 5. Log completion
  this.logger.debug(TaskLogScopes.SERVICE, `Task completed: ${completed.getId().getValue()}`)
  return completed
}
```

### 5. Private Method Organization

Break down complex use-case methods into well-named private helpers:

```typescript
import { UserErrorTypes, UserErrorMessages, UserLogScopes } from '../domain/constants'

@Injectable()
export class UserService {
  constructor(
    @Inject(InMemoryUserRepository) private readonly repo: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async resetPassword(token: ResetToken, newPassword: string): Promise<void> {
    const user = await this.findUserByToken(token)
    const hash = await Bun.password.hash(newPassword)
    await this.persist(user.withPasswordHash(PasswordHash.create(hash)))
  }

  private async findUserByToken(token: ResetToken): Promise<User> {
    const user = await this.repo.findByResetToken(token)
    if (!user)
      throw new OneJsError(UserErrorTypes.BAD_REQUEST, 400, UserErrorMessages.INVALID_OR_EXPIRED_TOKEN, {}, ErrorCodes.AUTH_INVALID)
    return user
  }

  private async persist(user: User): Promise<void> {
    await this.repo.save(user)
    await this.eventBus.publish(new PasswordChangedEvent(user))
    this.logger.debug(UserLogScopes.SERVICE, `Password reset for ${user.getId().getValue()}`)
  }
}
```

## Service Examples

### Domain Service Example

```typescript
// packages/user/domain/services/user-validator.service.ts
import { Injectable, Inject, Logger } from '@OneJs/core'
import { UserLogScopes } from '../constants/log-scopes'
import type { User } from '../entities/user'

@Injectable()
export class UserValidator {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  validate(user: User): ValidationResult {
    this.logger.debug(UserLogScopes.SERVICE, `Validating: ${user.getId().getValue()}`)

    const errors: string[] = []

    if (!this.hasValidEmail(user)) errors.push('INVALID_EMAIL')
    if (!this.hasValidRole(user)) errors.push('INVALID_ROLE')

    return { isValid: errors.length === 0, errors }
  }

  private hasValidEmail(user: User): boolean {
    return user.getEmail() !== null
  }

  private hasValidRole(user: User): boolean {
    return user.getRole() !== null
  }
}
```

### Application Service Example

```typescript
// packages/task/application/task.service.ts
import { ErrorCodes, Inject, Injectable, Logger, OneJsError } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { TaskCompletedIntegrationEvent } from '@shared/events'
import { Task } from '../domain/entities/task'
import type { ITaskRepository } from '../domain/repositories/task.repository.interface'
import { InMemoryTaskRepository } from '../infrastructure/repositories/in-memory-task.repository'
import type { TaskDescription } from '../domain/value-objects/task-description'
import type { TaskId } from '../domain/value-objects/task-id'
import type { TaskTitle } from '../domain/value-objects/task-title'

@Injectable()
export class TaskService {
  constructor(
    @Inject(InMemoryTaskRepository) private readonly repository: ITaskRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async create(title: TaskTitle, description: TaskDescription): Promise<Task> {
    const task = Task.create(title, description)
    await this.repository.save(task)
    this.logger.debug('task:service', `Task created: ${task.getId().getValue()}`)
    return task
  }

  async complete(id: TaskId): Promise<Task> {
    const task = await this.repository.findById(id)
    if (!task)
      throw new OneJsError('Not Found', 404, `Task not found: ${id.getValue()}`, {}, ErrorCodes.RESOURCE_NOT_FOUND)

    const completed = task.complete()
    await this.repository.save(completed)
    await this.eventBus.publish(new TaskCompletedIntegrationEvent(completed))
    return completed
  }
}
```

## Error Handling

Services use `OneJsError` from `@OneJs/core` with named constants:

```typescript
import { OneJsError, ErrorCodes } from '@OneJs/core'
import { UserErrorTypes, UserErrorMessages } from '../domain/constants/error-types'

// Validation
throw new OneJsError(UserErrorTypes.VALIDATION_FAILED, 400, UserErrorMessages.PASSWORD_TOO_SHORT, {}, ErrorCodes.VALIDATION_FAILED)

// Not found
throw new OneJsError(UserErrorTypes.NOT_FOUND, 404, UserErrorMessages.USER_NOT_FOUND, {}, ErrorCodes.USER_NOT_FOUND)

// Conflict
throw new OneJsError(UserErrorTypes.CONFLICT, 409, UserErrorMessages.EMAIL_IN_USE, {}, ErrorCodes.USER_ALREADY_EXISTS)

// Unauthorized
throw new OneJsError(UserErrorTypes.UNAUTHORIZED, 401, UserErrorMessages.INVALID_CREDENTIALS, {}, ErrorCodes.AUTH_INVALID)
```

`OneJsError` signature: `new OneJsError(type, statusCode, message, details, errorCode)`

> **No magic strings**: Every error type label and message MUST be a named constant per bounded context. See [ddd-principles.md — No Magic Strings](../architecture/ddd-principles.md#no-magic-strings) for the canonical rule.

## Testing Patterns

Use **InMemory fakes** — never mocks or stubs. InMemory repositories live in `infrastructure/` next to production adapters. For EventBus and Logger, use the framework's `InMemoryEventBus` and `SilentLogger`.

```typescript
// user.service.test.ts
import { describe, beforeEach, it, expect } from 'bun:test'
import { InMemoryEventBus } from '@OneJs/event-bus'
import { SilentLogger } from '@OneJs/core'
import { UserService } from './user.service'
import { InMemoryUserRepository } from '../infrastructure/repositories/in-memory-user.repository'
import { Email } from '../domain/value-objects/email'

describe('The UserService', () => {
  let service: UserService
  let repository: InMemoryUserRepository
  let eventBus: InMemoryEventBus
  let logger: SilentLogger

  beforeEach(() => {
    repository = new InMemoryUserRepository()
    eventBus = new InMemoryEventBus()
    logger = new SilentLogger()
    service = new UserService(repository, eventBus, configService, logger)
  })

  describe('register', () => {
    it('creates a user with valid email', async () => {
      const email = Email.create('user@example.com')

      const user = await service.register(email, 'password123')

      expect(user.getEmail().getValue()).toBe('user@example.com')
      expect(await repository.findByEmail(email)).not.toBeNull()
    })

    it('rejects a duplicate email', async () => {
      const email = Email.create('user@example.com')
      await service.register(email, 'password123')

      await expect(service.register(email, 'password123')).rejects.toThrow(UserErrorMessages.EMAIL_IN_USE)
    })
  })
})
```

## Best Practices

1. **One service per bounded context**: `UserService`, `TaskService` — not one class per use case
2. **Use-case methods**: one public method per operation, named after it (`register`, `complete`, …); no `run()`, no `UseCase` suffix
3. **No primitives as params**: accept VOs, entities, or aggregates only (raw passwords are the sole exception)
4. **Constructor injection**: `@Injectable()` + `@Inject(Token)` for all dependencies
5. **Inject interface, bind implementation**: `@Inject(InMemoryRepo) readonly repo: IRepo`
6. **`OneJsError`**: Use for all domain errors with appropriate `ErrorCodes`
7. **InMemory fakes in tests**: Never mock repositories — use the InMemory adapter
8. **Immutability**: Entities are immutable; use `with*()` to transition state
