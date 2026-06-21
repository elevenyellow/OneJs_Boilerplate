# File Organization Patterns

This document outlines how files should be organized within the monorepo structure.

## Package Structure

### Standard Bounded Context Layout

```
packages/[context]/
├── domain/                           # Core business logic layer
│   ├── entities/                    # Domain entities and aggregates
│   │   └── [entity].ts              # EntityBase<TId> subclass
│   ├── value-objects/               # Value objects
│   │   └── [concept].ts             # ValueObjectBase<T> subclass
│   ├── repositories/                # Repository interfaces (ports)
│   │   └── [entity].repository.interface.ts  # I[Entity]Repository
│   ├── events/                      # Domain events
│   │   └── [entity]-[action].event.ts
│   └── index.ts                     # Domain layer exports
├── application/                      # Use cases and application logic
│   └── [entity]/                    # Group by entity
│       ├── [entity]-[action].service.ts  # Use case — single run() entry point
│       └── index.ts                 # Application exports
├── dtos/                             # DTOs (persistence boundary only)
│   └── [entity].dto.ts
├── infrastructure/                   # External concerns (adapters)
│   ├── repositories/               # Repository implementations
│   │   ├── in-memory-[entity].repository.ts   # InMemory fake
│   │   └── [entity]-prisma.repository.ts      # Prisma adapter
│   ├── controllers/                # HTTP controllers (Elysia)
│   │   └── [entity].controller.ts
│   └── index.ts                    # Infrastructure exports
├── tests/                           # Tests grouped by type
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json                    # Package configuration
├── tsconfig.json                   # TypeScript configuration
└── index.ts                        # Public API exports
```

### Shared events / integration events

Cross-context communication goes through the `shared/` package (integration events), never through direct adapter coupling.

## File Naming Patterns

### Domain Layer
- **Entities**: `user.ts`, `order.ts` (singular, lowercase — no `.entity.ts` suffix)
- **Value Objects**: `email.ts`, `user-id.ts`, `user-role.ts` (no `.vo.ts` suffix)
- **Repository interfaces**: `user.repository.interface.ts`
- **Domain Services**: `user-validator.service.ts`, `price-calculator.service.ts`
- **Events**: `user-registered.event.ts`, `password-changed.event.ts`

### Application Layer
- **Use Case Services**: `user-creator.service.ts`, `user.service.ts`
- **DTOs**: `user.dto.ts` (persistence boundary only)

### Infrastructure Layer
- **Repository Implementations**: `in-memory-user.repository.ts`, `user-prisma.repository.ts`
- **Controllers**: `auth.controller.ts`
- **No factory files** — use `@Injectable()` / `@Inject()` DI

## Directory Organization Rules

### 1. Group by Layer First, Then by Concept

```
✅ Good
packages/users/
├── domain/
│   ├── entities/
│   └── services/
├── application/
│   └── user/
└── infrastructure/

❌ Bad
packages/users/
├── user/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
```

### 2. Separate Concerns Within Layers

```
✅ Good
domain/
├── entities/          # Core business objects
├── repositories/      # Data access contracts
├── services/         # Domain business logic
└── events/           # Domain events

❌ Bad
domain/
├── user.ts
├── user.repository.ts
├── user.service.ts
└── user.event.ts
```

### 3. Application Layer Grouped by Entity/Use Case

```
✅ Good
application/
├── user/
│   ├── user-creator.service.ts
│   ├── user-updater.service.ts
│   └── user-finder.service.ts
└── profile/
    ├── profile-creator.service.ts
    └── profile-updater.service.ts

❌ Bad
application/
├── user-creator.service.ts
├── user-updater.service.ts
├── profile-creator.service.ts
└── profile-updater.service.ts
```

## Import Organization

### Import Order

```typescript
// 1. Node.js built-ins
import { readFile } from 'fs/promises'

// 2. External libraries
import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'

// 3. OneJs framework
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'

// 4. Same package imports (domain → application → infrastructure)
import type { User } from '../../domain/entities/user'
import type { UserRepository } from '../../domain/repositories/user.repository'

// 5. Relative imports (same layer)
import { UserValidator } from './user-validator.service'
```

### Path Aliases

