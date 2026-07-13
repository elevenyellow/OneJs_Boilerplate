## 1. Delete auto-generated .md files at `.oneJs/` root

- [x] 1.1 Delete `.oneJs/CHANGES.md` — `git rm .oneJs/CHANGES.md`
- [x] 1.2 Delete `.oneJs/REFACTOR_SUMMARY.md` — `git rm .oneJs/REFACTOR_SUMMARY.md`
- [x] 1.3 Delete `.oneJs/MIGRATION_GUIDE.md` — `git rm .oneJs/MIGRATION_GUIDE.md`
- [x] 1.4 Delete `.oneJs/TESTING_GUIDE.md` — `git rm .oneJs/TESTING_GUIDE.md`
- [x] 1.5 Delete `.oneJs/EXTENSION_EXAMPLE.md` — `git rm .oneJs/EXTENSION_EXAMPLE.md`

## 2. Delete fake / broken README.md files

- [x] 2.1 Delete `.oneJs/README.md` — `git rm .oneJs/README.md`
- [x] 2.2 Delete `.oneJs/core/README.md` — `git rm .oneJs/core/README.md`
- [x] 2.3 Delete `.oneJs/server/README.md` — `git rm .oneJs/server/README.md`
- [x] 2.4 Delete `.oneJs/event-bus/README.md` — `git rm .oneJs/event-bus/README.md`
- [x] 2.5 Delete `.oneJs/jobs/README.md` — `git rm .oneJs/jobs/README.md`
- [x] 2.6 Delete `.oneJs/prisma/README.md` — `git rm .oneJs/prisma/README.md`
- [x] 2.7 Delete `.oneJs/core/src/logger/README.md` — `git rm .oneJs/core/src/logger/README.md`

## 3. Add minimal placeholder README.md for each `.oneJs/*` package

- [x] 3.1 Create `.oneJs/core/README.md` — 5-10 lines, template: "# @OneJs/core\n\nDependency injection, Entity/VO base classes, Logger, OneJsError, decorators.\n\n> ⚠️ The previous README was auto-generated and documented APIs that did not exist.\n> It has been removed. For the **real** API, see:\n> - Root [AGENTS.md](../../AGENTS.md) for project conventions\n> - `src/__tests__/` for actual usage examples\n> - `apps/api/index.ts` for integration examples"
- [x] 3.2 Create `.oneJs/server/README.md` — 5-10 lines, template: "# @OneJs/server\n\nElysia HTTP server integration with OneJs DI.\n\n> ⚠️ The previous README was auto-generated and documented APIs that did not exist.\n> It has been removed. For the **real** API, see:\n> - Root [AGENTS.md](../../AGENTS.md) for project conventions\n> - `src/__tests__/` for actual usage examples\n> - `apps/api/index.ts` for integration examples"
- [x] 3.3 Create `.oneJs/event-bus/README.md` — 5-10 lines, template: "# @OneJs/event-bus\n\nEvent bus with Redis bridge for distributed events.\n\n> ⚠️ The previous README was auto-generated and documented APIs that did not exist.\n> It has been removed. For the **real** API, see:\n> - Root [AGENTS.md](../../AGENTS.md) for project conventions\n> - `src/__tests__/` for actual usage examples\n> - `apps/api/index.ts` for integration examples"
- [x] 3.4 Create `.oneJs/jobs/README.md` — 5-10 lines, template: "# @OneJs/jobs\n\nBullMQ job queue integration with OneJs DI.\n\n> ⚠️ The previous README was auto-generated and documented APIs that did not exist.\n> It has been removed. For the **real** API, see:\n> - Root [AGENTS.md](../../AGENTS.md) for project conventions\n> - `src/__tests__/` for actual usage examples"
- [x] 3.5 Create `.oneJs/prisma/README.md` — 5-10 lines, template: "# @OneJs/prisma\n\nPrisma ORM integration with OneJs DI.\n\n> ⚠️ The previous README was auto-generated and documented APIs that did not exist.\n> It has been removed. For the **real** API, see:\n> - Root [AGENTS.md](../../AGENTS.md) for project conventions\n> - `src/__tests__/` for actual usage examples"
- [x] 3.6 Create `.oneJs/auth/README.md` — 5-10 lines, template: "# @OneJs/auth\n\nClerk authentication integration with OneJs DI.\n\n> ⚠️ The previous README was auto-generated and documented APIs that did not exist.\n> It has been removed. For the **real** API, see:\n> - Root [AGENTS.md](../../AGENTS.md) for project conventions\n> - `src/__tests__/` for actual usage examples\n> - `apps/api/index.ts` for integration examples"

## 4. Add minimal project-level `.oneJs/README.md`

