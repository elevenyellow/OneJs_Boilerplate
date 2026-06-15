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
Application services represent complete use cases and orchestrate domain objects.

**Location:** `packages/[context]/application/`
**Purpose:** Use case orchestration, external integrations, event publishing
**Dependencies:** Domain services, repositories, EventBus, Logger

## Standard Service Structure

### Template Pattern

```typescript
// user-creator.service.ts
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { InMemoryUserRepository } from '../../infrastructure/repositories/in-memory-user.repository'
import type { Email } from '../../domain/value-objects/email'
import type { PasswordHash } from '../../domain/value-objects/password-hash'

@Injectable()
export class UserCreator {
  constructor(
    @Inject(InMemoryUserRepository)
    private readonly userRepository: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async run(email: Email, passwordHash: PasswordHash): Promise<User> {
    this.logger.debug('user-creator', `Creating user: ${email.getValue()}`)

    const existing = await this.userRepository.findByEmail(email)
    if (existing)
      throw new OneJsError('Conflict', 409, 'Email already in use', {}, ErrorCodes.USER_ALREADY_EXISTS)

    const user = User.register(email, passwordHash)
    await this.userRepository.save(user)
    await this.eventBus.publish(new UserRegisteredEvent(user))

    this.logger.debug('user-creator', `User created: ${user.getId().getValue()}`)
    return user
  }
}
```

## Key Patterns

### 1. Single Entry Point: `run()` Method

Every service exposes a public `run()` method as the main entry point:

```typescript
✅ Correct
class UserCreator {
  async run(email: Email, passwordHash: PasswordHash): Promise<User> { }
}

class UserFinder {
  async run(id: UserId): Promise<User> { }
}

❌ Wrong
class UserCreator {
  async create(email: string, password: string): Promise<User> { }
  async execute(input: any): Promise<User> { }
}
```

### 2. No Primitive Parameters

Service `run()` methods **never accept primitive types** (`string`, `number`, `boolean`) as parameters. Always use value objects, entities, or aggregates:

```typescript
✅ Correct — VOs and entities as params
class UserCreator {
  async run(email: Email, passwordHash: PasswordHash): Promise<User> { }
}

class UserFinder {
  async run(id: UserId): Promise<User | null> { }
}

class OrderProcessor {
  async run(order: Order, customer: Customer): Promise<OrderResult> { }
}

❌ Wrong — primitives as params
class UserCreator {
  async run(email: string, password: string): Promise<User> { }
}

class UserFinder {
  async run(id: string): Promise<User | null> { }
}
```

The VO is created and validated at the **system boundary** (controller / API handler), not inside the service.

