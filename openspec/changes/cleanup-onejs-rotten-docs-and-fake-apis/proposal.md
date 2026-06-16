## Why

The `.oneJs/` framework documentation is actively harmful to the project:

- **Auto-generated fake documentation**: 5 markdown files at `.oneJs/` root (CHANGES.md, REFACTOR_SUMMARY.md, MIGRATION_GUIDE.md, TESTING_GUIDE.md, EXTENSION_EXAMPLE.md) document APIs that do not exist and teach explicit antipatterns — Service Locator pattern (`ContainerProvider.getContainer()` inside constructors), magic strings, global container access, `any` types, and `console.log` instead of Logger.

- **Wrong and copy-pasted READMEs**: 7 README.md files inside `.oneJs/*` paths document incorrect APIs, reference non-existent classes (`PrismaClientEy` instead of the real `PrismaClientOneJs`), and 2 are literally copy-pasted from different projects:
  - `.oneJs/prisma/README.md` is titled "ContainerV2 Prisma Package" with install instructions for `containerv2` (a different project)
  - `.oneJs/core/src/logger/README.md` is titled "EyJsLogger" with badges pointing to the `eyjslogger` npm package (another different project)

- **Broken CLI generator**: `.oneJs/create-app/` generates code that does not compile (imports `MongoConnector` from `@OneJs/core` which has 0 references), violates AGENTS.md systematically (uses `throw new Error`, `dto: any`, MongoDB instead of Prisma+InMemory, `console.log`, typo "persistance"), and the CLI itself is broken (uses `require.main === module` check in an ESM module — fails on Bun ESM).

- **Leftover test/demo code in production**: `apps/api/index.ts` lines 27-40 contain hardcoded test logic that runs on every API startup — creates test tasks, publishes events, declares unused variables (`_task`), and includes commented-out debug code.

- **Redundant and stale .gitignore files**: 5 redundant .gitignore files: 4 inside `.oneJs/*` copy-pasted from root (`.oneJs/.gitignore`, `.oneJs/auth/.gitignore`, `.oneJs/prisma/.gitignore`, `.oneJs/core/src/logger/.gitignore` — the last at sub-sub-package level makes no sense), plus 1 stale duplicate at root literally named `.gitignore copy` (with space) containing rules for a different project (next.js, vercel, @smoke/database).

- **Duplicate lockfile**: `.oneJs/bun.lock` is a separate lockfile from root `bun.lock`, listing dependencies of a previous version (express, body-parser, cors, glob-promise, moment, reflect-metadata, fast-json-parse) — none used in current Elysia+Bun codebase. Risk: two lockfiles can desync versions.

- **Wrong project config**: `openspec/config.yaml` describes a DIFFERENT project entirely (talks about `@smoke/` packages, `apps/webapp`, `apps/mobile`, PGlite, tRPC, React 19, NativeWind) — none of which exist in this repo. It's a stale copy from a renamed project chain.

**Impact**: Developers and AI agents reading these docs will write code that doesn't compile, violates project conventions, and introduces antipatterns. The single source of truth is AGENTS.md and integration tests — not these rotten docs.

## What Changes

**Deletions:**

1. Delete 5 auto-generated .md files at `.oneJs/` root:
   - `.oneJs/CHANGES.md`
   - `.oneJs/REFACTOR_SUMMARY.md`
   - `.oneJs/MIGRATION_GUIDE.md`
   - `.oneJs/TESTING_GUIDE.md`
   - `.oneJs/EXTENSION_EXAMPLE.md`

2. Delete 7 fake/broken README.md files at framework level:
   - `.oneJs/README.md`
   - `.oneJs/core/README.md`
   - `.oneJs/server/README.md`
   - `.oneJs/event-bus/README.md`
   - `.oneJs/jobs/README.md`
   - `.oneJs/prisma/README.md`
   - `.oneJs/core/src/logger/README.md`
   - (Plus `.oneJs/create-app/README.md` which is removed implicitly when its parent directory is deleted in item 3)

