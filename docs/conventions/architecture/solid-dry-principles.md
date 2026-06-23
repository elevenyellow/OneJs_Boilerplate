# SOLID + DRY Principles in Practice

How the five SOLID principles and DRY apply within the OneJs DDD/Hexagonal architecture.

---

## S — Single Responsibility Principle

**One reason to change per class.**

| Layer | What it does | What it does NOT do |
|---|---|---|
| Entity | Encapsulates domain rules + invariants | Persistence, HTTP, validation of external input |
| Value Object | Validates + normalises a single concept | Business workflows, side effects |
| Application Service | Orchestrates one use case | Domain rules, infrastructure concerns |
| Repository interface | Declares one persistence contract | Query building, HTTP, business logic |
| Controller | Translates HTTP ↔ VOs/DTOs | Business logic, direct DB access |

```typescript
// BAD — service does too much
@Injectable()
export class UserCreator {
  async run(email: string) {
    const normalised = email.trim().toLowerCase() // ← belongs in Email VO
    if (!/regex/.test(normalised)) throw new Error('bad email') // ← belongs in Email VO
    // ...
  }
}

// GOOD — responsibility delegated to the right layer
@Injectable()
export class UserCreator {
  async run(email: Email, passwordHash: PasswordHash): Promise<User> {
    // Email is already valid — it was created at the boundary
    const user = User.register(email, passwordHash)
    await this.repo.save(user)
    return user
  }
}
```

---

## O — Open/Closed Principle

**Open for extension, closed for modification.**

New behaviour is added by implementing new classes (strategies, event handlers, adapters), not by modifying existing ones.

```typescript
// BAD — adding a new auth strategy requires editing the existing class
export class AuthService {
  async login(type: 'clerk' | 'jwt', ...) {
    if (type === 'clerk') { /* ... */ }
    else { /* ... */ }
  }
}

// GOOD — new strategy = new adapter; existing code untouched
export interface IAuthStrategy {
  authenticate(token: string): Promise<UserId>
}

@Injectable()
export class ClerkStrategy implements IAuthStrategy { /* ... */ }

@Injectable()
export class JwtStrategy implements IAuthStrategy { /* ... */ }
```

Domain events follow the same pattern: publishing an event extends behaviour without touching the use case that raised it.

---

## L — Liskov Substitution Principle

**Any implementation of a port must be a valid substitute for any other.**

The InMemory repository and the Prisma repository are interchangeable — tests use the InMemory adapter and production uses Prisma, with no caller difference.

```typescript
// Both implement IUserRepository — callers never distinguish between them
@Injectable()
export class InMemoryUserRepository implements IUserRepository { /* ... */ }

@Injectable()
export class PrismaUserRepository implements IUserRepository { /* ... */ }
```

Rules:
- Implementations must honour ALL methods declared by the interface.
- InMemory fakes must behave identically to production adapters for the contracts the tests rely on — no relaxed error handling, no missing methods.
- Never narrow the contract in a subclass (e.g., do not throw where the interface says `Promise<null>`).

---

## I — Interface Segregation Principle

**Clients should not depend on methods they do not use.**

Split repository interfaces by the operations each use case actually needs. A read-only query service should not be forced to depend on `save()`.

```typescript
// BAD — read-only service depends on a write method it never calls
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  save(user: User): Promise<void>
  delete(id: UserId): Promise<void>
}

// GOOD — segregated by read/write concern
export interface IUserReadRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
}

export interface IUserWriteRepository {
  save(user: User): Promise<void>
  delete(id: UserId): Promise<void>
}
```

Apply ISP when a use case only reads or only writes — merge interfaces when a single service genuinely needs both.

> **Note on existing code**: the current `IUserRepository` and `ITaskRepository` interfaces combine read and write methods in a single interface. That is acceptable — do not refactor them unless a new use case genuinely only needs one half. ISP applies at design time for new interfaces, not as a mandate to split existing ones.