> **Authoritative reference**: The [No Primitives Rule](../architecture/ddd-principles.md#no-primitives-rule) in `ddd-principles.md` is the canonical source for this rule across the codebase.

### 3. Constructor-Based Dependency Injection

Use `@Injectable()` on the class and `@Inject(Token)` on constructor params:

```typescript
✅ Correct
@Injectable()
export class UserCreator {
  constructor(
    @Inject(InMemoryUserRepository)
    private readonly userRepository: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}
}

❌ Wrong — setter injection
export class UserCreator {
  private userRepository: IUserRepository
  setRepository(repo: IUserRepository) { this.userRepository = repo }
}
```

Always inject against the **interface** (port), bind to the **implementation** (adapter) via the `@Inject(ConcreteClass)` token.

### 4. Structured Execution Flow

```typescript
async run(param: SomeVO): Promise<Result> {
  // 1. Log entry
  this.logger.debug('service-name', `Starting: ${param.getValue()}`)

  // 2. Load/validate domain objects
  const entity = await this.repository.findById(id)
  if (!entity) throw new OneJsError('Not Found', 404, '...', {}, ErrorCodes.NOT_FOUND)

  // 3. Business logic (delegates to entities/domain services)
  const updated = entity.performAction()

  // 4. Persist
  await this.repository.save(updated)

  // 5. Publish domain events
  await this.eventBus.publish(new SomethingHappenedEvent(updated))

  // 6. Log completion
  this.logger.debug('service-name', `Done: ${updated.getId().getValue()}`)
  return updated
}
```

### 5. Private Method Organization

Break down complex logic into well-named private methods:

```typescript
@Injectable()
export class PasswordResetter {
  constructor(
    @Inject(InMemoryUserRepository) private readonly repo: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async run(token: ResetToken, newPasswordHash: PasswordHash): Promise<void> {
    const user = await this.findUserByToken(token)
    const updated = this.applyNewPassword(user, newPasswordHash)
    await this.persist(updated)
  }

  private async findUserByToken(token: ResetToken): Promise<User> {
    const user = await this.repo.findByResetToken(token)
    if (!user)
      throw new OneJsError('Bad Request', 400, 'Invalid or expired token', {}, ErrorCodes.AUTH_INVALID)
    return user
  }

  private applyNewPassword(user: User, hash: PasswordHash): User {
    return user.withPasswordHash(hash)
  }

  private async persist(user: User): Promise<void> {
    await this.repo.save(user)
    await this.eventBus.publish(new PasswordChangedEvent(user))
    this.logger.debug('password-resetter', `Password reset for ${user.getId().getValue()}`)
  }
}
```

## Service Examples

### Domain Service Example

```typescript
// packages/user/domain/services/user-validator.service.ts
import { Injectable, Inject, Logger } from '@OneJs/core'
import type { User } from '../entities/user'

@Injectable()
export class UserValidator {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  run(user: User): ValidationResult {
    this.logger.debug('user-validator', `Validating: ${user.getId().getValue()}`)

    const errors: string[] = []

    if (!this.hasValidEmail(user)) errors.push('INVALID_EMAIL')
    if (!this.hasValidRole(user)) errors.push('INVALID_ROLE')

    return { isValid: errors.length === 0, errors }
  }

  private hasValidEmail(user: User): boolean {
    return user.email !== null
  }

  private hasValidRole(user: User): boolean {
    return user.role !== null
  }
}
```

### Application Service Example

```typescript
// packages/user/application/user-creator.service.ts
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import type { IUserRepository } from '../domain/repositories/user.repository.interface'
import { InMemoryUserRepository } from '../infrastructure/repositories/in-memory-user.repository'
import { User } from '../domain/entities/user'
import { UserRegisteredEvent } from '../domain/events/user-registered.event'
import type { Email } from '../domain/value-objects/email'
import type { PasswordHash } from '../domain/value-objects/password-hash'

@Injectable()
export class UserCreator {
  constructor(
    @Inject(InMemoryUserRepository) private readonly repository: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async run(email: Email, passwordHash: PasswordHash): Promise<User> {
    this.logger.debug('user-creator', `Registering: ${email.getValue()}`)

    const existing = await this.repository.findByEmail(email)
    if (existing)
      throw new OneJsError('Conflict', 409, 'Email already in use', {}, ErrorCodes.USER_ALREADY_EXISTS)

    const user = User.register(email, passwordHash)
    await this.repository.save(user)
    await this.eventBus.publish(new UserRegisteredEvent(user))

    this.logger.debug('user-creator', `Registered: ${user.getId().getValue()}`)
    return user
  }
}
```

## Error Handling

Services use `OneJsError` from `@OneJs/core`:

```typescript
import { OneJsError, ErrorCodes } from '@OneJs/core'

// Validation
throw new OneJsError('Validation failed', 400, 'Password too short', {}, ErrorCodes.VALIDATION_FAILED)

// Not found
throw new OneJsError('Not Found', 404, `User not found`, {}, ErrorCodes.USER_NOT_FOUND)

// Conflict
throw new OneJsError('Conflict', 409, 'Email already in use', {}, ErrorCodes.USER_ALREADY_EXISTS)

// Unauthorized
throw new OneJsError('Unauthorized', 401, 'Invalid credentials', {}, ErrorCodes.AUTH_INVALID)
```

`OneJsError` signature: `new OneJsError(type, statusCode, message, details, errorCode)`

## Testing Patterns

Use **InMemory fakes** — never mocks or stubs. InMemory repositories live in `infrastructure/` next to production adapters. For EventBus and Logger, use the framework's `InMemoryEventBus` and `SilentLogger`.

```typescript
// user-creator.service.test.ts
import { describe, beforeEach, it, expect } from 'bun:test'
import { InMemoryEventBus } from '@OneJs/event-bus'
import { SilentLogger } from '@OneJs/core'
import { UserCreator } from './user-creator.service'
import { InMemoryUserRepository } from '../infrastructure/repositories/in-memory-user.repository'
import { Email } from '../domain/value-objects/email'
import { PasswordHash } from '../domain/value-objects/password-hash'

describe('The UserCreator', () => {
  let service: UserCreator
  let repository: InMemoryUserRepository
  let eventBus: InMemoryEventBus
  let logger: SilentLogger

  beforeEach(() => {
    repository = new InMemoryUserRepository()
    eventBus = new InMemoryEventBus()
    logger = new SilentLogger()
    service = new UserCreator(repository, eventBus, logger)
  })

  describe('run', () => {
    it('creates a user with valid email', async () => {
      const email = Email.create('user@example.com')
      const hash = PasswordHash.create('hashed_pw')

      const user = await service.run(email, hash)

      expect(user.email.getValue()).toBe('user@example.com')
      expect(await repository.findByEmail(email)).not.toBeNull()
    })

    it('rejects a duplicate email', async () => {
      const email = Email.create('user@example.com')
      const hash = PasswordHash.create('hashed_pw')
      await service.run(email, hash)

      expect(service.run(email, hash)).rejects.toThrow('Email already in use')
    })
  })
})
```

## Best Practices

1. **Single Responsibility**: Each service has one clear use case
2. **`run()` entry point**: Always the public interface
3. **No primitives in `run()`**: Accept VOs, entities, or aggregates only
4. **Constructor injection**: `@Injectable()` + `@Inject(Token)` for all dependencies
5. **Inject interface, bind implementation**: `@Inject(InMemoryRepo) readonly repo: IRepo`
6. **`OneJsError`**: Use for all domain errors with appropriate `ErrorCodes`
7. **InMemory fakes in tests**: Never mock repositories — use the InMemory adapter
8. **Immutability**: Entities are immutable; use `with*()` to transition state
