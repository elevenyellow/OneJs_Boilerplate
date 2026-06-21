# OneJs DDD Boilerplate

Production-ready TypeScript monorepo built on the **OneJs framework**, following Domain-Driven Design with Hexagonal Architecture (Ports & Adapters).

## Quick Reference

- **Runtime**: Bun | **Language**: TypeScript (strict)
- **Framework**: OneJs (`.oneJs/`) — DI, Entity/VO base classes, EventBus, Logger, plugin system
- **API**: Bun + Elysia (`packages/user/infrastructure/controllers/`)
- **DB**: InMemory (default) / PostgreSQL + Prisma (production)
- **Linting**: Biome | **Testing**: bun test

## Framework Imports

```typescript
// Core — entities, VOs, DI, errors
import { Entity, EntityBase, ValueObject, ValueObjectBase } from '@OneJs/core'
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'

// Events
import { EventBus } from '@OneJs/event-bus'
```

## Architecture

Packages in `packages/`: each is a **bounded context** following `domain/` → `application/` → `infrastructure/`.

```
packages/<context>/
├── domain/
│   ├── entities/           # EntityBase<TId> subclasses
│   ├── value-objects/      # ValueObjectBase<T> subclasses
│   ├── repositories/       # Interface (port) definitions
│   └── events/             # Domain event classes
├── application/
│   ├── *.service.ts        # Use case services (run() entry point)
│   └── dtos/               # DTO classes (persistence boundary)
└── infrastructure/
    ├── repositories/       # InMemory + Prisma adapters
    └── controllers/        # HTTP controllers
```

## Key Conventions

- Files: `kebab-case.ts` (e.g., `user-creator.service.ts`, `email.ts`)
- Classes: `PascalCase` | Methods: `camelCase` | Service entry point: `run()`
- DI via decorators: `@Injectable()` on class, `@Inject(ConcreteClass)` on constructor params
- Ports in domain layer, adapters in infrastructure layer
- InMemory repository fakes live in `infrastructure/` next to production adapters

## Operational Defaults

- **No primitives as parameters**: service `run()` methods and repository interface methods receive VOs, entities, or aggregates — never `string`, `number`, `boolean`. VOs are created at the system boundary (controller/handler).
- **Entities are built from VOs**: constructors receive VOs; `register()` factory accepts VOs; `reconstitute()` accepts primitives only at the persistence boundary.
- **Immutable entities**: all properties `readonly`; state transitions use `with*()` methods that return new instances.
- **VOs validate in `create()`**: private constructor + static `create()` factory; throws `OneJsError` on invalid input.
- **`OneJsError` for all errors**: `new OneJsError(type, statusCode, message, details, ErrorCodes.CODE)` — never `new Error()`.
- **InMemory fakes in tests**: never mock repositories; use the InMemory adapter as a real dependency.
- **`reconstitute()` for hydration**: map DB records to entities via `Entity.reconstitute()`; use `entity.toDto()` to write back.
- Application services orchestrate through `run()` and delegate business rules to entities or domain services.
- No getters/setters in domain classes — expose behavior through named methods.
- Don't include JSDoc comments unless requested.
- After code changes, run the `lint:fix` + `typecheck` + `test` trio before committing.

## Value Object Pattern

```typescript
@ValueObject()
export class Email extends ValueObjectBase<string> {
  private constructor(value: string) { super(value) }

  static create(value: string): Email {
    if (!value?.trim()) throw new OneJsError(EmailErrorTypes.VALIDATION_FAILED, 400, EmailErrorMessages.REQUIRED, {}, ErrorCodes.VALIDATION_FAILED)
    const normalized = value.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      throw new OneJsError(EmailErrorTypes.VALIDATION_FAILED, 400, EmailErrorMessages.INVALID_FORMAT, {}, ErrorCodes.VALIDATION_FAILED)
    return new Email(normalized)
  }
}
```

## Entity Pattern

```typescript
@Entity()
export class User extends EntityBase<UserId> {
  constructor(id: UserId, readonly email: Email, readonly role: UserRole, ...) { super(id) }

  static register(email: Email, passwordHash: PasswordHash): User {
    return new User(UserId.generateUniqueId(), email, passwordHash, UserRole.user(), new Date(), null)
  }

  static reconstitute(id: string, email: string, ...): User {
    return new User(UserId.fromString(id), Email.create(email), ...)
  }

  withPasswordHash(hash: PasswordHash): User { /* returns new User */ }

  toDto(): UserDto { return new UserDto(this.getId().getValue(), this.email.getValue(), ...) }
}
```

## Service Pattern

```typescript
@Injectable()
export class UserCreator {
  constructor(
    @Inject(InMemoryUserRepository) private readonly repo: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async run(email: Email, passwordHash: PasswordHash): Promise<User> {
    const existing = await this.repo.findByEmail(email)
    if (existing) throw new OneJsError(UserErrorTypes.CONFLICT, 409, UserErrorMessages.EMAIL_IN_USE, {}, ErrorCodes.USER_ALREADY_EXISTS)
    const user = User.register(email, passwordHash)
    await this.repo.save(user)
    await this.eventBus.publish(new UserRegisteredEvent(user))
    return user
  }
}
```

## Repository Pattern

```typescript
// Interface (domain port) — VO params
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  save(user: User): Promise<void>
}

// Adapter (infrastructure) — @Injectable() required
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>()
  async findById(id: UserId) { return this.store.get(id.getValue()) ?? null }
  async findByEmail(email: Email) {
    for (const u of this.store.values()) if (u.email.getValue() === email.getValue()) return u
    return null
  }
  async save(user: User) { this.store.set(user.getId().getValue(), user) }
}
```

## Mandatory Validation Gate

