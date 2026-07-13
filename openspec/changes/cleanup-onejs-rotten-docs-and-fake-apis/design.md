## Context

A comprehensive scan of the `.oneJs/` framework revealed that the documentation is actively dangerous:

**Auto-generated fake docs**: 5 markdown files at `.oneJs/` root (CHANGES.md, REFACTOR_SUMMARY.md, MIGRATION_GUIDE.md, TESTING_GUIDE.md, EXTENSION_EXAMPLE.md) are AI-generated and document APIs that do not exist. They teach explicit antipatterns: Service Locator (`ContainerProvider.getContainer()` inside constructors), magic strings, container global, `any` types, `console.log` instead of Logger.

**Wrong READMEs**: 7 README.md files inside `.oneJs/*` paths document APIs that are wrong, reference classes that do not exist (`PrismaClientEy` is cited but the real class is `PrismaClientOneJs` — verified: 0 references vs 48 references), and 2 of them are literally copy-pasted from other projects:
- `.oneJs/prisma/README.md` is titled "ContainerV2 Prisma Package" and says install with `bun add containerv2`. The package is `@OneJs/prisma`. ContainerV2 is a different/older project.
- `.oneJs/core/src/logger/README.md` is titled "EyJsLogger" with badges pointing to the eyjslogger npm package. Same problem — different project.

**Broken CLI**: `.oneJs/create-app/` is the CLI tool `bun run create-app`. It generates code that does NOT compile (imports `MongoConnector` from `@OneJs/core` — verified 0 references exist), violates AGENTS.md systematically (uses `throw new Error`, `dto: any`, MongoDB instead of Prisma+InMemory, `console.log`, typo "persistance" instead of "persistence"), and the CLI itself is broken (uses `require.main === module` check in an ESM module — fails on Bun ESM).

**Leftover test code**: `apps/api/index.ts` lines 27-40 contain hardcoded test logic that runs on every API startup: `Task.create('Test task', ...)`, `Task.create('Completed task', ...)`, publishes `TaskCreatedIntegrationEvent` to the event bus. Variable `_task` is declared and never used. Variable `task2` is published as a "completed" event using a "created" event class. Lines 35-36 and 39 are commented-out debug code. This is leftover demo code in production.

**Redundant .gitignore files**: 7 .gitignore files total, 4 of which are inside `.oneJs/*` redundantly copy-pasted from the root .gitignore. One `.oneJs/core/src/logger/.gitignore` is at a sub-sub-package level which makes no sense. The root has a file literally named `.gitignore copy` (with space and the word "copy") that contains rules for a different project (next.js, vercel, @smoke/database). It's a stale duplicate.

**Duplicate lockfile**: `.oneJs/bun.lock` is a separate lockfile from the root `bun.lock`. It lists dependencies of a previous version of the project (express, body-parser, cors, glob-promise, moment, reflect-metadata, fast-json-parse, etc) — none of which are used in the current Elysia+Bun codebase. Its workspace name field says `"name": "core"`. Risk: two lockfiles can desync versions of the same dependency. Should only have ONE lockfile at monorepo root.

**Wrong project config**: `openspec/config.yaml` describes a DIFFERENT project entirely (talks about `@smoke/` packages, `apps/webapp`, `apps/mobile`, PGlite, tRPC, React 19, NativeWind) — none of which exist in this repo. Another stale copy from a renamed project chain. Needs to be rewritten to describe the actual OneJs project so spec-writer and openspec tooling produce correct artifacts in future changes.

## Goals / Non-Goals

**Goals:**

- Delete all 5 auto-generated .md files at `.oneJs/` root
- Delete all 7 fake/broken README.md files inside `.oneJs/*`
- Delete the entire `.oneJs/create-app/` directory (broken CLI generator)
- Delete 4 redundant .gitignore files (3 inside `.oneJs/*`, 1 stale duplicate at root)
- Delete `.oneJs/bun.lock` (duplicate lockfile)
- Clean leftover test/demo code from `apps/api/index.ts` (lines 27-40)
- Remove `create-app` script from root `package.json`
- Add minimal placeholder README.md for each `.oneJs/*` package (6 packages) pointing readers to AGENTS.md and integration tests
- Add minimal project-level `.oneJs/README.md` pointing to workspace structure
- Rewrite `openspec/config.yaml` to describe the actual OneJs project

**Non-Goals:**

- **NOT** rewriting any production code beyond the `apps/api/index.ts` cleanup
- **NOT** adding new dependencies, packages, or features
- **NOT** changing any plugin, decorator, or service implementation
- **NOT** touching test files
- **NOT** addressing magic strings, multiple event buses, JWT default_secret, Logger refactor, or any other Phase 1-5 work (those are separate proposals)
- **NOT** creating a replacement for `create-app` (decision: deferred — if needed in the future, recreate from scratch aligned with AGENTS.md)

## Decisions

### Decision 1: Why delete instead of fix

**Chosen: Delete all rotten docs instead of fixing them.**

