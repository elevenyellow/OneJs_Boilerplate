# Naming Conventions

This document defines the naming conventions used throughout the monorepo.

## File Naming

### Pattern: `kebab-case.ts`

Files use kebab-case with a descriptive suffix that indicates their role:

```
✅ Good
user.ts                          # Entity
email.ts                         # Value Object
user-id.ts                       # Value Object
user.repository.interface.ts     # Repository port
in-memory-user.repository.ts     # Repository adapter
user-creator.service.ts          # Application service
user-registered.event.ts         # Domain event
user.dto.ts                      # DTO
auth.controller.ts               # Controller

❌ Bad
UserCreator.service.ts
userCreator.service.ts
user_creator.service.ts
user.entity.ts     ← don't add .entity. suffix
email.vo.ts        ← don't add .vo. suffix
```

### File Type Suffixes

| Type | Suffix | Example |
|------|--------|---------|
| Entity | `.ts` | `user.ts`, `order.ts` |
| Value Object | `.ts` | `email.ts`, `user-id.ts`, `user-role.ts` |
| Repository interface | `.repository.interface.ts` | `user.repository.interface.ts` |
| Repository impl | `.repository.ts` | `in-memory-user.repository.ts` |
| Service | `.service.ts` | `user-creator.service.ts` |
| Domain event | `.event.ts` | `user-registered.event.ts` |
| DTO | `.dto.ts` | `user.dto.ts` |
| Controller | `.controller.ts` | `auth.controller.ts` |

## Class Naming

### Pattern: `PascalCase`

```typescript
✅ Good
export class UserCreator { }
export class InMemoryUserRepository { }
export class Email { }
export class UserId { }
export class UserRole { }

❌ Bad
export class userCreator { }
export class User_Creator { }
export class user_creator { }
export class UserFactory { }    // ← No factory classes; use @Injectable() DI
```

### Class Naming Patterns

| Layer | Pattern | Examples |
|-------|---------|----------|
| Entity | `[Entity]` | `User`, `Order`, `Task` |
| Value Object | `[Concept]` | `Email`, `UserId`, `UserRole`, `PasswordHash` |
| Repository interface | `I[Entity]Repository` | `IUserRepository`, `IOrderRepository` |
| Repository impl | `[Storage][Entity]Repository` | `InMemoryUserRepository`, `UserPrismaRepository` |
| Application service | `[Entity][Action]` | `UserCreator`, `UserFinder` |
| Domain service | `[Entity][Action]` | `UserValidator`, `PricingCalculator` |
| Domain event | `[Entity][Action]Event` | `UserRegisteredEvent`, `PasswordChangedEvent` |
| Controller | `[Entity]Controller` | `AuthController` |

## Method Naming

### Pattern: `camelCase`

```typescript
✅ Good
class UserCreator {
  async run(email: Email, passwordHash: PasswordHash): Promise<User> { }  // VO params
  private validateUniqueness(email: Email): Promise<void> { }
}

class UserFinder {
  async run(id: UserId): Promise<User | null> { }  // VO param
}

interface IUserRepository {
  async findById(id: UserId): Promise<User | null> { }   // VO param
  async findByEmail(email: Email): Promise<User | null> { }
  async save(user: User): Promise<void> { }
  async delete(id: UserId): Promise<void> { }
}

❌ Bad
class UserCreator {
  async execute() { }                          // Not run()
  async run(email: string): Promise<User> { }  // Primitive param
  async CreateUser() { }                       // PascalCase
}
```

### Standard Method Names

| Purpose | Method Name | Notes |
|---------|-------------|-------|
| Service entry point | `run(vo)` | Always VOs/entities as params, never primitives |
| Find by ID | `findById(id: SomeId)` | Returns `Promise<Entity \| null>` |
| Find by field | `findBy[Field](vo: FieldVO)` | VO param |
| Persist | `save(entity: Entity)` | Repository pattern |
| Remove | `delete(id: SomeId)` | VO id param |
| VO factory | `create(primitive)` | Creates VO from primitive, validates |
| Entity factory | `register(...VOs)` | Creates new entity from VOs |
| Entity hydration | `reconstitute(...primitives)` | Rebuilds from DB; only place with primitive params |
| State transition | `with[State](vo: SomeVO)` | Returns new immutable instance |
| Serialize | `toDto()` | Entity → DTO |

## Variable and Parameter Naming

### Pattern: `camelCase`

```typescript
✅ Good
const userId = UserId.fromString(rawId)
const userEmail = Email.create(rawEmail)
const savedUser = await this.userRepository.save(user)

❌ Bad
const user_id = UserId.fromString(rawId)
const UserEmail = Email.create(rawEmail)
const saved_user = await this.userRepository.save(user)
```

## Package Naming

### Framework packages: `@OneJs/package-name`

```typescript
import { Injectable } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
```

### Local workspace packages: `@[scope]/package-name` (lowercase with hyphens)

```json
"@myapp/user"
"@myapp/task"
"@myapp/shared"
```

## Directory Naming

### Pattern: `kebab-case`

```
packages/
├── user/               # bounded context
├── task/               # bounded context
└── shared/             # shared kernel

domain/
├── entities/
├── value-objects/
├── repositories/
└── events/
```

## Constants

### Pattern: `SCREAMING_SNAKE_CASE`

```typescript
const MAX_RETRY_ATTEMPTS = 3
const DEFAULT_PAGE_SIZE = 20
const MIN_PASSWORD_LENGTH = 8
```

## Type Definitions

### Repository interfaces: `I[Entity]Repository`

```typescript
// ✅ Good — I prefix is standard for port interfaces
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
}

// ❌ Bad
export interface UserRepository { }   // ambiguous with implementation
```

## Import/Export Naming

```typescript
✅ Good
import { UserCreator } from './user-creator.service'
import { InMemoryUserRepository } from './in-memory-user.repository'
export { UserCreator } from './user-creator.service'

❌ Bad
import { UserCreator as Creator } from './user-creator.service'
import UserCreator from './user-creator.service'  // No default exports
```

## Best Practices

1. **Be Descriptive**: Names clearly indicate purpose and behavior
2. **Be Consistent**: Follow the same patterns across the codebase
3. **Avoid Abbreviations**: Use full words unless commonly understood (`id`, `dto`, `vo`)
4. **Use Domain Language**: Reflect business concepts in naming
5. **No Factory classes**: Use `@Injectable()` + `@Inject()` — no `UserFactory`
6. **No `.entity.ts` / `.vo.ts` suffixes**: The directory (`entities/`, `value-objects/`) provides that context

## Examples from Current Codebase

```typescript
// Files
user.ts                        // Entity (in domain/entities/)
email.ts                       // VO (in domain/value-objects/)
user.repository.interface.ts   // Port
in-memory-user.repository.ts   // Adapter

// Classes
class User extends EntityBase<UserId> { }
class Email extends ValueObjectBase<string> { }
class InMemoryUserRepository implements IUserRepository { }
class UserCreator { async run(email: Email, hash: PasswordHash): Promise<User> { } }

// Correct — VO params throughout
async findByEmail(email: Email): Promise<User | null>
async run(id: UserId): Promise<User | null>
static register(email: Email, passwordHash: PasswordHash): User
```
