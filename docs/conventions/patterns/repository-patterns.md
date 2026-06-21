# Repository Patterns

This document outlines the repository patterns used in the monorepo, following the Port/Adapter pattern from Hexagonal Architecture on top of the **OneJs framework**.

## Repository Architecture

### Port (Domain Interface)
The domain layer defines repository interfaces that express business needs without infrastructure concerns.

**Location:** `packages/[context]/domain/repositories/`
**Purpose:** Define contracts for data access using domain types

### Adapter (Infrastructure Implementation)
The infrastructure layer provides concrete implementations that fulfill the domain contracts.

**Location:** `packages/[context]/infrastructure/repositories/`
**Purpose:** Implement data persistence; InMemory adapters are the default for testing

## Repository Interface Pattern

### Standard Interface Structure

```typescript
// packages/user/domain/repositories/user.repository.interface.ts
import type { User } from '../entities/user'
import type { UserId } from '../value-objects/user-id'
import type { Email } from '../value-objects/email'
import type { ResetToken } from '../value-objects/reset-token'

export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  findByResetToken(token: ResetToken): Promise<User | null>
  save(user: User): Promise<void>
  delete(id: UserId): Promise<void>
}
```

### Key Interface Principles

1. **Domain types only**: Parameters and returns use value objects and entities — never primitives
2. **Business language**: Method names reflect domain concepts, not database operations
3. **Promise-based**: All operations are asynchronous
4. **Nullable returns**: Use `null` (not `undefined`) for not-found cases

## InMemory Repository (Default Adapter)

InMemory repositories are the canonical implementation for development and testing. They live in `infrastructure/` next to any future production adapters.

```typescript
// packages/user/infrastructure/repositories/in-memory-user.repository.ts
import { Injectable } from '@OneJs/core'
import { User } from '../../domain/entities/user'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface'
import type { UserId } from '../../domain/value-objects/user-id'
import type { Email } from '../../domain/value-objects/email'
import type { ResetToken } from '../../domain/value-objects/reset-token'

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
    for (const user of this.store.values()) {
      if (user.email.getValue() === email.getValue()) return user
    }
    return null
  }

  async findByResetToken(token: ResetToken): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.resetToken?.getValue() === token.getValue()) return user
    }
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

## Prisma Repository (Production Adapter)

When adding persistence, implement the same interface against a Prisma client:

```typescript
// packages/user/infrastructure/repositories/user-prisma.repository.ts
import { Injectable } from '@OneJs/core'
import type { PrismaClient } from '@OneJs/prisma'
import { User } from '../../domain/entities/user'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface'
import type { UserId } from '../../domain/value-objects/user-id'
import type { Email } from '../../domain/value-objects/email'
import type { ResetToken } from '../../domain/value-objects/reset-token'

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const record = await this.db.user.findUnique({ where: { id: id.getValue() } })
    return record ? User.reconstitute(
      record.id,
      record.email,
      record.passwordHash,
      record.role,
      record.createdAt,
      record.resetToken,
    ) : null
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.db.user.findUnique({ where: { email: email.getValue() } })
    return record ? User.reconstitute(
      record.id,
      record.email,
      record.passwordHash,
      record.role,
      record.createdAt,
      record.resetToken,
    ) : null
  }

  async findByResetToken(token: ResetToken): Promise<User | null> {
    const record = await this.db.user.findFirst({ where: { resetToken: token.getValue() } })
    return record ? User.reconstitute(
      record.id,
      record.email,
      record.passwordHash,
      record.role,
      record.createdAt,
      record.resetToken,
    ) : null
  }

  async findAll(): Promise<User[]> {
    const records = await this.db.user.findMany()
    return records.map(r => User.reconstitute(
      r.id,
      r.email,
      r.passwordHash,
      r.role,
      r.createdAt,
      r.resetToken,
    ))
  }

  async save(user: User): Promise<void> {
    const dto = user.toDto()
    await this.db.user.upsert({
      where: { id: dto.id },
      create: dto,
      update: { email: dto.email, passwordHash: dto.passwordHash, role: dto.role, resetToken: dto.resetToken },
    })
  }

  async delete(id: UserId): Promise<void> {
    await this.db.user.delete({ where: { id: id.getValue() } })
  }
}
```

## Entity Reconstruction

Entities are reconstructed from persistence via `reconstitute()`, not `fromDto()`:

```typescript
// ✅ Correct — use reconstitute() for persistence hydration
User.reconstitute(id, email, passwordHash, role, createdAt, resetToken)

// ❌ Wrong — fromDto() is not part of the OneJs entity pattern
User.fromDto(rawRecord)
```

`reconstitute()` accepts primitives (strings, dates) and converts them to VOs internally. It is the only place in the codebase where primitives cross the domain boundary from persistence.

## Entity Transformation (toDto)

Every entity implements `toDto()` to serialize to persistence:

```typescript
// In User entity
toDto(): UserDto {
  return new UserDto(
    this.getId().getValue(),      // VO → primitive
    this.email.getValue(),
    this.role.getValue(),
    this.createdAt,
  )
}
```

## DI Binding Pattern

Bind the concrete implementation to the interface via `@Inject()`:

```typescript
@Injectable()
export class UserCreator {
  constructor(
    @Inject(InMemoryUserRepository)          // concrete token
    private readonly repo: IUserRepository,  // typed as interface
  ) {}
}
```

Swap the concrete class in the `@Inject()` token to switch between InMemory and Prisma adapters without changing the service.

## Testing Pattern

Repository tests verify the InMemory adapter directly. Service tests use the InMemory adapter as a real dependency (not a mock):

```typescript
// Testing the InMemory adapter
describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository

  beforeEach(() => {
    repository = new InMemoryUserRepository()
  })

  it('returns null for a user that was never saved', async () => {
    const id = UserId.generateUniqueId()
    const result = await repository.findById(id)
    expect(result).toBeNull()
  })

  it('finds a user by email after it has been saved', async () => {
    const user = User.register(Email.create('test@example.com'), PasswordHash.create('hashed_pw'))
    await repository.save(user)

    const found = await repository.findByEmail(Email.create('test@example.com'))
    expect(found).not.toBeNull()
    expect(found!.email.getValue()).toBe('test@example.com')
  })
})
```

## Best Practices

1. **VO parameters**: All interface methods accept and return domain types (VOs/entities) — never raw primitives
2. **`reconstitute()` for hydration**: Use entity's `reconstitute()` when mapping from DB records
3. **`null` over `undefined`**: Return `null` for not-found — consistent with TypeScript strict null checks
4. **`@Injectable()` on implementations**: Required for the OneJs DI container
5. **InMemory first**: Start with the InMemory adapter; add Prisma when persistence is needed
6. **Both adapters implement same interface**: Swap without changing consumers
7. **No direct DB access in services**: All persistence goes through the repository interface
