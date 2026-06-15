# Design: Align test location conventions across documentation

## Overview

This change aligns three contradictory documentation sources to establish a single, consistent test location convention. It also modernizes stack references (MongoDB → Prisma/PGlite) and adds canonical examples.

## Test location convention (final decision)

```
packages/<context>/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── value-objects/
│   │   └── email.vo.ts
│   └── repositories/
│       └── user-repository.ts          ← port (interface)
├── application/
│   ├── user-creator.service.ts
│   └── user-creator.dto.ts
├── infrastructure/
│   └── repositories/
│       ├── user-prisma.repository.ts   ← production adapter
│       └── user-in-memory.repository.ts ← test fake (lives here for reusability)
│
└── tests/                               ← ALL tests here
    ├── unit/
    │   ├── domain/
    │   │   └── entities/
    │   │       └── user.entity.test.ts
    │   └── application/
    │       └── user-creator.service.test.ts
    │           (uses user-in-memory.repository from ../infrastructure/)
    │
    ├── integration/
    │   └── infrastructure/
    │       └── repositories/
    │           └── user-prisma.repository.integration.test.ts
    │               (uses createTestPrisma() from @dfs/database/testing)
    │
    └── e2e/
        └── user-creation.e2e.test.ts
            (hits apps/api HTTP endpoints)
```

### Key decisions

1. **Tests in dedicated folder**: `tests/{unit,integration,e2e}/` mirroring source structure
2. **InMemory fakes in `infrastructure/`**: Next to production adapters for:
   - Reusability across packages (other contexts can import them)
   - Compile-time safety (TypeScript catches interface changes)
   - Consistency with "adapters live in infrastructure" principle
3. **Frontend exception**: React component tests (`.test.tsx`) can stay co-located per community convention (documented but not enforced)
4. **File naming**:
   - Unit: `<name>.test.ts`
   - Integration: `<name>.integration.test.ts`
   - E2E: `<name>.e2e.test.ts`

## Documentation changes

### 1. AGENTS.md

**Current state**: Already correct (mentions `tests/{unit,integration,e2e}/`)

**Action**: Verify wording is clear, add explicit note about InMemory repository location

**Changes**:
```diff
  - Tests live in `tests/{unit,integration,e2e}/` inside each package, mirroring the source layout
+ - InMemory repository fakes live in `infrastructure/` next to production adapters for reusability
+ - Integration tests use PGlite in-memory via `createTestPrisma()` from `@dfs/database/testing`
```

### 2. .agents/skills/guidelines/testing-standards/SKILL.md

**Current state**: Contradicts AGENTS.md — says tests go "next to source"

**Action**: Complete rewrite of "Test location" section

**New content**:
```markdown
## Test location

Tests live in a dedicated `tests/` folder inside each package, organized by type and mirroring source structure:

- **Unit tests**: `tests/unit/` mirroring package layout
  - Domain: `tests/unit/domain/<name>.test.ts`
  - Application: `tests/unit/application/<name>.test.ts`
- **Integration tests**: `tests/integration/` mirroring package layout
  - File naming: `<name>.integration.test.ts`
  - Typically in `tests/integration/infrastructure/` for repository/adapter tests
- **E2E tests**: `tests/e2e/<flow-name>.e2e.test.ts`

**InMemory repository fakes**: Live in `infrastructure/` next to production adapters (e.g., `user-in-memory.repository.ts` next to `user-prisma.repository.ts`). This enables:
- Reusability across packages
- Compile-time safety when interfaces change
- Consistency with hexagonal architecture (adapters in infrastructure)

**Frontend exception**: React component tests (`.test.tsx`) may stay co-located with components per community convention, but backend tests follow the `tests/` folder structure.
```

### 3. docs/conventions/patterns/testing.md

**Current state**: 
- Correct structure (`tests/{unit,integration,e2e}/`)
- Outdated stack references (MongoDB, mongodb-memory-server)
- No mention of InMemory repository location

**Action**: 
1. Replace all MongoDB references with Prisma/PGlite
2. Add InMemory repository guidance
3. Update integration test example to use PGlite

**Key changes**:

#### Section: "Integration Tests > Database Setup"

