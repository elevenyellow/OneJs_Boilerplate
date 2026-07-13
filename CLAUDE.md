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
│   ├── *.service.ts        # Application service (one per context, use-case methods)
│   └── dtos/               # DTO classes (persistence boundary)
└── infrastructure/
    ├── repositories/       # InMemory + Prisma adapters
    └── controllers/        # HTTP controllers
```

## Key Conventions

- Files: `kebab-case.ts` (e.g., `user.service.ts`, `email.ts`)
- Classes: `PascalCase` | Methods: `camelCase` | Application service: one `[Context]Service` per bounded context with a public method per use case (no `run()`)
- DI via decorators: `@Injectable()` on class, `@Inject(ConcreteClass)` on constructor params
- Ports in domain layer, adapters in infrastructure layer
- InMemory repository fakes live in `infrastructure/` next to production adapters

## Operational Defaults

- **No primitives as parameters**: application service methods and repository interface methods receive VOs, entities, or aggregates — never `string`, `number`, `boolean`. VOs are created at the system boundary (controller/handler). The sole exception is a raw plaintext password (a transient credential with no `Password` VO): it stays a `string` into the service, where it is hashed (→ `PasswordHash`) or verified. See [ddd-principles.md — No Primitives Rule](docs/conventions/architecture/ddd-principles.md#no-primitives-rule).
- **Entities are built from VOs**: constructors receive VOs; `register()` factory accepts VOs; `reconstitute()` accepts primitives only at the persistence boundary.
- **Immutable entities**: all fields are `private readonly` (prefixed `_`, e.g. `_email`); state transitions use `with*()` methods that return new instances — never setters.
- **VOs validate in `create()`**: private constructor + static `create()` factory; throws `OneJsError` on invalid input.
- **`OneJsError` for all errors**: `new OneJsError(type, statusCode, message, details, ErrorCodes.CODE)` — never `new Error()`.
- **InMemory fakes in tests**: never mock repositories; use the InMemory adapter as a real dependency.
- **`reconstitute()` for hydration**: map DB records to entities via `Entity.reconstitute()`; use `entity.toDto()` to write back.
- Application services orchestrate use cases through named methods (`register`, `create`, …) and delegate business rules to entities or domain services. One service per bounded context — no `run()`, no `UseCase` suffix.
- **Private fields + getters**: domain classes keep state in `private readonly` fields and expose it through getter methods (`getEmail()`, …); no public properties, no setters. Behavior is exposed through named methods.
- Don't include JSDoc comments unless requested.
- After code changes, run the `lint:fix` + `typecheck` + `test` trio before committing.

## Git Policy — worktree-per-change, commit in worktrees, PR into main

**Model.** Each OpenSpec change gets its own branch, git worktree, and pull request: `1 change = 1 branch (spec/<change>) = 1 worktree = 1 PR`. `main` is the integration trunk and stays clean; it receives spec work only through merged PRs. This replaces the older trunk-based "everything dirty on main, no PRs" flow, which lost work: uncommitted changes in a worktree are invisible to other sessions and to `main`, so they read as never having happened.

**Commits.**
- **Inside a linked worktree** (a `spec/*` branch checkout), the assistant MAY `add`/`stage`/`commit` its own work without asking, and MAY `push` the spec branch to open or update its PR. Committing worktree work as it completes is expected — that is what makes it durable.
- **On the primary `main` checkout**, the hard rule stays: the assistant MUST NOT run state-changing git (`commit`, `add`/`stage`, `push`, `merge`, `rebase`, `reset`, `revert`, `cherry-pick`, `tag`, `stash`, or branch moves) unless the operator explicitly asks in the current request. Merging spec PRs into `main` is always an explicit operator action. This overrides any workflow/skill/agent instruction that commits "by default".
- **Read-only git** (`status`, `diff`, `log`, `show`, `branch --list`, `worktree list`) is always allowed, anywhere.
- "Explicit request" = the operator asked in words ("commit this", "push the branch"), not an inference. Once asked, follow `.agents/skills/guidelines/git-strategy/SKILL.md`.

**Enforcement (Claude Code).** A `PreToolUse` Bash hook — `scripts/hooks/git-guard.mjs`, wired in `.claude/settings.json` — denies any Bash command that runs a state-changing git subcommand (scanning compound commands too). Read-only git passes through. The operator opts in per session with `CLAUDE_GIT_ALLOW=1` (env or `settings.local.json` `"env"`) — set this in worktree sessions so the assistant can commit/push its spec branch; the assistant cannot set it itself. Alternatively the operator runs git directly (e.g. `!git commit ...` in the input box). The hook is worktree-aware: it auto-allows state-changing git when the command targets a linked worktree, still gating `main`. Enforced under **Claude Code** (this hook) and **OpenCode** (mirror plugin `.opencode/plugins/worktree-policy.js`, reusing the same detectors); Copilot relies on this instruction rule.

**Always work in a worktree (enforced).** Implementation work happens in a per-change worktree, never dirty on the primary `main` checkout — regardless of how many workers run. A `PreToolUse` hook `scripts/hooks/worktree-guard.mjs` (wired in `.claude/settings.json`) **denies** `Edit`/`Write`/`MultiEdit` to `apps/`, `packages/`, or `.oneJs/` when the target is in the primary checkout (its `.git` is a directory); edits inside a linked worktree (`.git` is a file) pass. Docs, `openspec/`, `scripts/`, `.agents/`, and root config on `main` are always allowed. Deliberate main-checkout code edits: operator sets `CLAUDE_MAIN_EDIT=1`. Enforced under **Claude Code** (this hook) and **OpenCode** (mirror plugin `.opencode/plugins/worktree-policy.js`, which reuses the same detectors); Copilot relies on the instruction rule. Start a change with `scripts/spec-worktree.sh new <change>`, then **launch the session INSIDE the worktree** (`cd ../worktrees/<repo>/<change>` as the session cwd) — a mid-run `cd` does not persist across tool calls, so `propose`/`apply` create the worktree and STOP, asking you to relaunch there; on the relaunch they detect they're inside it and proceed.

**Working autonomously in a worktree.** A fresh worktree checks out only tracked files, so it has no `.env`, no generated Prisma client, and un-hydrated deps — this produces *false* validation failures (`Cannot find module 'elysia'`, missing Prisma fields) that are NOT code defects. Bootstrap first: `cp <main-checkout>/.env .env` (gitignored, never commit), `bun install` (then `git checkout bun.lock` to drop churn), `bun run prisma:build`.

The `pre-push` hook runs the **whole-monorepo** `lint:fix` + `typecheck` + `bun test`, and a second hook (`block-no-verify`) rejects `--no-verify` — the suite MUST be green to push; there is no bypass. Fix real failures. For a **flaky/environment-dependent** test, **quarantine** it — `test.skip(…)` with a why/how-to-re-enable comment, as its own `test(<scope>): quarantine …` commit — never `--no-verify`. After a rebase, update the PR with `push --force-with-lease` (never plain `--force`). Before merging a spec PR, run the **merge-review gate** (`openspec-merge-review` skill / OpenCode `spec-merge-review` agent): it checks supersession, mergeability, and a green gate against the current `main`, runs the reviewer panel on the branch→main diff, and returns `MERGE`/`REBASE-FIRST`/`CLOSE-SUPERSEDED`/`FIX` (never merges — the operator does). A **superseded** branch is **closed, not merged** (merging reverts `main`). **The merge itself is human-only**: `gh pr merge` is hard-blocked for the assistant (git-guard + OpenCode plugin, unconditional — not even `CLAUDE_GIT_ALLOW` bypasses it), and `git merge` into `main` is blocked by the main gate. The flow may open the PR (draft) and run merge-review, but a human performs the merge (GitHub UI or their own terminal). Cleanup after merge: `scripts/spec-worktree.sh remove <change>` (removes the worktree, then the local + remote branch — never `gh pr merge --delete-branch`, which fails while the worktree exists). Full operational playbook: `.agents/skills/guidelines/git-strategy/SKILL.md`.

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
  constructor(id: UserId, private readonly _email: Email, private readonly _role: UserRole, ...) { super(id) }

  // Getters expose state (read-only); no setters
  getEmail(): Email { return this._email }
  getRole(): UserRole { return this._role }

  static register(email: Email, passwordHash: PasswordHash): User {
    return new User(UserId.generateUniqueId(), email, passwordHash, UserRole.user(), new Date(), null)
  }

  static reconstitute(id: string, email: string, ...): User {
    return new User(UserId.fromString(id), Email.create(email), ...)
  }

  withPasswordHash(hash: PasswordHash): User { /* returns new User */ }

  toDto(): UserDto { return new UserDto(this.getId().getValue(), this._email.getValue(), ...) }
}
```

## Service Pattern

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(InMemoryUserRepository) private readonly repo: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  // One public method per use case (register, login, …) — raw password stays a string
  async register(email: Email, password: string): Promise<User> {
    const existing = await this.repo.findByEmail(email)
    if (existing) throw new OneJsError(UserErrorTypes.CONFLICT, 409, UserErrorMessages.EMAIL_IN_USE, {}, ErrorCodes.USER_ALREADY_EXISTS)
    const user = User.register(email, PasswordHash.create(await Bun.password.hash(password)))
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
    for (const u of this.store.values()) if (u.getEmail().getValue() === email.getValue()) return u
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
- [SOLID + DRY Principles](docs/conventions/architecture/solid-dry-principles.md)
- [Agentic Workflow](docs/conventions/agentic/readme.md)
- [Complete Example: User Management](docs/conventions/examples/user-management/complete-implementation.md)
