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
      throw new OneJsError('Validation failed', 400, `Invalid email: ${normalized}`, {}, ErrorCodes.VALIDATION_FAILED)
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
// ID with auto-generation
@ValueObject()
export class UserId extends ValueObjectBase<string> {
  private constructor(value: string) { super(value) }

  static generateUniqueId(): UserId {
    return new UserId(uuidv4())
  }

  static fromString(value: string): UserId {
    if (!value) throw new OneJsError('Validation failed', 400, 'Invalid UserId', {}, ErrorCodes.VALIDATION_FAILED)
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
      throw new OneJsError('Validation failed', 400, `Invalid role: ${value}`, {}, ErrorCodes.VALIDATION_FAILED)
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
@Injectable()
export class PricingService {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  run(order: Order, customer: Customer): OrderTotal {
    this.logger.debug('pricing-service', `Calculating for order ${order.getId().getValue()}`)
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
      throw new OneJsError('Not Found', 404, 'Customer not found', {}, ErrorCodes.NOT_FOUND)

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
| Domain layer | VOs everywhere | `findByEmail(email: Email)` |
| Application service `run()` | VOs or entities as params | `run(email: Email, hash: PasswordHash)` |
| Entity `register()` | VOs as params | `User.register(email: Email, hash: PasswordHash)` |
| Entity `reconstitute()` | Primitives allowed (persistence boundary) | `User.reconstitute(id: string, ...)` |
| `toDto()` | Extracts primitives via `.getValue()` | `this.email.getValue()` |
| Controller / API handler | Creates VOs from request primitives | `Email.create(req.body.email)` |

Primitives only cross the domain boundary in two places:
1. **`reconstitute()`** — reading from persistence
2. **`toDto()`** — writing to persistence
3. **Controllers** — creating VOs from raw HTTP/RPC input

Everywhere else, pass VOs and entities.

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
3. **Consistency boundaries**: Aggregates maintain invariants; only reference other aggregates by VO id
4. **Domain events**: Use events for cross-aggregate consistency and side effects
5. **Layered dependencies**: Domain ← Application ← Infrastructure (never reversed)
6. **Ubiquitous language**: Class names, method names, and concepts match business terminology