---

## D — Dependency Inversion Principle

**High-level modules depend on abstractions, not on concrete adapters.**

All ports (interfaces) live in `domain/repositories/`. Application services receive them via DI. Infrastructure adapters implement them. The dependency arrow always points inward.

```
Domain (IUserRepository interface)
    ↑ implements
Infrastructure (InMemoryUserRepository, PrismaUserRepository)

Application (UserCreator) → domain interface only, never the adapter
```

```typescript
// BAD — TypeScript type is the concrete adapter; the service is tightly coupled to it
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user-repository'

@Injectable()
export class UserCreator {
  constructor(
    @Inject(PrismaUserRepository)
    private readonly repo: PrismaUserRepository, // ← coupled to Prisma
  ) {}
}

// GOOD — TypeScript type is the domain interface; only the DI token names the concrete class
import type { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { InMemoryUserRepository } from '../../infrastructure/repositories/in-memory-user-repository'

@Injectable()
export class UserCreator {
  constructor(
    @Inject(InMemoryUserRepository) // ← DI token: tells the container which adapter to inject
    private readonly repo: IUserRepository, // ← type: what the service actually depends on
  ) {}
}
```

> **Why both?** OneJs DI resolves dependencies by the class passed to `@Inject()`. The TypeScript type annotation is separate — it controls what the service *sees*. Passing the interface as the type and the concrete class as the token is the correct pattern: the service code only knows the interface; the container wires the concrete adapter at runtime.

---

## DRY — Don't Repeat Yourself

**Every piece of knowledge has a single, authoritative representation.**

### Where DRY commonly breaks — and how to fix it

| Anti-pattern | Fix |
|---|---|
| Same validation logic in multiple VOs | Extract to a shared pure function in `packages/shared/` |
| Same error message string in two files | Named constant in the bounded context's `*-error-messages.ts` |
| Same repository query logic duplicated across adapters | Extract to a base repository class or query builder in `infrastructure/` |
| Same DTO ↔ entity mapping in several services | Move to `entity.toDto()` / `Entity.reconstitute()` |
| Same HTTP response shape built in multiple controllers | Shared response builder in `infrastructure/http/` |

### Canonical locations

```
packages/<context>/domain/
├── errors/
│   ├── user-error-types.ts       ← single source for error type labels
│   └── user-error-messages.ts    ← single source for human-readable messages

packages/shared/
├── auth/                         ← shared auth contracts
└── events/                       ← cross-context integration events
```

Cross-context shared utilities go in `packages/shared/` as a new subfolder. Do not create `packages/shared/domain/utils/` — check what already exists under `packages/shared/` before adding structure.

### DRY in tests

- The InMemory adapter is the shared fake — never duplicate its behaviour in a custom mock.
- Use `TestHelpers` from `@OneJs/testing` for common test setup instead of copy-pasting bootstrap code.
- Shared fixtures belong in `tests/fixtures/`, not duplicated per test file.

### DRY ≠ premature abstraction

Do not extract code at the first duplication. Extract when:

1. The same logic appears in **three or more** distinct places, **AND**
2. All occurrences represent the **same concept** (not coincidentally similar code).

Two similar-looking `find` queries in different bounded contexts may be independent — coupling them violates bounded context isolation.

---

## Quick Checklist

Before opening a PR, verify:

- [ ] Each class has one clear responsibility — a single reason to change.
- [ ] New behaviour was added by creating new types/adapters, not by editing stable ones.
- [ ] InMemory and Prisma adapters are fully interchangeable for every method in the interface.
- [ ] No use case depends on a method it never calls — split the interface if needed.
- [ ] Application services depend on domain interfaces, not on concrete adapters.
- [ ] No magic strings — every error type and message is a named constant.
- [ ] No duplicated validation — it lives in the VO; controllers only call `VO.create()`.
- [ ] Shared utilities live in `packages/shared/`, not copy-pasted across contexts.
