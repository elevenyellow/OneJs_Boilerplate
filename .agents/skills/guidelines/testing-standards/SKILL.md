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

**Prefer real implementations and InMemory fakes over mocks.**

- InMemory adapters live in `infrastructure/` next to the production adapter (e.g. `infrastructure/repositories/user-in-memory.repository.ts`).
- Use `mock()` only for external boundaries that cannot run in-process (third-party HTTP, push notifications).
- Never mock a type you own when you can write an InMemory implementation — owned fakes stay in sync at compile time.

## FIRST

**F**ast (sub-second unit tests), **I**ndependent (no shared mutable state), **R**epeatable (seed randomness and clocks), **S**elf-validating (assertions, not `console.log`), **T**imely (test before code — see `tdd-practices`).

## Integration tests

- Use `InMemoryUserRepository` (and equivalent per context) for all service and domain tests — instantiate fresh per `beforeEach`, no DB needed.
- Real Postgres via `bun run dbs` (docker-compose) only for full e2e tests if needed.
- `bun run db:sync` before running against a fresh schema.
- Reset state with `beforeEach` cleanup (e.g., `await prisma.user.deleteMany()`).

## What not to do

- No `any` casting in test setup.
- No `skip` / `only` committed — they silently reduce coverage.
- No "tests the mock" tests — if removing production code keeps the test green, rewrite it.
- No snapshot tests unless the output is genuinely stable.

→ Canonical reference: [docs/conventions/patterns/testing.md](../../../../docs/conventions/patterns/testing.md)
