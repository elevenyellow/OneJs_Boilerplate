# User Management — Complete Example

This example demonstrates a complete bounded context implementation following all the conventions of this monorepo. It mirrors the actual code in `packages/user/`.

## Package Structure

```
packages/user/
├── domain/
│   ├── entities/
│   │   └── user.ts                        # Entity (EntityBase<UserId>)
│   ├── value-objects/
│   │   ├── user-id.ts                     # UserId VO
│   │   ├── email.ts                       # Email VO
│   │   ├── password-hash.ts               # PasswordHash VO
│   │   ├── user-role.ts                   # UserRole VO
│   │   └── reset-token.ts                 # ResetToken VO
│   ├── constants/
│   │   ├── error-types.ts                 # Error type label constants
│   │   ├── error-messages.ts              # Error message constants
│   │   └── log-scopes.ts                  # Logger scope constants
│   ├── repositories/
│   │   └── user.repository.interface.ts   # Port (interface)
│   └── events/
│       ├── user-registered.event.ts
│       ├── password-changed.event.ts
│       └── password-reset-requested.event.ts
├── application/
│   ├── user.service.ts                    # Application service
│   └── dtos/
│       └── user.dto.ts                    # Persistence DTO
└── infrastructure/
    ├── repositories/
    │   └── in-memory-user.repository.ts   # InMemory adapter
    └── controllers/
        └── auth.controller.ts
```

## Domain Layer

### Value Object: UserId

```typescript
// packages/user/domain/value-objects/user-id.ts
import { ValueObject, ValueObjectBase, OneJsError, ErrorCodes } from '@OneJs/core'
import { v4 as uuidv4 } from 'uuid'

@ValueObject()
export class UserId extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static generateUniqueId(): UserId {
    return new UserId(uuidv4())
  }

  static fromString(value: string): UserId {
    if (!value)
      throw new OneJsError('Validation failed', 400, 'Invalid UserId', {}, ErrorCodes.VALIDATION_FAILED)
    return new UserId(value)
  }
}
```

### Value Object: Email

```typescript
// packages/user/domain/value-objects/email.ts
import { ValueObject, ValueObjectBase, OneJsError, ErrorCodes } from '@OneJs/core'

@ValueObject()
export class Email extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Email {
    if (!value?.trim())
      throw new OneJsError('Validation failed', 400, 'Email is required', {}, ErrorCodes.VALIDATION_FAILED)
    const normalized = value.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      throw new OneJsError('Validation failed', 400, `Invalid email format: ${normalized}`, {}, ErrorCodes.VALIDATION_FAILED)
    return new Email(normalized)
  }
}
```

### Value Object: UserRole

```typescript
// packages/user/domain/value-objects/user-role.ts
import { ValueObject, ValueObjectBase, OneJsError, ErrorCodes } from '@OneJs/core'

const VALID_ROLES = ['user', 'admin'] as const

@ValueObject()
export class UserRole extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static user(): UserRole { return new UserRole('user') }
  static admin(): UserRole { return new UserRole('admin') }

  static create(value: string): UserRole {
    if (!VALID_ROLES.includes(value as any))
      throw new OneJsError('Validation failed', 400, `Invalid role: ${value}`, {}, ErrorCodes.VALIDATION_FAILED)
    return new UserRole(value)
  }
}
```

### Domain Constants (No Magic Strings)

```typescript
// packages/user/domain/constants/error-types.ts
export class UserErrorTypes {
  static readonly CONFLICT = 'Conflict'
  static readonly VALIDATION_FAILED = 'Validation failed'
  static readonly NOT_FOUND = 'Not Found'
  static readonly UNAUTHORIZED = 'Unauthorized'
  static readonly BAD_REQUEST = 'Bad Request'
}

// packages/user/domain/constants/error-messages.ts
export class UserErrorMessages {
  static readonly EMAIL_IN_USE = 'Email already in use'
  static readonly USER_NOT_FOUND = 'User not found'
  static readonly INVALID_EMAIL = 'Invalid email format'
  static readonly EMAIL_REQUIRED = 'Email is required'
}

// packages/user/domain/constants/log-scopes.ts
export class UserLogScopes {
  static readonly SERVICE = 'user:service'
  static readonly CONTROLLER = 'user:controller'
  static readonly REPOSITORY = 'user:repository'
}
```

### Entity: User