3. Delete `.oneJs/create-app/` directory entirely (broken CLI generator)

   Scope expansion (added during apply after `grep` revealed cross-references): when `.oneJs/create-app/` is removed, the following user-facing docs become stale and MUST be cleaned in the same change to avoid leaving the repo in an inconsistent state where the README still advertises `bun create-app` and links to docs of a deleted tool. Per the `framework-docs-hygiene` spec accompanying this change, "no copy-pasted READMEs from other projects" and "no references to APIs that do not exist" — keeping these docs alive would create a change that violates its own policy:

   - Delete `docs/cli.md` (33 lines, entire file dedicated to the deleted CLI; also contains a pre-existing path bug `packages/create-app/cli.ts` for what was actually `.oneJs/create-app/cli.ts`)
   - Delete the "Creating Your First App" section in `docs/getting-started.md` (lines 60-69)
   - Remove the "Smart CLI" feature bullet (line 35), the "Scaffolding New Modules" subsection (lines 105-110), and the "CLI Tool Usage" doc link (line 123) from root `README.md`
   - Remove the CLI Tool entry from the docs index in `docs/README.md` (line 16)

4. Delete 5 redundant .gitignore files:
   - `.oneJs/.gitignore`
   - `.oneJs/auth/.gitignore`
   - `.oneJs/prisma/.gitignore`
   - `.oneJs/core/src/logger/.gitignore`
   - `.gitignore copy` (stale duplicate at root)

5. Delete `.oneJs/bun.lock` (duplicate lockfile)

6. Clean leftover test/demo code from `apps/api/index.ts` (lines 27-40: test task creation, event publishing, unused variables, commented debug code)

**Modifications:**

7. Remove `create-app` script from root `package.json` (line 17: `"create-app": "bun ./.oneJs/create-app/cli.ts"`)

8. Add minimal placeholder README.md for each `.oneJs/*` package (6 packages: core, server, event-bus, jobs, prisma, auth) — 5-10 lines each, pointing readers to AGENTS.md and integration tests as the real API source

9. Add minimal project-level `.oneJs/README.md` pointing to workspace structure and AGENTS.md

10. Rewrite `openspec/config.yaml` to describe the actual OneJs project (TypeScript, Bun, Elysia, Prisma+PostgreSQL, BullMQ+Redis, Clerk, Biome, DDD+Hexagonal, `.oneJs/*` and `packages/*` and `apps/*` structure, `@OneJs/` prefix)

## Capabilities

**No new or modified capability specs.** This is a documentation-only change (deletions + minimal stubs). No feature-level behavior changes. No spec deltas required.

## Impact

**Affected paths:**

- `.oneJs/` — 5 .md files deleted, 7 README.md files deleted (8 counting `.oneJs/create-app/README.md` removed via directory deletion), 1 directory (`create-app/`) deleted, 4 .gitignore files deleted, 1 lockfile deleted, 6 new minimal README.md files added, 1 project README.md added
- `apps/api/index.ts` — lines 27-40 deleted (14 lines of test/demo code), unused imports removed
- `docs/cli.md` — deleted (entire file, 33 lines)
- `docs/getting-started.md` — "Creating Your First App" section deleted (10 lines)
- `docs/README.md` — CLI Tool entry removed from docs index
- `README.md` (root) — "Smart CLI" feature bullet, "Scaffolding New Modules" section, and "CLI Tool Usage" doc link removed
- `package.json` (root) — `create-app` script removed
- `openspec/config.yaml` — rewritten to describe actual project
- `.gitignore copy` (root) — deleted

**No runtime dependencies or API changes.** All changes are documentation-only or deletion-only, except for the cleanup of leftover test code in `apps/api/index.ts` (which is dead code that runs on startup but has no functional purpose).

## Non-Goals

- **NOT** rewriting any production code beyond the `apps/api/index.ts` cleanup
- **NOT** adding new dependencies, packages, or features
- **NOT** changing any plugin, decorator, or service implementation
- **NOT** touching test files
- **NOT** addressing magic strings, multiple event buses, JWT default_secret, Logger refactor, or any other Phase 1-5 work (those are separate proposals)
- **NOT** creating a replacement for `create-app` (decision: deferred — if needed in the future, recreate from scratch aligned with AGENTS.md)
- **NOT** migrating existing code to eliminate magic strings or other convention violations (that is a separate cleanup task)