Fixing 7 wrong READMEs + 5 fake .md files + a broken CLI generator costs more than the value they provide. The project already has a reliable single source of truth:
- **AGENTS.md** for conventions, patterns, and architecture
- **Integration tests** (`src/__tests__/`) for actual API usage examples
- **Production code** (`apps/api/index.ts`, `packages/*/`) for real implementations

Less docs > wrong docs. Wrong docs actively harm the project by teaching antipatterns and documenting APIs that don't exist.

**Alternatives considered:**
- *Fix each README to match reality* — rejected because it's expensive (7 READMEs × ~30 minutes each = 3.5 hours) and the value is low (AGENTS.md already serves this purpose)
- *Keep the auto-generated .md files* — rejected because they teach explicit antipatterns (Service Locator, magic strings, `console.log`)

### Decision 2: Why minimal placeholder READMEs

**Chosen: Add 5-10 line placeholder READMEs pointing to AGENTS.md and tests.**

npm convention expects a README in each package. A 5-line stub pointing to the real source of truth (AGENTS.md, integration tests) is enough and harmless. It prevents the "no README" confusion while avoiding the cost of maintaining detailed per-package docs.

Template:
```markdown
# @OneJs/<package>

<one-line responsibility statement>

> ⚠️ The previous README was auto-generated and documented APIs that did not exist.
> It has been removed. For the **real** API, see:
> - Root [AGENTS.md](../../AGENTS.md) for project conventions
> - `src/__tests__/` and `apps/api/index.ts` for actual usage examples
```

**Alternatives considered:**
- *No README at all* — rejected because npm/GitHub convention expects a README; absence looks unfinished
- *Detailed per-package READMEs* — rejected because it duplicates AGENTS.md and creates maintenance burden

### Decision 3: Why no replacement for `create-app`

**Chosen: Delete `create-app` with no replacement.**

The generator doesn't add value that manual creation lacks. Manual creation respects AGENTS.md by construction (developer reads conventions, writes code). The generator actively harms the project by generating code that doesn't compile and violates conventions.

If a future need arises (e.g., onboarding 10+ new developers per month), recreate from scratch aligned with AGENTS.md. For now, the cost of maintaining a broken generator > the value it provides.

**Alternatives considered:**
- *Fix the generator* — rejected because it's expensive (rewrite CLI + templates + tests = ~8 hours) and the value is unclear (how often is it used? Answer: unknown, but the script exists in package.json)
- *Keep it broken* — rejected because it actively harms the project (generates code that doesn't compile)

### Decision 4: Scope expansion — clean docs that reference `create-app`

**Chosen: Expand scope to include `docs/cli.md`, the related sections in `docs/getting-started.md`, `docs/README.md`, and root `README.md` that reference the deleted CLI.**

During the apply phase, a `grep "create-app"` revealed cross-references that the original proposal had missed:

- `docs/cli.md` — 33 lines, entire file dedicated to the deleted CLI (with a pre-existing path bug calling it `packages/create-app/cli.ts` while the real path was `.oneJs/create-app/cli.ts`)
- `docs/getting-started.md` lines 60-69 — "Creating Your First App" section with `bun create-app my-new-api`
- `docs/README.md` line 16 — CLI Tool entry in the docs index
- `README.md` root — "Smart CLI" feature bullet (line 35), "Scaffolding New Modules" section (lines 105-110), "CLI Tool Usage" doc link (line 123)

Leaving these docs in place after deleting the tool would create a self-inconsistent commit: the README advertises a feature that no longer exists, and `docs/cli.md` documents a tool that has been removed. This directly violates the `framework-docs-hygiene` spec accompanying this change, specifically the requirement that documentation must not reference APIs that do not exist.

The expansion is small (4 files, ~50 lines of doc deletions total) and strictly aligned with the original intent (remove the dead generator + its documentation). It is not scope creep — it is closure of the original scope.

**Alternatives considered:**
- *Leave the docs as-is and clean them in a follow-up* — rejected because the change would violate its own accompanying spec and the repo would be in an inconsistent state between commits
- *Revert all work and rewrite the proposal from scratch* — rejected because the missed scope is small and amending the proposal in-flight is faster and equally auditable

## Risks / Trade-offs

**[Risk] Someone might rely on `create-app` script today**
- **Mitigation**: Search the repo for usages first. If any exist, document them in the task and decide. (Pre-research: the only usage of the script string is in `package.json` itself — no other references found.)

**[Risk] Lose the historical record in CHANGES.md/REFACTOR_SUMMARY.md**
- **Mitigation**: Acceptable. Git history retains everything. These files document a version of the project that no longer exists (different DI system, different patterns).

**[Trade-off] No per-package READMEs with detailed API docs**
- **Mitigation**: AGENTS.md and integration tests are the authoritative source. Placeholder READMEs point readers there. This is a feature, not a bug — single source of truth reduces maintenance burden and prevents docs from drifting out of sync with code.

**[Trade-off] `openspec/config.yaml` rewrite might miss nuances**
- **Mitigation**: The current config describes a completely different project. Any rewrite is an improvement. The new config will be reviewed as part of the change and can be refined in future changes if needed.