```typescript
// packages/user/domain/entities/user.ts
import { Entity, EntityBase } from '@OneJs/core'
import { UserDto } from '../../application/dtos/user.dto'
import { Email } from '../value-objects/email'
import { PasswordHash } from '../value-objects/password-hash'
import { ResetToken } from '../value-objects/reset-token'
import { UserId } from '../value-objects/user-id'
import { UserRole } from '../value-objects/user-role'

@Entity()
export class User extends EntityBase<UserId> {
  constructor(
    id: UserId,
    readonly email: Email,
    readonly passwordHash: PasswordHash,
    readonly role: UserRole,
    readonly createdAt: Date,
    readonly resetToken: ResetToken | null,
  ) {
    super(id)
  }

  // Create a new user — accepts VOs
  static register(email: Email, passwordHash: PasswordHash): User {
    return new User(
      UserId.generateUniqueId(),
      email,
      passwordHash,
      UserRole.user(),
      new Date(),
      null,
    )
  }

  // Reconstitute from persistence — primitives allowed here ONLY
  static reconstitute(
    id: string,
    email: string,
    passwordHash: string,
    role: string,
    createdAt: Date,
    resetToken: string | null,
  ): User {
    return new User(
      UserId.fromString(id),
      Email.create(email),
      PasswordHash.create(passwordHash),
      UserRole.create(role),
      createdAt,
      resetToken ? ResetToken.create(resetToken) : null,
    )
  }

  // Immutable transitions — accept VOs, return new instance
  withPasswordHash(hash: PasswordHash): User {
    return new User(this.getId(), this.email, hash, this.role, this.createdAt, null)
  }

  withResetToken(token: ResetToken | null): User {
    return new User(this.getId(), this.email, this.passwordHash, this.role, this.createdAt, token)
  }

  // Required by @Entity() — serialize to persistence
  toDto(): UserDto {
    return new UserDto(
      this.getId().getValue(),
      this.email.getValue(),
      this.role.getValue(),
      this.createdAt,
    )
  }
}
```

### Repository Interface (Port)

```typescript
// packages/user/domain/repositories/user.repository.interface.ts
import type { User } from '../entities/user'
import type { Email } from '../value-objects/email'
import type { ResetToken } from '../value-objects/reset-token'
import type { UserId } from '../value-objects/user-id'

export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  findByResetToken(token: ResetToken): Promise<User | null>
  save(user: User): Promise<void>
  delete(id: UserId): Promise<void>
}
```

### Domain Events

```typescript
// packages/user/domain/events/user-registered.event.ts
import type { User } from '../entities/user'

export class UserRegisteredEvent {
  constructor(public readonly user: User) {}
}
```

## Application Layer

### DTO

```typescript
// packages/user/application/dtos/user.dto.ts
export class UserDto {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly role: string,
    readonly createdAt: Date,
  ) {}
}
```

### Application Service

```typescript
// packages/user/application/user.service.ts
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { User } from '../domain/entities/user'
import { Email } from '../domain/value-objects/email'
import { PasswordHash } from '../domain/value-objects/password-hash'
import { ResetToken } from '../domain/value-objects/reset-token'
import { UserId } from '../domain/value-objects/user-id'
import { PasswordChangedEvent } from '../domain/events/password-changed.event'
import { UserRegisteredEvent } from '../domain/events/user-registered.event'
import type { IUserRepository } from '../domain/repositories/user.repository.interface'
import { InMemoryUserRepository } from '../infrastructure/repositories/in-memory-user.repository'

@Injectable()
export class UserService {
  constructor(
    @Inject(InMemoryUserRepository) private readonly repository: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async register(email: Email, passwordHash: PasswordHash): Promise<User> {
    const existing = await this.repository.findByEmail(email)
    if (existing)
      throw new OneJsError('Conflict', 409, 'Email already in use', {}, ErrorCodes.USER_ALREADY_EXISTS)

    const user = User.register(email, passwordHash)
    await this.repository.save(user)
    await this.eventBus.publish(new UserRegisteredEvent(user))

    this.logger.debug('user:service', `Registered: ${user.getId().getValue()}`)
    return user
  }

  async findById(id: UserId): Promise<User | null> {
    return this.repository.findById(id)
  }

  async updatePassword(id: UserId, currentPasswordHash: PasswordHash, newPasswordHash: PasswordHash): Promise<void> {
    const user = await this.repository.findById(id)
    if (!user)
      throw new OneJsError('Not Found', 404, 'User not found', {}, ErrorCodes.USER_NOT_FOUND)

    const updated = user.withPasswordHash(newPasswordHash)
    await this.repository.save(updated)
    await this.eventBus.publish(new PasswordChangedEvent(updated))

    this.logger.debug('user:service', `Password updated: ${id.getValue()}`)
  }
}
```

## Infrastructure Layer

### InMemory Repository Adapter

```typescript
// packages/user/infrastructure/repositories/in-memory-user.repository.ts
import { Injectable } from '@OneJs/core'
import { User } from '../../domain/entities/user'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface'
import type { Email } from '../../domain/value-objects/email'
import type { ResetToken } from '../../domain/value-objects/reset-token'
import type { UserId } from '../../domain/value-objects/user-id'

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>()

  async findAll(): Promise<User[]> {
    return Array.from(this.store.values())
  }

  async findById(id: UserId): Promise<User | null> {
    return this.store.get(id.getValue()) ?? null
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.store.values())
      if (user.email.getValue() === email.getValue()) return user
    return null
  }

  async findByResetToken(token: ResetToken): Promise<User | null> {
    for (const user of this.store.values())
      if (user.resetToken?.getValue() === token.getValue()) return user
    return null
  }

  async save(user: User): Promise<void> {
    this.store.set(user.getId().getValue(), user)
  }

  async delete(id: UserId): Promise<void> {
    this.store.delete(id.getValue())
  }
}
```

