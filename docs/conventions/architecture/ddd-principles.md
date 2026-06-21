# DDD Principles in Practice

This document explains how Domain-Driven Design principles are applied throughout the monorepo using the **OneJs framework**.

## Framework Decorators

All domain objects use decorators from `@OneJs/core`:

```typescript
import {
  Entity, EntityBase,
  ValueObject, ValueObjectBase,
  Injectable, Inject,
  Logger, OneJsError, ErrorCodes,
} from '@OneJs/core'
```

## Bounded Contexts

Each package represents a **Bounded Context** with a clear domain boundary.

```
packages/
├── user/        # User Management Context
├── task/        # Task Management Context
└── shared/      # Shared Kernel (integration events)
```

## Value Objects

**Value Objects** encapsulate a concept and its validation. They are immutable and identified by value, not identity.

### Pattern

```typescript
import { ValueObject, ValueObjectBase, OneJsError, ErrorCodes } from '@OneJs/core'
import { UserErrorTypes, UserErrorMessages } from '../constants/error-types'

@ValueObject()
export class Email extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Email {
    if (!value?.trim())
      throw new OneJsError(UserErrorTypes.VALIDATION_FAILED, 400, UserErrorMessages.EMAIL_REQUIRED, {}, ErrorCodes.VALIDATION_FAILED)
    const normalized = value.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      throw new OneJsError(UserErrorTypes.VALIDATION_FAILED, 400, UserErrorMessages.INVALID_EMAIL_FORMAT, {}, ErrorCodes.VALIDATION_FAILED)
    return new Email(normalized)
  }
}
```

### Key Rules

- Extend `ValueObjectBase<T>` (from `@OneJs/core`)
- Decorate with `@ValueObject()`
- **Private constructor** — instantiation only via the static `create()` factory
- `create()` validates and normalizes; throws `OneJsError` on failure
- Inherited methods: `getValue()`, `equals()`, `toString()`, `toJSON()`
- Immutable: all properties are readonly

### Accessing the Value

```typescript
const email = Email.create('User@Example.com')
email.getValue()    // → 'user@example.com'
email.toString()    // → 'user@example.com'
email.equals(Email.create('user@example.com'))  // → true
```

### Common VOs

```typescript
import { UserErrorTypes } from '../constants/error-types'

// ID with auto-generation
@ValueObject()
export class UserId extends ValueObjectBase<string> {
  private constructor(value: string) { super(value) }

  static generateUniqueId(): UserId {
    return new UserId(uuidv4())
  }

  static fromString(value: string): UserId {
    if (!value) throw new OneJsError(UserErrorTypes.VALIDATION_FAILED, 400, UserErrorMessages.INVALID_USER_ID, {}, ErrorCodes.VALIDATION_FAILED)
    return new UserId(value)
  }
}

// Enum-like VO with predefined values
@ValueObject()
export class UserRole extends ValueObjectBase<string> {
  private constructor(value: string) { super(value) }

  static user(): UserRole { return new UserRole('user') }
  static admin(): UserRole { return new UserRole('admin') }

  static create(value: string): UserRole {
    if (!['user', 'admin'].includes(value))
      throw new OneJsError(UserErrorTypes.VALIDATION_FAILED, 400, UserErrorMessages.INVALID_ROLE, {}, ErrorCodes.VALIDATION_FAILED)
    return new UserRole(value)
  }
}
```

## Entities

**Entities** have identity and lifecycle. They are built from value objects and expose behavior through methods.

### Pattern