- [x] 4.1 Create `.oneJs/README.md` — 10-15 lines, content: "# OneJs Framework\n\nInternal framework for the OneJs DDD Boilerplate.\n\n## Packages\n\n- `@OneJs/core` — DI, Entity/VO base classes, Logger, OneJsError\n- `@OneJs/server` — Elysia HTTP server integration\n- `@OneJs/event-bus` — Event bus with Redis bridge\n- `@OneJs/jobs` — BullMQ job queue integration\n- `@OneJs/prisma` — Prisma ORM integration\n- `@OneJs/auth` — Clerk authentication integration\n\n## Documentation\n\nFor project conventions, architecture, and usage patterns, see:\n- Root [AGENTS.md](../AGENTS.md) — authoritative source for all conventions\n- [docs/conventions/](../docs/conventions/) — detailed pattern documentation\n- `apps/api/index.ts` — real integration example\n- Each package's `src/__tests__/` — actual usage examples"

## 5. Delete `.oneJs/create-app/` entirely

- [x] 5.1 Verify no code references the `create-app` script — run `grep -r "create-app" --exclude-dir=.oneJs/create-app --exclude-dir=node_modules .` and confirm matches. Expected: root `package.json` line 17 (script), `.oneJs/create-app/package.json` (being deleted), plus the four documentation files cleaned in section 5b (`README.md`, `docs/cli.md`, `docs/getting-started.md`, `docs/README.md`), plus the framework config entry cleaned in 5.3 (`GlobModuleLoader.ts:14`). If you find any OTHER match (production code, tests, configs), STOP and report — do NOT proceed.
- [x] 5.2 Delete `.oneJs/create-app/` directory — `git rm -r .oneJs/create-app/` (this also removes `.oneJs/create-app/README.md` referenced in proposal.md)
- [x] 5.3 Remove the stale `'**/create-app/**'` ignore pattern from `.oneJs/core/src/bootstrap/adapters/GlobModuleLoader.ts` (currently line 14, inside the `ignorePatterns` array). This is a 1-line array entry deletion — same nature as removing the `create-app` script from `package.json` (item 6). Both are configuration entries that reference the deleted directory and become inert dead config after deletion. After the edit, run `bun run typecheck` to confirm the file still compiles.

## 5b. Clean docs that reference the deleted `create-app` CLI

This section was added during apply after section 5.1's grep revealed cross-references missed during research. See proposal.md item 3 and design.md Decision 4. Without these deletions, the change would violate its own `framework-docs-hygiene` spec (documentation must not reference APIs that do not exist).

- [x] 5b.1 Delete `docs/cli.md` — `git rm docs/cli.md` (33 lines, entire file dedicated to the deleted CLI; also contains a pre-existing path bug `packages/create-app/cli.ts`)
- [x] 5b.2 Edit `docs/getting-started.md` — delete the "Creating Your First App" section (currently lines 60-69, 10 lines: heading + blank + intro paragraph + blank + code block + blank + follow-up sentence + trailing blank). Verify by `grep "create-app" docs/getting-started.md` after the edit (expected: no matches).
- [x] 5b.3 Edit `docs/README.md` — remove the CLI Tool entry from the docs index (currently line 16: `8.  [**CLI Tool**](cli.md) - Scaffolding new applications and modules.`). Renumber subsequent index items if a numeric sequence is used so numbers remain contiguous.
- [x] 5b.4 Edit root `README.md` — remove three references to the deleted CLI:
  - Line 35: feature bullet `- 📝 **Smart CLI** - Instant scaffolding of apps and domain modules.`
  - Lines 97-110: the entire `## 🛠️ Usage & Scaffolding` section IF it contains only the deleted CLI content. Re-read the file first — if the section contains other content unrelated to `create-app` (e.g., the `### Project Templates` subsection at line 99-103 about API/Admin/Worker), keep that subsection and delete only `### Scaffolding New Modules` (lines 105-110) plus reorganize headings so `### Project Templates` is no longer orphaned. Make a judgment call to keep the README coherent.
  - Line 123 (in the Documentation list): `- [**CLI Tool Usage**](docs/cli.md)` — delete this single list item.
- [x] 5b.5 Verify no `create-app` references remain in user-facing docs — run `grep -rn "create-app" README.md docs/ 2>/dev/null` and confirm zero matches.

## 6. Remove `create-app` workspace script from root `package.json`

- [x] 6.1 Edit `package.json` — remove the entire line `"create-app": "bun ./.oneJs/create-app/cli.ts",` (currently line 17). It is not the last entry in the `scripts` block (`start:db` follows it), so removal leaves valid JSON without needing comma adjustment. Verify the file parses by running `bun -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`.

## 7. Clean leftover test/demo code from `apps/api/index.ts`

- [x] 7.1 Read `apps/api/index.ts` to verify current state (file has 40 lines; lines 27-40 contain test code)
- [x] 7.2 Delete lines 27-40 from `apps/api/index.ts` (14 lines total): the blank line, `const eventBus = container.get(EventBus)`, `const _task = Task.create(...)`, `const task2 = Task.create(...)` (multiline), the two commented-out integration events, `const taskCompletedIntegrationEvent = ...`, the commented-out `eventBus.publish(integrationEvent)`, and `eventBus.publish(taskCompletedIntegrationEvent)`
- [x] 7.3 Remove imports that became unused after the deletion. Specifically:
  - Line 3 (`import { EventBus, EventBusPlugin, RedisBridge } from '@OneJs/event-bus'`) — remove `EventBus` only; keep `EventBusPlugin` and `RedisBridge` (still used on line 14)
  - Line 6 (`import { TaskCreatedIntegrationEvent } from '@shared'`) — delete entirely
  - Line 7 (`import { Task } from '@task/domain/entities/task'`) — delete entirely