**Before**:
```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('The MongoOrderRepository', () => {
  let mongoServer: MongoMemoryServer;
  let connection: MongoClient;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    connection = await MongoClient.connect(mongoServer.getUri());
  });
  // ...
});
```

**After**:
```typescript
import { createTestPrisma } from '@dfs/database/testing';
import type { PrismaClient } from '@prisma/client';

describe('The UserPrismaRepository', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await createTestPrisma();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean tables between tests
    await prisma.user.deleteMany();
  });

  it('persists and retrieves a user', async () => {
    const repository = new UserPrismaRepository(prisma);
    const user = User.create({ email: Email.create('test@example.com') });

    await repository.save(user);
    const retrieved = await repository.findByEmail(user.email);

    expect(retrieved?.id.equals(user.id)).toBe(true);
  });
});
```

#### New section: "InMemory Repository Fakes"

```markdown
## InMemory Repository Fakes

InMemory implementations of repository ports live in `infrastructure/` next to production adapters:

```
infrastructure/
  repositories/
    user-prisma.repository.ts      ← production
    user-in-memory.repository.ts   ← test fake
```

**Why in infrastructure/ not tests/?**
- Reusable across packages (other bounded contexts can import for their tests)
- Compile-time safety: TypeScript catches interface changes immediately
- Consistency: adapters belong in infrastructure layer

**Example**:
```typescript
// infrastructure/repositories/user-in-memory.repository.ts
export class UserInMemoryRepository implements UserRepository {
  private users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.id.value, user);
  }

  async findByEmail(email: Email): Promise<User | null> {
    return Array.from(this.users.values())
      .find(u => u.email.equals(email)) ?? null;
  }

  // Test helper (not on interface)
  clear(): void {
    this.users.clear();
  }
}
```

Used in application service tests:
```typescript
// tests/unit/application/user-creator.service.test.ts
import { UserInMemoryRepository } from '../../../infrastructure/repositories/user-in-memory.repository';

describe('The UserCreator', () => {
  let repository: UserInMemoryRepository;
  let service: UserCreator;

  beforeEach(() => {
    repository = new UserInMemoryRepository();
    service = new UserCreator(repository);
  });

  it('creates a user with valid email', async () => {
    const dto = { email: 'test@example.com' };

    await service.run(dto);

    const saved = await repository.findByEmail(Email.create(dto.email));
    expect(saved).toBeDefined();
  });
});
```
```

#### Update "Rules" section

**Add**:
- **InMemory fakes**: Use for application service tests; live in `src/infrastructure/`
- **Real database**: Use PGlite via `createTestPrisma()` for repository integration tests
- **Never mock Prisma directly**: Use PGlite for real database behavior

## Canonical examples in packages/users

Add three reference tests to serve as living documentation:

### 1. Entity unit test

**File**: `packages/users/tests/unit/domain/user.entity.test.ts`

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { User } from '../../../src/domain/user.entity';
import { Email } from '../../../src/domain/email.vo';
import { Id } from '@dfs/common';

describe('The User entity', () => {
  test('creates a user with valid email', () => {
    const email = Email.create('test@example.com');

    const user = User.create({ email });

    expect(user.email.equals(email)).toBe(true);
    expect(user.id).toBeInstanceOf(Id);
  });

  test('does not allow changing email directly', () => {
    const user = User.create({ email: Email.create('old@example.com') });
    const newEmail = Email.create('new@example.com');

    user.updateEmail(newEmail);

    expect(user.email.equals(newEmail)).toBe(true);
  });
});
```

### 2. Application service unit test with InMemory repository

**File**: `packages/users/tests/unit/application/user-creator.service.test.ts`

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { UserCreator } from '../../../src/application/user-creator.service';
import { UserInMemoryRepository } from '../../../src/infrastructure/user-in-memory.repository';
import { Email } from '../../../src/domain/email.vo';
import { ConflictError } from '@dfs/common';

describe('The UserCreator', () => {
  let repository: UserInMemoryRepository;
  let service: UserCreator;

  beforeEach(() => {
    repository = new UserInMemoryRepository();
    service = new UserCreator(repository);
  });

  test('creates a user with valid email', async () => {
    const dto = { email: 'test@example.com' };

    const result = await service.run(dto);

    expect(result.email).toBe(dto.email);
    const saved = await repository.findByEmail(Email.create(dto.email));
    expect(saved).toBeDefined();
  });

  test('does not allow duplicate emails', async () => {
    const dto = { email: 'duplicate@example.com' };
    await service.run(dto);

    await expect(service.run(dto)).rejects.toThrow(ConflictError);
  });
});
```