```typescript
import { Entity, EntityBase } from '@OneJs/core'
import type { UserDto } from '../../application/dtos/user.dto'
import { Email } from '../value-objects/email'
import { PasswordHash } from '../value-objects/password-hash'
import { UserId } from '../value-objects/user-id'
import { UserRole } from '../value-objects/user-role'
import { ResetToken } from '../value-objects/reset-token'

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

  // Factory: create a new user (business operation)
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

  // Factory: reconstitute from persistence (hydration only)
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

  // Immutable state transition
  withPasswordHash(hash: PasswordHash): User {
    return new User(this.getId(), this.email, hash, this.role, this.createdAt, null)
  }

  withResetToken(token: ResetToken | null): User {
    return new User(this.getId(), this.email, this.passwordHash, this.role, this.createdAt, token)
  }

  // Required by @Entity() decorator
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

### Key Rules

- Extend `EntityBase<TId>` where `TId` is a VO (e.g., `UserId`)
- Decorate with `@Entity()`
- **Constructor receives VOs**, never primitives
- `static register()` — creates a new entity (business operation, accepts VOs)
- `static reconstitute()` — hydrates from persistence (accepts primitives, converts to VOs internally)
- `with*()` methods return **new instances** (immutability)
- `toDto()` is required by the `@Entity()` decorator
- No getters/setters — expose behavior through methods
- `getId()` returns the typed VO id (inherited from `EntityBase`)

### Calling Conventions

```typescript
// ✅ Create new entity (factory receives VOs)
const email = Email.create('user@example.com')
const hash = PasswordHash.create(rawHash)
const user = User.register(email, hash)

// ✅ Reconstitute from DB (accepts primitives at persistence boundary only)
const user = User.reconstitute(record.id, record.email, record.passwordHash, record.role, record.createdAt, record.resetToken)

// ✅ Immutable transition (with* receives VOs)
const updated = user.withPasswordHash(PasswordHash.create(newHash))

// ❌ Wrong — never pass primitives to register() or with*()
const user = User.register('user@example.com', 'raw_hash')
const updated = user.withPasswordHash('raw_hash')
```

## Domain Services

**Domain Services** contain business logic that doesn't belong to a specific entity:

```typescript
import { UserLogScopes } from '../constants/log-scopes'

@Injectable()
export class PricingService {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  run(order: Order, customer: Customer): OrderTotal {
    this.logger.debug(UserLogScopes.SERVICE, `Calculating for order ${order.getId().getValue()}`)
    const subtotal = this.calculateSubtotal(order)
    const discount = this.calculateDiscount(customer, subtotal)
    return new OrderTotal(subtotal, discount)
  }

  private calculateDiscount(customer: Customer, subtotal: Money): Money {
    if (customer.isVip() && subtotal.isGreaterThan(Money.dollars(100)))
      return subtotal.multiply(0.10)
    return Money.zero()
  }
}
```

## Application Layer (Use Cases)

Application services orchestrate domain objects. They:
- Accept **VOs or entities** as parameters (never primitives)
- Load entities from repositories
- Delegate business logic to entities/domain services
- Publish domain events
- Never contain business rules themselves

```typescript
import { UserErrorTypes } from '../constants/error-types'

@Injectable()
export class OrderCreator {
  constructor(
    @Inject(InMemoryOrderRepository) private readonly orderRepo: IOrderRepository,
    @Inject(InMemoryCustomerRepository) private readonly customerRepo: ICustomerRepository,
    @Inject(PricingService) private readonly pricingService: PricingService,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async run(customerId: CustomerId, items: OrderItem[]): Promise<Order> {
    const customer = await this.customerRepo.findById(customerId)
    if (!customer)
      throw new OneJsError(UserErrorTypes.NOT_FOUND, 404, CustomerErrorMessages.CUSTOMER_NOT_FOUND, {}, ErrorCodes.NOT_FOUND)

    const order = Order.create(customerId, items)
    const total = this.pricingService.run(order, customer)
    order.applyTotal(total)

    await this.orderRepo.save(order)
    await this.eventBus.publish(new OrderCreatedEvent(order))
    return order
  }
}
```

## Domain Events

Domain events represent important things that happened in the domain:

```typescript
// Domain event — carries the entity (not primitives)
export class UserRegisteredEvent {
  constructor(public readonly user: User) {}
}

// Publishing (in application service)
await this.eventBus.publish(new UserRegisteredEvent(user))

// Handling (in a handler class)
@Injectable()
export class UserRegisteredHandler {
  @EventHandler(UserRegisteredEvent)
  async handle(event: UserRegisteredEvent): Promise<void> {
    // react to the event using event.user
  }
}
```

## Repository Pattern (Ports & Adapters)

```typescript
// Port — domain interface with VO params
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  save(user: User): Promise<void>
  delete(id: UserId): Promise<void>
}

