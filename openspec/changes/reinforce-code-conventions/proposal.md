## Why

The current conventions are inconsistently enforced across the codebase. Magic strings litter error handling (type labels, messages, log scopes), entity construction rules are duplicated across multiple docs with no single authoritative source, and the testing policy tolerates stubs/spies in unit tests — blurring the line between unit and integration tests. This leads to code that is harder to refactor, review, and maintain.

We need a single, reinforced set of rules that all agents and developers follow, with explicit checks in the reviewer agents to catch violations automatically.

## What Changes

1. **No Magic Strings** — Every error type label, error message, log scope, and domain constant value must be a named constant, enum, or static property. Each bounded context defines its own constants. Reviewers will flag violations.

2. **Entities Built from VOs (Consolidated)** — The existing "no primitives as parameters" rule is consolidated into a single authoritative source. All entity constructors and `register()` factories receive VOs exclusively; `reconstitute()` is the sole exception (persistence boundary). **BREAKING**: The rule is now enforced by all reviewer agents.

3. **Unit Tests Without Mocks** — Zero mocks, stubs, or spies in unit tests (`*.test.ts`). Dependencies use real implementations or InMemory fakes (InMemoryEventBus, SilentLogger — both exist in the framework). Any test requiring mocks/stubs/spies must be an integration test (`*.integration.test.ts`). **BREAKING**: Existing unit tests with stubs must either migrate to InMemory fakes or be reclassified as integration tests.

4. **Convention Documents Updated** — ~17 files modified across `docs/conventions/`, `.agents/agents/`, and `.agents/skills/guidelines/` to reflect the three rules consistently.

## Capabilities

### New Capabilities

- `no-magic-strings`: Rules and reviewer checks enforcing that error type labels, error messages, log scopes, and domain values are defined as named constants per bounded context, never as inline string literals.
- `entity-vo-construction`: Consolidated rule that entity constructors and `register()` factories receive only Value Objects (never primitives), with `reconstitute()` as the sole exception. Enforced by all reviewer agents.
- `unit-test-no-mocks`: Policy that unit tests (`*.test.ts`) use zero mocks/stubs/spies — only real implementations or InMemory fakes. Tests requiring mocks are reclassified as integration tests (`*.integration.test.ts`).

### Modified Capabilities

*(No existing specs are being modified — this change introduces new convention rules, not feature-level behavior changes.)*

## Impact

- **docs/conventions/** — 7+ files modified (testing.md, ddd-principles.md, error-handling.md, service-patterns.md, tdd-practices.md, readme.md, complete-implementation.md)
- **.agents/agents/** — 3 files modified (code-reviewer.md, architecture-reviewer.md, tests-reviewer.md)
- **.agents/skills/guidelines/** — 3 files modified (testing-standards, design-principles, hexagonal-architecture)
- **.agents/skills/** — 3 files modified (task-tests-review, task-code-review, task-architecture-review)
- **AGENTS.md** — root conventions updated
- **All packages/** — eventual cleanup of existing magic strings as part of implementation tasks
- No runtime dependencies or API changes