- [x] 7.4 Verify `apps/api/index.ts` compiles — run `bun run typecheck` and confirm no errors related to this file

## 8. Delete redundant `.gitignore` files

- [x] 8.1 Delete `.oneJs/.gitignore` — `git rm .oneJs/.gitignore` (redundant copy of root `.gitignore`)
- [x] 8.2 Delete `.oneJs/auth/.gitignore` — `git rm .oneJs/auth/.gitignore`
- [x] 8.3 Delete `.oneJs/prisma/.gitignore` — `git rm .oneJs/prisma/.gitignore`
- [x] 8.4 Delete `.oneJs/core/src/logger/.gitignore` — `git rm .oneJs/core/src/logger/.gitignore`
- [x] 8.5 Delete `.gitignore copy` at root — `git rm ".gitignore copy"` (note: filename has a space)

## 9. Delete `.oneJs/bun.lock`

- [x] 9.1 Delete `.oneJs/bun.lock` — `git rm .oneJs/bun.lock` (the only lockfile should be the root `bun.lock`)

## 10. Rewrite `openspec/config.yaml`

- [x] 10.1 Read current `openspec/config.yaml` to understand structure (keep `schema: spec-driven` and the overall `context:` / `rules:` block layout)
- [x] 10.2 Rewrite the `context:` block to describe the actual OneJs project. Include:
  - Tech stack: TypeScript (strict), Bun, Elysia 1.x, Prisma + PostgreSQL, BullMQ + Redis, Clerk for auth, Biome
  - Monorepo with Bun workspaces: `.oneJs/<core,server,event-bus,jobs,prisma,auth>`, `packages/<task,user,shared>`, `apps/<api,notifications>`
  - Package prefix: `@OneJs/` for framework packages, `@<context-name>` for bounded contexts (e.g., `@task`, `@user`, `@shared`)
  - Architecture: DDD with Hexagonal (Ports & Adapters), bounded contexts in `packages/`, thin shells in `apps/`
  - Layers: `domain/` (entities, VOs, ports) → `application/` (services with `run()` entry point, DTOs) → `infrastructure/` (adapters)
  - Auth: Clerk integrated via `@OneJs/auth`
  - Testing: bun test for unit (`*.test.ts`) with InMemory fakes only (zero mocks); `*.integration.test.ts` for integration (mocks of external libs allowed)
  - Linting: Biome (`bun run lint`, `bun run lint:fix`, `bun run format`)
  - All code, comments, and documentation in English
  - Project guidelines (source of truth): `AGENTS.md` (root) and `docs/conventions/`
- [x] 10.3 Rewrite the `rules.proposal:` and `rules.specs:` sections:
  - `proposal:` — always include a Non-Goals section; reference affected paths under `.oneJs/*`, `packages/*`, `apps/*`; identify which bounded context(s) the change belongs to
  - `specs:` — write scenarios in Given/When/Then format; organize specs by bounded context matching `packages/` structure; include edge cases and error scenarios
- [x] 10.4 Rewrite the `rules.design:` and `rules.tasks:` sections:
  - `design:` — read `.agents/skills/guidelines/hexagonal-architecture/` and `.agents/skills/guidelines/design-principles/` references before designing; map components to hexagonal layers (domain, application, infrastructure); identify ports and adapters; application services expose a single `run()` method; invariants live in entities/VOs; bounded contexts communicate through application services or domain ports, never via direct adapter coupling
  - `tasks:` — read `.agents/skills/guidelines/tdd-practices/` and `.agents/skills/guidelines/testing-standards/` references; tasks with behavior (entities, VOs, application services, repositories) use TDD format (RED → GREEN → COMMIT → REFACTOR); tasks without behavior (types, DTOs, wiring) are plain tasks; order tasks inside-out (domain → application → infrastructure); testing strategy per layer (domain unit tests, application unit tests with InMemory repositories, infrastructure integration tests with real Prisma+PostgreSQL); never mock Prisma directly — use a real test database; always include a final validation group running `bun run lint:fix`, `bun run typecheck`, `bun test`; always end with a conventional commit message task

## 11. Final Validation

- [x] 11.1 Run `bun run lint:fix` — ensure all changed files pass linting (markdown/text changes + `apps/api/index.ts` TS changes)
- [x] 11.2 Run `bun run typecheck` — ensure no type errors from changes (verify unused imports were removed from `apps/api/index.ts`)
- [x] 11.3 Run `bun test` — all tests should pass (no test files were changed, only production code cleanup in `apps/api/index.ts`)
- [x] 11.4 Commit all changes with conventional commit message — `chore(docs): remove rotten .oneJs docs and dead create-app generator`
