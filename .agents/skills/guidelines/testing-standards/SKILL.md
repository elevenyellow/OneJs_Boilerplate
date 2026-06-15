---
name: testing-standards
description: Testing rules for this monorepo — bun:test runner, AAA structure, business-oriented describe/test names, InMemory fakes over mocks, tests in dedicated tests/ folder, integration tests as *.integration.test.ts, FIRST principles. Load when writing, reviewing, or refactoring test files.
---

# Testing Standards

Short checklist. Full structure, examples, and setup live in `docs/conventions/patterns/testing.md` — go there for any detail.

## Tooling

- Import from `"bun:test"` only. Never `"jest"`, never `"vitest"`.
- Run tests with `bun test` (or `bun test <path>` for a scope).
- Coverage and timeouts live in `bunfig.toml`.

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
- Reusability across packages (other bounded contexts can import them)
- Compile-time safety when interfaces change
- Consistency with hexagonal architecture (adapters in infrastructure)

**Frontend exception**: React component tests (`.test.tsx`) may stay co-located with components per community convention, but backend tests follow the `tests/` folder structure.

## Structure and naming

- AAA — Arrange / Act / Assert, blank lines between sections.
- `describe("The [Subject]")`, `test("[business rule]")` — domain language, not technical verbs.
- One logical assertion per test (multiple fields of the same outcome is fine).

## Test doubles policy

**Unit tests (`tests/unit/`) MUST NOT use mocks, stubs, or spies of any kind.** All dependencies must be real implementations or InMemory fakes.

- InMemory adapters live in `infrastructure/` next to the production adapter (e.g. `infrastructure/repositories/user-in-memory.repository.ts`).
- Use `InMemoryEventBus` (from `@OneJs/event-bus`) instead of `{ publish: async () => {} }` stubs.
- Use `SilentLogger` (from `@OneJs/core`) instead of `{ debug: () => {} }` stubs.
- Use InMemory repositories instead of `mock(IRepository)`.
- **If a test requires mocks** (external HTTP, push notifications) → it MUST be in `tests/integration/` with `*.integration.test.ts` suffix.
- Never mock a type you own when you can write an InMemory implementation — owned fakes stay in sync at compile time.

## FIRST

**F**ast (sub-second unit tests), **I**ndependent (no shared mutable state), **R**epeatable (seed randomness and clocks), **S**elf-validating (assertions, not `console.log`), **T**imely (test before code — see `tdd-practices`).

## Integration tests

- Use `InMemoryUserRepository` (and equivalent per context) for all service and domain tests — instantiate fresh per `beforeEach`, no DB needed.
- Real Postgres via `bun run dbs` (docker-compose) only for full e2e tests if needed.
- `bun run db:sync` before running against a fresh schema.
- Reset state with `beforeEach` cleanup (e.g., `await prisma.user.deleteMany()`).

## No magic strings in tests

Test assertions MUST reuse production constants rather than duplicating error messages or domain values as inline literals.

```typescript
// ✅ Correct
import { UserErrorMessages } from '../../../domain/constants/error-messages'
expect(() => service.run(email)).toThrow(UserErrorMessages.EMAIL_IN_USE)

// ❌ Wrong
expect(() => service.run(email)).toThrow('Email already in use')
```

## What not to do

- No `any` casting in test setup.
- No `skip` / `only` committed — they silently reduce coverage.
- No "tests the mock" tests — if removing production code keeps the test green, rewrite it.
- No snapshot tests unless the output is genuinely stable.

→ Canonical reference: [docs/conventions/patterns/testing.md](../../../../docs/conventions/patterns/testing.md)
