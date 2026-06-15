---
name: hexagonal-architecture
description: Hexagonal + DDD rules for this monorepo — bounded contexts, inward-only layer dependencies (domain → application → infrastructure), repository port/adapter, application services with run(), no primitives as parameters. Load when writing, reviewing, or refactoring backend code in packages/ or planning cross-context workflows.
---

# Hexagonal Architecture + DDD

Short checklist. Full structure, examples, and rationale live in `docs/conventions/` — go there for any detail.

## Framework

This project uses the **OneJs framework** (`.oneJs/`):

```typescript
import { Entity, EntityBase, ValueObject, ValueObjectBase } from '@OneJs/core'
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
```

## Bounded contexts

Each package in `packages/` is a bounded context with its own ubiquitous language:

- `user` — example domain; reference implementation.
- `task` — example second bounded context.
- `shared` — shared kernel (integration events).

Contexts communicate through **application services or domain ports**, never direct adapter coupling.

## Layers — dependency direction is inward only

```
packages/<context>/
  domain/           ← no external dependencies
  application/      ← depends on domain
  infrastructure/   ← depends on domain + application
```

- **Domain**: entities (`EntityBase<TId>` + `@Entity()`), value objects (`ValueObjectBase<T>` + `@ValueObject()`), repository **interfaces** (ports), domain services, domain events.
- **Application**: services with a single `run(vo|entity)` entry point, `@Injectable()` + `@Inject(ConcreteClass)` constructor injection, DTOs at persistence boundaries.
- **Infrastructure**: repository **implementations** (adapters) with `@Injectable()`, controllers, event handlers.

## No primitives as parameters

This is the most critical rule in the codebase. The canonical source is [ddd-principles.md — No Primitives Rule](../../../../docs/conventions/architecture/ddd-principles.md#no-primitives-rule).

- `run()` params: always VOs or entities — never `string`, `number`, `boolean`
- Entity constructors: always VOs — never primitives
- Repository interface methods: always VO params — `findById(id: UserId)`, `findByEmail(email: Email)`
- Entity `register()` and `with*()`: accept VOs
- Entity `reconstitute()`: the ONLY place that accepts primitives (persistence boundary)

## Repository port/adapter

Port in domain, adapter in infrastructure. Method names use **business language**, not database verbs. Parameters and returns use domain entities and value objects.

```typescript
// Port (domain)
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  save(user: User): Promise<void>
}

// Adapter (infrastructure) — always @Injectable()
@Injectable()
export class InMemoryUserRepository implements IUserRepository { ... }
```

→ Full pattern: [patterns/repository-patterns.md](../../../../docs/conventions/patterns/repository-patterns.md)

## Value Object pattern

```typescript
@ValueObject()
export class Email extends ValueObjectBase<string> {
  private constructor(value: string) { super(value) }
  static create(value: string): Email { /* validate, throw OneJsError */ }
}
```

## Entity pattern

```typescript
@Entity()
export class User extends EntityBase<UserId> {
  constructor(id: UserId, readonly email: Email, ...) { super(id) }
  static register(email: Email, hash: PasswordHash): User { ... }       // VOs
  static reconstitute(id: string, email: string, ...): User { ... }     // primitives OK here only
  withPasswordHash(hash: PasswordHash): User { /* returns new User */ }  // immutable
  toDto(): UserDto { ... }  // required by @Entity()
}
```

## Error handling

```typescript
throw new OneJsError('Not Found', 404, 'User not found', {}, ErrorCodes.USER_NOT_FOUND)
```

Never `new Error()`. **No magic strings**: every type label and message must be a named constant per bounded context (see [ddd-principles.md — No Magic Strings](../../../../docs/conventions/architecture/ddd-principles.md#no-magic-strings)).

→ Full guide: [patterns/error-handling.md](../../../../docs/conventions/patterns/error-handling.md)
