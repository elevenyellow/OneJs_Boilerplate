## 1. Core Rule Documentation — `ddd-principles.md`

- [x] 1.1 Add "No Magic Strings" rule section to `docs/conventions/architecture/ddd-principles.md` with the per-context constants pattern (error-types, error-messages, log-scopes in `domain/constants/`)
- [x] 1.2 Consolidate the "Entities from VOs / No Primitives Rule" into a single authoritative section in `ddd-principles.md` — expand the "No Primitives Rule" table to explicitly include entity constructors, `register()`, and `reconstitute()` with ✅ and ❌ examples
- [x] 1.3 Add cross-reference note in `ddd-principles.md` pointing other docs to use this as the single source of truth

## 2. Core Rule Documentation — `error-handling.md`

- [x] 2.1 Add "No Magic Strings" rule to `docs/conventions/patterns/error-handling.md` requiring all type labels, messages, and log scopes to be named constants
- [x] 2.2 Update all code examples in `error-handling.md` to use constant references instead of inline string literals (e.g., `UserErrorTypes.CONFLICT` instead of `'Conflict'`)
- [x] 2.3 Add the `domain/constants/` folder pattern documentation to `error-handling.md` with concrete examples

## 3. Testing Conventions — `testing.md`

- [x] 3.1 Rewrite the "Mocks Policy" section in `docs/conventions/patterns/testing.md`: unit tests use zero mocks/stubs/spies; tests requiring mocks are integration tests (`*.integration.test.ts`)
- [x] 3.2 Update all code examples in `testing.md` to use `InMemoryEventBus` and `SilentLogger` instead of stubs
- [x] 3.3 Add "No Magic Strings" rule to the testing conventions in `testing.md`

## 4. Testing Conventions — `tdd-practices.md`

- [x] 4.1 Add note in `docs/conventions/patterns/tdd-practices.md` referencing the no-mocks policy for application layer tests
- [x] 4.2 Update the "Inside-Out Development" section to mention using `InMemoryEventBus` and `SilentLogger` for application service tests

## 5. Service Patterns — `service-patterns.md`

- [x] 5.1 Update the "Testing Patterns" section in `docs/conventions/patterns/service-patterns.md` to use `InMemoryEventBus` and `SilentLogger` instead of `stubEventBus()` and `stubLogger()`
- [x] 5.2 Add cross-reference to `ddd-principles.md` as the authoritative source for the "No primitives as parameters" rule (remove duplicate rule text)

## 6. Root Conventions — `AGENTS.md` and `readme.md`

- [x] 6.1 Add "No Magic Strings" to the Operational Defaults in `AGENTS.md`
- [x] 6.2 Strengthen "Entities are built from VOs" in `AGENTS.md` with cross-reference to `ddd-principles.md`
- [x] 6.3 Add "Unit tests have zero mocks — use InMemory fakes or real implementations only" to `AGENTS.md`
- [x] 6.4 Update Core Rules in `docs/conventions/readme.md` to include the three reinforced rules

## 7. Example File — `complete-implementation.md`

- [x] 7.1 Update the application service test example in `docs/conventions/examples/user-management/complete-implementation.md` to use `InMemoryEventBus` and `SilentLogger` instead of `stubEventBus()` and `stubLogger()`
- [x] 7.2 Add error constants example (`domain/constants/error-types.ts`, `domain/constants/error-messages.ts`, `domain/constants/log-scopes.ts`) to the example's domain layer section

## 8. Agent Prompts — Code Reviewer

- [x] 8.1 Add "No Magic Strings" check to `.agents/agents/code-reviewer.md`: flag inline string literals in `OneJsError` type/message args and `logger` scope args
- [x] 8.2 Strengthen the "Entities built from VOs" check in `code-reviewer.md` to explicitly cover constructors, `register()`, and `reconstitute()`

## 9. Agent Prompts — Architecture Reviewer

- [x] 9.1 Add "No Magic Strings" check to `.agents/agents/architecture-reviewer.md`
- [x] 9.2 Strengthen "No primitives as parameters" check in `architecture-reviewer.md` to cover entity constructors and all factory methods

## 10. Agent Prompts — Tests Reviewer

- [x] 10.1 Add "No mocks in unit tests" check to `.agents/agents/tests-reviewer.md`: flag `mock()`, `spyOn()`, hand-rolled stubs in `tests/unit/` files
- [x] 10.2 Add "Magic strings in tests" check to `tests-reviewer.md`: flag inline string literals used as error messages or domain values in assertions

## 11. Skill Files — Guidelines

- [x] 11.1 Add "No Magic Strings" rule to `.agents/skills/guidelines/design-principles/SKILL.md`
- [x] 11.2 Consolidate "No primitives" rule reference in `.agents/skills/guidelines/hexagonal-architecture/SKILL.md` to point to `ddd-principles.md` as authoritative source
- [x] 11.3 Update mocks policy in `.agents/skills/guidelines/testing-standards/SKILL.md`: unit tests = zero mocks, mocks = integration tests

## 12. Skill Files — Task Skills

- [x] 12.1 Add "No Magic Strings" check reference to `.agents/skills/task-code-review/SKILL.md`
- [x] 12.2 Add "No Magic Strings" check reference to `.agents/skills/task-architecture-review/SKILL.md`
- [x] 12.3 Align `.agents/skills/task-tests-review/SKILL.md` with the new no-mocks-in-unit-tests policy

## 13. Final Validation

- [x] 13.1 Run `bun run lint:fix` — ensure all changed files pass linting
- [x] 13.2 Run `bun run typecheck` — ensure no type errors from changes (no TS changed — markdown/docs only)
- [x] 13.3 Run `bun test` — all existing test failures are pre-existing (missing deps: uuid, elysia, jsonwebtoken). No regressions from this change.
- [x] 13.4 Commit all changes with conventional commit message
