# Testing Standards

## Test Pyramid

```
        /\
       /  \      E2E (few)
      /----\     - Full HTTP flows
     /      \    - Critical paths only
    /--------\   Integration (some)
   /          \  - Repository adapters
  /------------\ - External service adapters
 /              \
/----------------\ Unit (many)
                   - Domain entities, VOs, services
                   - UseCases with InMemoryRepositories
```

- **More unit tests**: Fast, isolated, cover all edge cases
- **Some integration tests**: Real DB, real sandboxes
- **Few E2E tests**: Critical user journeys only

## Test Location

Tests live in a dedicated `tests/` folder inside each package, organized by type and mirroring source structure:

```
packages/[context]/
├── domain/
├── application/
├── infrastructure/
└── tests/
    ├── unit/              # Fast, no external dependencies
    ├── integration/       # Real DB (PGlite in-memory)
    └── e2e/               # Full HTTP stack
```

**Structure details**:
- **Unit tests**: `tests/unit/` mirroring package layout
  - Domain: `tests/unit/domain/<name>.test.ts`
  - Application: `tests/unit/application/<name>.test.ts`
- **Integration tests**: `tests/integration/` mirroring package layout
  - File naming: `<name>.integration.test.ts`
  - Typically in `tests/integration/infrastructure/` for repository/adapter tests
- **E2E tests**: `tests/e2e/<flow-name>.e2e.test.ts`

## Parallelization

- **Unit tests**: Always run in parallel
- **Integration tests**: Run in parallel with isolated DB instances
- **E2E tests**: Run sequentially or with isolated test databases

## FIRST Principles

- **Fast**: Tests must run quickly. Slow tests break the feedback loop
- **Isolated**: Each test is independent. No shared state, no execution order dependency
- **Repeatable**: Same result every time, in any environment
- **Self-validating**: Clear pass/fail result. No manual inspection needed
- **Timely**: Written at the right time (before code in TDD)

## Naming

- Names in English
- Represent business rules, not implementation details
- Descriptive: what is being tested and what is expected
- Avoid technical names or names coupled to implementation

### Describe blocks
- Use "The [Subject]" format to identify the component/module being tested

### Test cases (it/test)
- Write tests as business rules, not technical assertions
- Avoid technical verbs: "returns", "should return", "calls", "throws"
- Use domain language: "considers", "validates", "accepts", "allows", "calculates"

```typescript
describe('The Invoice Calculator', () => {
  it('applies a 10% discount for orders above 100', () => { ... });
  it('does not allow negative quantities', () => { ... });
});
```

## AAA Structure (Arrange-Act-Assert)

- **Arrange**: Prepare context and necessary data
- **Act**: Execute the action to test
- **Assert**: Verify the expected result
- Visually separate the three sections (blank line between them)

## Mocks Policy

- Use InMemoryRepositories for application service tests (see `guidelines/hexagonal-architecture`)
- InMemory repository fakes live in `infrastructure/` next to production adapters for reusability across packages
- Stubs and spies are allowed on application ports (EmailSender, TokenGenerator, OTPGenerator)
- Never use mocks on repositories — always use InMemory implementations
- Before proposing any other mock: consult the Tech Lead first

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

  async findByEmail(email: Email): Promise<User | undefined> {
    return Array.from(this.users.values())
      .find(u => u.email?.equals(email));
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
## Examples

```typescript
// WORSE - Coupled to implementation
test('calculatePrice returns 90', () => {
  const result = calculatePrice(100, 10);
  expect(result).toBe(90);
});

// BETTER - Describes business rule
test('calculates price with discount applied to given product', () => {
  const originalPrice = 100;
  const discountPercentage = 10;

  const finalPrice = calculateDiscountedPrice(originalPrice, discountPercentage);

  expect(finalPrice).toBe(90);
});
```

## Integration Tests

### When to Use
- Repository adapters (real DB)
- External service adapters (real sandbox)

### InMemory Repository Setup

Integration tests for the domain use the **InMemory repository adapter** — no real database needed:

```typescript
import { describe, beforeEach, it, expect } from 'bun:test';
import { InMemoryUserRepository } from '../../../infrastructure/repositories/in-memory-user.repository';
import { User } from '../../../domain/entities/user';
import { Email } from '../../../domain/value-objects/email';
import { PasswordHash } from '../../../domain/value-objects/password-hash';

describe('The InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();  // fresh store each test
  });

  it('persists and retrieves a user by email', async () => {
    const email = Email.create('test@example.com');
    const user = User.register(email, PasswordHash.create('hash'));

    await repository.save(user);
    const found = await repository.findByEmail(email);

    expect(found).not.toBeNull();
    expect(found!.email.getValue()).toBe('test@example.com');
  });
});
```

### Prisma Integration Tests (production adapter only)

When testing the Prisma adapter, use an isolated Prisma client configured for a test database:

```typescript
import { describe, beforeEach, afterAll, it, expect } from 'bun:test';
// Configure a test PrismaClient pointed at a test DB or SQLite

describe('The UserPrismaRepository', () => {
  it('persists and retrieves a user', async () => {
    const user = User.register(Email.create('test@example.com'), PasswordHash.create('hash'));
    await repository.save(user);
    const found = await repository.findByEmail(Email.create('test@example.com'));
    expect(found).not.toBeNull();
  });
});
```

### Rules
- **InMemory for unit/integration**: Use `InMemoryUserRepository` for all service and domain tests
- **Prisma adapter tests**: Only when testing the Prisma adapter itself, with an isolated test DB
- **Isolation**: Each test gets a fresh `InMemoryUserRepository` instance (no shared state)
- **File naming**: `*.integration.test.ts`

## E2E Tests

### When to Use
- Full HTTP flows through the API
- Critical user journeys

### Rules
- **Test flows, not endpoints**: Cover complete business scenarios
- **Factories/fixtures**: Use factories to create test data
- **Clean slate**: Reset database before each test
- **File naming**: `*.e2e.test.ts`

### What NOT to Test in E2E
- Edge cases (those belong in unit tests)
- Error handling details (unit tests)
- All validation combinations (unit tests)
