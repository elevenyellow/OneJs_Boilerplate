# OneJs DDD Boilerplate — Conventions & Architecture

TypeScript monorepo built with Domain-Driven Design (DDD) and Hexagonal Architecture (Ports & Adapters) on top of the **OneJs framework**.

## Stack

- **Runtime**: Bun
- **Language**: TypeScript (strict)
- **Framework**: OneJs (`.oneJs/`) — DI container, EntityBase, ValueObjectBase, EventBus, Logger, plugin system
- **API**: Bun + Elysia (`apps/api`)
- **Database**: InMemory (default) / PostgreSQL + Prisma (production)
- **Linting/Formatting**: Biome
- **Testing**: Bun test

## Framework Imports

```typescript
// Core — DI, primitives, errors, logger
import { Entity, EntityBase, ValueObject, ValueObjectBase } from '@OneJs/core'
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'

// HTTP
import { Controller, Get, Post, type Context } from '@OneJs/server'

// Auth
import { UseAuth, Roles, AuthPlugin, ClerkStrategy } from '@OneJs/auth'

// Events
import { EventBus, EventHandler, DomainEvent } from '@OneJs/event-bus'

// Testing (unit tests only)
import { InMemoryEventBus, SilentLogger, TestHelpers } from '@OneJs/testing'
```

## Project Structure

```
packages/
├── user/         # Example bounded context
│   ├── domain/
│   │   ├── entities/        # EntityBase<TId> subclasses
│   │   ├── value-objects/   # ValueObjectBase<T> subclasses
│   │   ├── repositories/    # Interface (port) definitions
│   │   └── events/          # Domain event classes
│   ├── application/
│   │   ├── *.service.ts     # Use case services (run() entry point)
│   │   └── dtos/            # DTO classes (persistence boundary)
│   └── infrastructure/
│       ├── repositories/    # InMemory + Prisma adapters
│       └── controllers/     # HTTP controllers
├── task/         # Example second bounded context
└── shared/       # Shared kernel (integration events)
```

## Bounded Context Structure

Each bounded context follows the same three-layer architecture:

```
packages/{context}/
├── domain/           ← no external dependencies
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/ # interfaces (ports)
│   └── events/
├── application/      ← depends on domain
│   ├── *.service.ts  # run(vo|entity) entry point
│   └── dtos/
└── infrastructure/   ← depends on domain + application
    ├── repositories/ # concrete adapters (@Injectable())
    └── controllers/
```

## Core Rules

- **No magic strings**: every error type label, error message, and log scope is a named constant per bounded context — never inline string literals. See [ddd-principles.md — No Magic Strings](./architecture/ddd-principles.md#no-magic-strings).
- **No primitives as parameters**: `run()` and repository interface methods receive VOs, entities, or aggregates — never `string`, `number`, `boolean`. VOs are created at the system boundary (controller).
- **Entities built from VOs**: constructors and `register()` receive VOs; `reconstitute()` is the only place accepting primitives (persistence boundary). See [ddd-principles.md — No Primitives Rule](./architecture/ddd-principles.md#no-primitives-rule).
- **Immutable entities**: all properties `readonly`; state transitions via `with*()` returning new instances.
- **`run()` entry point**: every application and domain service exposes a public `run()` method.
- **`@Injectable()` + `@Inject()`**: all DI via decorators — no factory classes.
- **`OneJsError`**: all errors use `new OneJsError(type, statusCode, message, details, ErrorCodes.CODE)` with named constants for type and message.
- **InMemory fakes in tests**: never mock repositories — use the InMemory adapter.
- **Unit tests without mocks**: unit tests (`tests/unit/`) use zero mocks/stubs/spies; if a test requires mocks, it's an integration test (`*.integration.test.ts`).
- **`reconstitute()` for hydration**: entity from DB record; `toDto()` to write back.

## Dependency Direction

```
Domain (no external deps) ← Application ← Infrastructure
```

Domain defines ports (interfaces). Infrastructure provides adapters. Application orchestrates domain objects. Bounded contexts communicate through application services or domain ports — never through direct adapter coupling.

## Convention Files

### Architecture & DDD

- [DDD Principles](./architecture/ddd-principles.md)
- [SOLID + DRY Principles](./architecture/solid-dry-principles.md)
- [File Organization](./patterns/file-organization.md)

### Backend Patterns

- [Service Patterns](./patterns/service-patterns.md)
- [Repository Patterns](./patterns/repository-patterns.md)
- [Error Handling](./patterns/error-handling.md)

### Testing & TDD

- [Testing](./patterns/testing.md)
- [TDD Practices](./patterns/tdd-practices.md)

### Cross-cutting

- [Naming Conventions](./naming-conventions.md)
- [Git Strategy](./git-strategy.md)
- [Pre-Commit Workflow](./pre-commit-workflow.md)

### Agentic Workflow

- [Agentic Workflow](./agentic/readme.md)

### Example

- [Complete Example: User Management](./examples/user-management/complete-implementation.md)