## Tests

### Value Object Unit Test

```typescript
// packages/user/tests/unit/domain/email.test.ts
import { describe, it, expect } from 'bun:test'
import { Email } from '../../../domain/value-objects/email'

describe('Email', () => {
  it('should create valid email', () => {
    const email = Email.create('User@Example.com')
    expect(email.getValue()).toBe('user@example.com')
  })

  it('should normalize to lowercase', () => {
    expect(Email.create('USER@EXAMPLE.COM').getValue()).toBe('user@example.com')
  })

  it('should throw on invalid format', () => {
    expect(() => Email.create('not-an-email')).toThrow()
  })

  it('should throw on empty value', () => {
    expect(() => Email.create('')).toThrow()
  })
})
```

### Entity Unit Test

```typescript
// packages/user/tests/unit/domain/user.test.ts
import { describe, it, expect } from 'bun:test'
import { User } from '../../../domain/entities/user'
import { Email } from '../../../domain/value-objects/email'
import { PasswordHash } from '../../../domain/value-objects/password-hash'

describe('User', () => {
  const email = Email.create('user@example.com')
  const hash = PasswordHash.create('hashed_password')

  it('should register with user role by default', () => {
    const user = User.register(email, hash)
    expect(user.role.getValue()).toBe('user')
    expect(user.resetToken).toBeNull()
  })

  it('should return new instance on withPasswordHash', () => {
    const user = User.register(email, hash)
    const newHash = PasswordHash.create('new_hash')
    const updated = user.withPasswordHash(newHash)

    expect(updated).not.toBe(user)  // new instance
    expect(updated.passwordHash.getValue()).toBe('new_hash')
    expect(user.passwordHash.getValue()).toBe('hashed_password')  // immutable
  })

  it('should produce DTO with primitive values', () => {
    const user = User.register(email, hash)
    const dto = user.toDto()

    expect(typeof dto.id).toBe('string')
    expect(dto.email).toBe('user@example.com')
    expect(dto.role).toBe('user')
  })
})
```

### Application Service Test (with InMemory fakes — no mocks)

```typescript
// packages/user/tests/unit/application/user.service.test.ts
import { describe, beforeEach, it, expect } from 'bun:test'
import { InMemoryEventBus } from '@OneJs/event-bus'
import { SilentLogger } from '@OneJs/core'
import { UserService } from '../../../application/user.service'
import { InMemoryUserRepository } from '../../../infrastructure/repositories/in-memory-user.repository'
import { Email } from '../../../domain/value-objects/email'
import { PasswordHash } from '../../../domain/value-objects/password-hash'

describe('The UserService', () => {
  let service: UserService
  let repository: InMemoryUserRepository
  let eventBus: InMemoryEventBus
  let logger: SilentLogger

  beforeEach(() => {
    repository = new InMemoryUserRepository()
    eventBus = new InMemoryEventBus()
    logger = new SilentLogger()
    service = new UserService(repository, eventBus, logger)
  })

  describe('register', () => {
    it('creates a user successfully', async () => {
      const email = Email.create('user@example.com')
      const hash = PasswordHash.create('hashed_pw')

      const user = await service.register(email, hash)

      expect(user.email.getValue()).toBe('user@example.com')
      expect(await repository.findByEmail(email)).not.toBeNull()
    })

    it('rejects a duplicate email', async () => {
      const email = Email.create('user@example.com')
      const hash = PasswordHash.create('hashed_pw')
      await service.register(email, hash)

      await expect(service.register(email, hash)).rejects.toThrow('Email already in use')
    })
  })
})
```

### Repository Test

```typescript
// packages/user/tests/unit/infrastructure/in-memory-user.repository.test.ts
import { describe, beforeEach, it, expect } from 'bun:test'
import { InMemoryUserRepository } from '../../../infrastructure/repositories/in-memory-user.repository'
import { User } from '../../../domain/entities/user'
import { Email } from '../../../domain/value-objects/email'
import { PasswordHash } from '../../../domain/value-objects/password-hash'
import { UserId } from '../../../domain/value-objects/user-id'

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository

  beforeEach(() => {
    repository = new InMemoryUserRepository()
  })

  it('should return null when user not found', async () => {
    const result = await repository.findById(UserId.generateUniqueId())
    expect(result).toBeNull()
  })

  it('should find user after save', async () => {
    const email = Email.create('test@example.com')
    const user = User.register(email, PasswordHash.create('hash'))
    await repository.save(user)

    const found = await repository.findByEmail(email)
    expect(found).not.toBeNull()
    expect(found!.email.getValue()).toBe('test@example.com')
  })

  it('should overwrite on repeated save (upsert)', async () => {
    const email = Email.create('test@example.com')
    const user = User.register(email, PasswordHash.create('hash1'))
    await repository.save(user)

    const updated = user.withPasswordHash(PasswordHash.create('hash2'))
    await repository.save(updated)

    const all = await repository.findAll()
    expect(all).toHaveLength(1)
    expect(all[0].passwordHash.getValue()).toBe('hash2')
  })
})
```