### 3. Repository integration test with PGlite

**File**: `packages/users/tests/integration/infrastructure/user-prisma.repository.integration.test.ts`

```typescript
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { createTestPrisma } from '@dfs/database/testing';
import type { PrismaClient } from '@prisma/client';
import { UserPrismaRepository } from '../../../src/infrastructure/user-prisma.repository';
import { User } from '../../../src/domain/user.entity';
import { Email } from '../../../src/domain/email.vo';

describe('The UserPrismaRepository', () => {
  let prisma: PrismaClient;
  let repository: UserPrismaRepository;

  beforeAll(async () => {
    prisma = await createTestPrisma();
    repository = new UserPrismaRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  test('persists and retrieves a user', async () => {
    const user = User.create({ email: Email.create('test@example.com') });

    await repository.save(user);
    const retrieved = await repository.findByEmail(user.email);

    expect(retrieved?.id.equals(user.id)).toBe(true);
    expect(retrieved?.email.equals(user.email)).toBe(true);
  });

  test('returns null when user not found', async () => {
    const email = Email.create('nonexistent@example.com');

    const result = await repository.findByEmail(email);

    expect(result).toBeNull();
  });
});
```

## bunfig.toml verification

**Current test discovery pattern** (assumed):
```toml
[test]
preload = ["./tests/setup.ts"]
```

**Action**: Verify that `bun test` discovers tests in `tests/**/*.test.ts` pattern. If not, update:

```toml
[test]
preload = ["./tests/setup.ts"]
# Bun auto-discovers *.test.ts, *.integration.test.ts, *.e2e.test.ts
# No explicit pattern needed unless overriding
```

Run `bun test --dry-run` to verify discovery before and after changes.

## Implementation notes

### InMemory repository implementation

If `UserInMemoryRepository` doesn't exist yet, create it:

**File**: `packages/users/infrastructure/repositories/user-in-memory.repository.ts`

```typescript
import type { UserRepository } from '../../domain/repositories/user-repository';
import type { User } from '../../domain/entities/user.entity';
import type { Email, Uuid } from '@dfs/common/domain';

export class UserInMemoryRepository implements UserRepository {
  private users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.id.value, user);
  }

  async findById(id: Uuid): Promise<User | undefined> {
    return this.users.get(id.value);
  }

  async findByEmail(email: Email): Promise<User | undefined> {
    return Array.from(this.users.values())
      .find(u => u.email?.equals(email));
  }

  async delete(id: Uuid): Promise<void> {
    this.users.delete(id.value);
  }

  async findForTable(): Promise<any> {
    // Minimal implementation for interface compliance
    return { data: Array.from(this.users.values()), total: this.users.size };
  }

  // Test helper (not on interface)
  clear(): void {
    this.users.clear();
  }
}
```

### Entity/Service implementation

If `User`, `Email`, `UserCreator` don't exist or are incomplete, implement minimal versions following DDD conventions (rich domain model, constructor injection, `run()` entry point).

## Edge cases

| Case | Behavior |
|---|---|
| Frontend component tests | Document as exception: can stay co-located per React conventions |
| Shared test utilities | Live in `tests/helpers/` or `tests/fixtures/` |
| Test setup files | `tests/setup.ts` for global test configuration |
| Cross-package InMemory imports | Allowed and encouraged (e.g., `@dfs/users/infrastructure/repositories/user-in-memory.repository`) |
| Existing tests in wrong location | Not migrated automatically; convention applies to new tests only |

## Validation

1. All three docs (AGENTS.md, SKILL, testing.md) say the same thing
2. `bun test` discovers and runs all new tests
3. No TypeScript errors
4. No lint errors
5. Agent test: ask agent to "add tests for X" → should create in `tests/` folder
