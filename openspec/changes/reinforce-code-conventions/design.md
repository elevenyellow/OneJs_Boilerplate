## Context

The project has ~17 files across `docs/conventions/`, `.agents/agents/`, and `.agents/skills/` that define coding rules. Currently:

- **Magic strings**: `OneJsError` type labels (`'Conflict'`, `'Validation failed'`, `'Not Found'`), error messages, and log scopes are inline string literals scattered across all bounded contexts. No convention defines how to centralize them.
- **Entity construction from VOs**: The rule exists in multiple docs (`AGENTS.md`, `ddd-principles.md`, `service-patterns.md`, `hexagonal-architecture/SKILL.md`) with slightly different wording. No single authoritative source. Reviewers check it inconsistently.
- **Mocks in unit tests**: The testing docs allow "stubs and spies on application ports." Example tests use `stubEventBus()` and `stubLogger()`. The line between unit and integration tests is blurry.

The codebase has InMemoryEventBus and SilentLogger already available in the framework, so the migration path for removing stubs from unit tests is clear.

## Goals / Non-Goals

**Goals:**

- Define and document the "No Magic Strings" rule with per-context constant pattern
- Consolidate the "Entities from VOs" rule into a single authoritative source in `ddd-principles.md`, referenced by all other docs
- Redefine the mocks policy: unit tests = zero mocks/stubs/spies; mocks = integration test
- Update all 17 convention files and agent prompts to reflect the three rules consistently
- Add explicit checks in `code-reviewer`, `architecture-reviewer`, and `tests-reviewer` agents
- Provide concrete migration examples in the updated docs

**Non-Goals:**

- Rewriting existing production code to eliminate magic strings — that is a separate cleanup task
- Creating new InMemory fakes (InMemoryEventBus and SilentLogger already exist)
- Changing the DI framework, testing framework, or build system
- Adding Biome lint rules or custom ESLint plugins — enforcement is via agent reviewers

## Decisions

### Decision 1: Per-context error constants vs. global enum

**Chosen: Each bounded context defines its own constants.**

- Each `packages/<context>/domain/constants/` folder holds `error-types.ts`, `error-messages.ts`, `log-scopes.ts`
- This aligns with DDD — each bounded context owns its ubiquitous language
- Avoids a single monolithic enum that every context must import
- Pattern: static classes with readonly properties (consistent with VO pattern)

```typescript
// packages/user/domain/constants/error-types.ts
export class UserErrorTypes {
  static readonly CONFLICT = 'Conflict'
  static readonly VALIDATION_FAILED = 'Validation failed'
  static readonly NOT_FOUND = 'Not Found'
  static readonly UNAUTHORIZED = 'Unauthorized'
  static readonly BAD_REQUEST = 'Bad Request'
}

// packages/user/domain/constants/error-messages.ts
export class UserErrorMessages {
  static readonly EMAIL_IN_USE = 'Email already in use'
  static readonly USER_NOT_FOUND = 'User not found'
  static readonly INVALID_EMAIL = 'Invalid email format'
  static readonly EMAIL_REQUIRED = 'Email is required'
  // ...
}

// packages/user/domain/constants/log-scopes.ts
export class UserLogScopes {
  static readonly SERVICE = 'user:service'
  static readonly CONTROLLER = 'user:controller'
  static readonly REPOSITORY = 'user:repository'
}
```

**Alternatives considered:**
- *Global `@OneJs/core` ErrorType enum* — rejected because it couples all contexts to a single package and violates bounded context autonomy
- *Inline literals (status quo)* — rejected because it's the problem we're solving

### Decision 2: Single authoritative source for "Entities from VOs"

**Chosen: `docs/conventions/architecture/ddd-principles.md` is the single source of truth.**

- All other docs (`AGENTS.md`, `service-patterns.md`, skill files) will reference this document instead of re-stating the rule
- The "No Primitives Rule" table in `ddd-principles.md` (lines 338-355) is expanded to include explicit "✅ Entity constructor" and "❌ Entity constructor" examples
- Reviewer agents reference this document directly

### Decision 3: Unit test classification

**Chosen: Zero mocks/stubs/spies in `tests/unit/`. Stubs/mocks → `tests/integration/`.**

- `InMemoryEventBus` (already in framework) replaces `stubEventBus()`
- `SilentLogger` (already in framework) replaces `stubLogger()`
- The test example in `service-patterns.md` and `complete-implementation.md` is updated to use these real implementations
- The Mock Policy section in `testing.md` is rewritten to remove all exceptions for stubs/spies in unit tests
- The `tests-reviewer` agent gains explicit checks: flags any `mock()`, `stub`, `spy`, or hand-rolled stub in `tests/unit/` files

```typescript
// ✅ Unit test — no mocks
import { InMemoryEventBus } from '@OneJs/event-bus'
import { SilentLogger } from '@OneJs/core'

describe('The UserCreator', () => {
  let repository: InMemoryUserRepository
  let eventBus: InMemoryEventBus
  let logger: SilentLogger

  beforeEach(() => {
    repository = new InMemoryUserRepository()
    eventBus = new InMemoryEventBus()
    logger = new SilentLogger()
  })

  it('creates a user with valid email', async () => {
    const service = new UserCreator(repository, eventBus, logger)
    const email = Email.create('user@example.com')
    const hash = PasswordHash.create('hashed_pw')
    const user = await service.run(email, hash)
    expect(user.email.getValue()).toBe('user@example.com')
  })
})
```

## Risks / Trade-offs

- **[Risk] Existing unit tests with stubs will break** → Mitigation: they are explicitly listed as tasks; each is migrated to InMemory fakes or reclassified as `*.integration.test.ts`
- **[Risk] Per-context constants could diverge** → Mitigation: the pattern (static class, `domain/constants/` folder) is documented in the convention; reviewers check that constants are used instead of magic strings
- **[Risk] Agent reviewers may not catch all magic strings** → Mitigation: the check is added to `code-reviewer` and `architecture-reviewer` prompts; false negatives are acceptable as long as the convention is clear
- **[Trade-off] No Biome/ESLint rule for magic strings** → Biome has no built-in rule for this pattern; a custom plugin would be expensive to maintain. Agent-level enforcement is the pragmatic choice.