// Adapter — infrastructure implementation
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>()

  async findById(id: UserId): Promise<User | null> {
    return this.store.get(id.getValue()) ?? null
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const u of this.store.values())
      if (u.email.getValue() === email.getValue()) return u
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

## No Primitives Rule

The single most important convention in this codebase:

| Boundary | Rule | Example |
|---|---|---|
| Domain layer — entity constructor | VOs as params | `constructor(id: UserId, email: Email)` |
| Domain layer — repository interface | VOs everywhere | `findByEmail(email: Email)` |
| Application service `run()` | VOs or entities as params | `run(email: Email, hash: PasswordHash)` |
| Entity `register()` | VOs as params | `User.register(email: Email, hash: PasswordHash)` |
| Entity `with*()` | VOs as params | `user.withPasswordHash(hash: PasswordHash)` |
| Entity `reconstitute()` | Primitives allowed **only here** (persistence boundary) | `User.reconstitute(id: string, ...)` |
| `toDto()` | Extracts primitives via `.getValue()` | `this.email.getValue()` |
| Controller / API handler | Creates VOs from request primitives | `Email.create(req.body.email)` |

Primitives only cross the domain boundary in three places:
1. **`reconstitute()`** — reading from persistence
2. **`toDto()`** — writing to persistence
3. **Controllers** — creating VOs from raw HTTP/RPC input

Everywhere else, pass VOs and entities.

> **This document is the authoritative source** for the "No Primitives Rule" across the codebase. All other docs, agent prompts, and skill files reference this section rather than re-stating the full rule.

## No Magic Strings

Every string literal used as an error type label, error message, log scope, or domain concept value MUST be defined as a named constant — never an inline string literal.

### Pattern per bounded context

Each bounded context defines its own constants in `domain/constants/`:

```
packages/<context>/
└── domain/
    └── constants/
        ├── error-types.ts       # OneJsError type labels
        ├── error-messages.ts    # OneJsError messages
        └── log-scopes.ts        # Logger scope identifiers
```

### Example

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

### Usage

```typescript
// ✅ Correct — named constants
throw new OneJsError(UserErrorTypes.CONFLICT, 409, UserErrorMessages.EMAIL_IN_USE, {}, ErrorCodes.USER_ALREADY_EXISTS)
this.logger.debug(UserLogScopes.SERVICE, `User created: ${user.getId().getValue()}`)

// ❌ Wrong — magic strings
throw new OneJsError('Conflict', 409, 'Email already in use', {}, ErrorCodes.USER_ALREADY_EXISTS)
this.logger.debug('user:service', `User created: ${user.getId().getValue()}`)
```

### Key Rules

- Error type labels, messages, and log scopes are ALWAYS named constants
- Each bounded context owns its own constants (aligned with DDD ubiquitous language)
- Constants files live in `domain/constants/` within each context
- Reviewer agents flag inline magic strings in error construction and log calls

## Anti-Corruption Layer

When integrating with external systems, translate at the adapter boundary:

```typescript
export class ExternalUserAdapter {
  toDomain(external: ExternalUserResponse): User {
    return User.reconstitute(
      external.user_id,
      external.email_address,
      external.password_hash,
      external.role,
      new Date(external.created_at),
      null,
    )
  }
}
```

## Best Practices

1. **Rich domain models**: Business logic lives in entities and domain services — not in services or controllers
2. **VO-first**: Model every concept as a VO before using a primitive
3. **No magic strings**: All error type labels, messages, and log scopes are named constants per bounded context — see [No Magic Strings](#no-magic-strings) above
4. **No primitives as parameters**: Entity constructors, `register()`, `with*()`, and `run()` receive VOs — see [No Primitives Rule](#no-primitives-rule) above
5. **Consistency boundaries**: Aggregates maintain invariants; only reference other aggregates by VO id
6. **Domain events**: Use events for cross-aggregate consistency and side effects
7. **Layered dependencies**: Domain ← Application ← Infrastructure (never reversed)
8. **Ubiquitous language**: Class names, method names, and concepts match business terminology

> ⚠️ This document is the **canonical source** for DDD/hexagonal rules. All agent prompts, skill files, and other convention docs reference this file. When in doubt, consult this document.