After every completed task during interactive `spec-apply`, you MUST invoke `@project-validator-fast` (scoped lint + scoped tests + incremental typecheck). The task MUST NOT be marked complete in `tasks.md` until it returns green. Escalate to the full `@project-validator` when: the change touches `packages/shared` or shared config, a schema change occurred, or this is the last task of a block. The `spec-loop` (unattended) always uses the full `@project-validator` on every task — no fast gate. This is non-negotiable — do not skip, defer, or mark a task as done until validation passes.

`spec-apply` is interactive and must not create commits unless the operator explicitly asks for one or the already-approved tasks explicitly require it. When a commit is requested, update `tasks.md` before staging and include it in the same logical commit as the implementation. `spec-loop` is the unattended exception: it commits autonomously per completed, validated task.

Reviewer subagents (`code-reviewer`, `tests-reviewer`, `architecture-reviewer`, `frontend-reviewer`) run only during the dedicated `spec-review` mode (between `spec-apply` and `spec-archive`), not after every task. `spec-archive` itself runs no reviewers — it trusts that `spec-review` left the tree green. The standalone `task-*-review` skills remain available as manual escape hatches if you need early feedback mid-change.

## Explicit Review Commands

Reviewer commands are available on request, but agents must not launch them automatically. Run `/task-code-review`, `/task-tests-review`, `/task-architecture-review`, `/task-frontend-review`, `/task-qa`, `/task-ux-review`, `/opsx:review` (Cursor: `/opsx-review`, OpenCode: `spec-review`) only when the operator explicitly asks for that review.

## OpenSpec Workflow

Spec-driven development via OpenSpec:

| Phase | Cursor | Claude Code | OpenCode |
| --- | --- | --- | --- |
| Explore | `/opsx-explore` | `/opsx:explore` | `spec-explore` |
| Propose | `/opsx-propose` | `/opsx:propose` | `spec-propose` |
| Apply | `/opsx-apply` | `/opsx:apply` | `spec-apply` |
| Review | `/opsx-review` | `/opsx:review` | `spec-review` |
| Archive | `/opsx-archive` | `/opsx:archive` | `spec-archive` |

- `spec-propose` writes only inside `openspec/changes/<change-id>/`.
- `spec-apply` reads change artifacts before touching production code, runs `@project-validator-fast` per task (escalates to full `@project-validator` on broad blast radius, schema changes, or last task of a block), and treats commits as operator opt-in.
- `spec-review` runs the explicit reviewer gate only when the operator requests it.
- `spec-archive` confirms incomplete artifacts/tasks and review state before delegating spec updates and the archive move to `openspec archive`.

### Unattended loop (Ralph)

`spec-loop` is the unattended sibling of `spec-apply`: an external runner (`scripts/loop.sh`) drives one task per fresh session until every task in `tasks.md` is checked. It loads the `openspec-loop` skill, keeps the same mandatory `@project-validator` gate, commits per task, and emits `<promise>DONE</promise>` only when the change is complete. Use `scripts/loop-once.sh <change>` to dry-run a single iteration; `scripts/loop.sh <change> [max-iters] [model]` to run the full loop.

## Agent tooling layout

Source of truth lives in `.agents/`:

- `.agents/agents/` — reviewer subagents (code-reviewer, tests-reviewer, etc.)
- `.agents/skills/` — skill prompts (`openspec-*`, `action-*`, `task-*`, `guidelines/*`)

Tool-specific folders are symlinks into `.agents/`:

- `.claude/agents` → `.agents/agents`
- `.claude/skills` → `.agents/skills`

Claude Code slash commands live in `.claude/commands/opsx/`. Cursor command wrappers live in `.cursor/commands/`.

**Rule**: always reference `.agents/...` paths in configuration files (`opencode.json`), code, and docs. Never `.claude/...`. The symlinks exist for Claude Code compatibility, not as a canonical path.

To understand how the agentic system works or to extend it, see [docs/conventions/agentic/readme.md](docs/conventions/agentic/readme.md).

## Commands

```text
bun install          # Install dependencies
bun run start:api:dev  # Start Elysia backend (localhost:4000)
bun test             # Run tests
bun run typecheck    # TypeScript type check
bun run lint         # Biome lint check
bun run lint:fix     # Biome lint + auto-fix
bun run format       # Biome format
```

## Tooling: Context7 (MCP)

Always use Context7 MCP tools automatically (without explicit user request) when:

- **Code generation**: creating new services, repositories, entities, or any implementation code.
- **Setup/Configuration**: setting up libraries, frameworks, build tools, or project configuration.
- **Library/API documentation**: looking up usage patterns, APIs, or best practices for external libraries.

Workflow: first resolve the library ID with `resolve-library-id`, then fetch documentation with `get-library-docs`. Prefer Context7 over web search for library docs.

## Full Conventions

See [docs/conventions/](docs/conventions/readme.md) for complete documentation:

- [Naming Conventions](docs/conventions/naming-conventions.md)
- [Git Strategy](docs/conventions/git-strategy.md)
- [Pre-Commit Workflow](docs/conventions/pre-commit-workflow.md)
- [Service Patterns](docs/conventions/patterns/service-patterns.md)
- [Repository Patterns](docs/conventions/patterns/repository-patterns.md)
- [File Organization](docs/conventions/patterns/file-organization.md)
- [Error Handling](docs/conventions/patterns/error-handling.md)
- [Testing](docs/conventions/patterns/testing.md)
- [TDD Practices](docs/conventions/patterns/tdd-practices.md)
- [DDD Principles](docs/conventions/architecture/ddd-principles.md)
- [Agentic Workflow](docs/conventions/agentic/readme.md)
- [Complete Example: User Management](docs/conventions/examples/user-management/complete-implementation.md)