Configure TypeScript path mapping in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@user/*": ["./packages/user/index.ts"],
      "@/domain/*": ["./domain/*"],
      "@/application/*": ["./application/*"],
      "@/infrastructure/*": ["./infrastructure/*"]
    }
  }
}
```

## Index Files

### Package Public API (`index.ts`)

```typescript
// packages/users/index.ts
// Only export what should be used by other packages

// Domain exports (stable contracts)
export { User } from './domain/entities/user'
export { UserRole } from './domain/entities/user-role'
export type { UserRepository } from './domain/repositories/user.repository'

// Application exports (use cases)
export { UserCreator } from './application/user/user-creator.service'
export { UserFinder } from './application/user/user-finder.service'
export type { CreateUserInput } from './application/user/user-creator.service'

// Don't export internal implementation details
// ❌ export { InMemoryUserRepository } from './infrastructure/repositories/in-memory-user.repository'
// ❌ export { UserValidator } from './domain/services/user-validator.service'
```

### Layer Index Files

```typescript
// domain/index.ts
export { User } from './entities/user'
export { UserRole } from './entities/user-role'
export type { UserRepository } from './repositories/user.repository'
export { UserValidator } from './services/user-validator.service'

// application/index.ts
export { UserCreator } from './user/user-creator.service'
export { UserFinder } from './user/user-finder.service'

// infrastructure/index.ts
export { InMemoryUserRepository } from './repositories/in-memory-user.repository'
```

## Configuration Files

### Package.json Structure

```json
{
  "name": "@myapp/user",
  "version": "1.0.0",
  "description": "User management bounded context",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "bun run tsc",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "dev": "bun --watch src/index.ts"
  },
  "dependencies": {
    "@OneJs/core": "workspace:*",
    "@OneJs/event-bus": "workspace:*"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0"
  }
}
```

### TypeScript Configuration

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "include": [
    "./**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"
  ],
  "references": [
    { "path": "../common" },
    { "path": "../database" }
  ]
}
```

## Test File Organization

Tests live in a dedicated `tests/` directory inside each package, grouped by test type — not colocated with source files. This mirrors the layering of the package itself and keeps `domain/`, `application/`, and `infrastructure/` focused on production code.

### Test Structure

```
packages/users/
├── domain/
│   ├── entities/user.ts
│   └── services/user-validator.service.ts
├── application/
│   └── user/user-creator.service.ts
├── infrastructure/
│   └── repositories/user-prisma.repository.ts
└── tests/
    ├── unit/                              # Fast, no external deps
    │   ├── domain/
    │   │   ├── entities/user.test.ts
    │   │   └── services/user-validator.service.test.ts
    │   └── application/
    │       └── user/user-creator.service.test.ts
    ├── integration/                       # Real DB via Prisma + PostgreSQL
    │   └── infrastructure/
    │       └── repositories/user-prisma.repository.integration.test.ts
    ├── e2e/                               # Full HTTP flows
    │   └── user-registration.e2e.test.ts
    ├── fixtures/                          # Factories and test data
    │   └── user.factory.ts
    ├── helpers/                           # Test utilities
    │   └── database.helper.ts
    └── setup.ts                           # Global test setup
```

The subtree under `tests/unit/`, `tests/integration/`, and `tests/e2e/` should mirror the source layout so a test's location maps 1:1 to what it covers.

### Test Naming

- **Unit Tests**: `[file-name].test.ts`
- **Integration Tests**: `[file-name].integration.test.ts`
- **End-to-End Tests**: `[feature].e2e.test.ts`

See [testing.md](./testing.md) for the full testing standard (pyramid, FIRST, AAA, test doubles policy).

## Documentation Organization

### Package Documentation

```
packages/users/
├── README.md                      # Package overview and usage
├── docs/                          # Detailed documentation
│   ├── architecture.md           # Architecture decisions
│   ├── api.md                     # API documentation
│   └── migration.md              # Migration guides
└── examples/                      # Usage examples
    ├── basic-usage.ts
    └── advanced-patterns.ts
```

## Best Practices

### File Size Guidelines
- **Entities**: Keep under 200 lines, split large aggregates
- **Services**: Single responsibility, typically 50-150 lines
- **Repositories**: Interface ~20 lines, implementation ~100-200 lines
- **Controllers**: Thin layer, typically 20-50 lines

### Dependency Direction
- Domain → No dependencies on other layers
- Application → Can depend on Domain
- Infrastructure → Can depend on Domain and Application

### Naming Consistency
- Use the same entity name throughout all layers
- Maintain consistent action verbs (`create`, `find`, `update`, `delete`)
- Follow established patterns for new files

### File Responsibilities
- One main class/interface per file
- Group related types in the same file
- Separate concerns into different files
- Keep public APIs minimal and focused

This organization ensures consistency, maintainability, and clear separation of concerns across the entire monorepo.