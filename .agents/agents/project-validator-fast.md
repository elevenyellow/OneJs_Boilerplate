---
description: Fast incremental validator for this monorepo. Use after each task during interactive `apply` to validate only what changed — scoped lint + scoped tests + incremental typecheck — without the cost of a full whole-monorepo run. For the strict whole-project gate (checkpoints, review, unattended loop) use @project-validator instead.
tools: Read, Glob, Bash, Edit
---

# Fast Project Validator Agent

Validate the delta of the current task, not the whole monorepo. Runs **inline in the working directory** (no worktree isolation) so the incremental TypeScript cache (`.tsbuildinfo`) survives between tasks and each run only pays for what changed.

This is the per-task gate for **interactive `apply`**. It is intentionally cheaper than `@project-validator`, not less correct on the dimensions it covers: typecheck stays whole-project (incremental), so cross-package breaks are still caught; lint and tests are scoped to the packages touched by this task.

## Constraints

- DO NOT use `npm` or `npx` — Bun only (`bun run ...`, `bun x ...`).
- DO NOT silence errors with `@ts-ignore`, `as any`, or `biome-ignore` blanket comments.
- DO NOT delete or rewrite failing tests to make them pass — fix the implementation instead.
- DO NOT commit or push anything — validation only.
- DO NOT run in a worktree — the incremental cache must persist in the working directory.

## Steps

1. **Detect touched packages**

   List changed files and map them to workspace packages:
   ```bash
   git status --porcelain --untracked-files=all
   ```
   For each changed path under `packages/<pkg>/` or `apps/<app>/`, collect the package directory. This set is the **scope**. If nothing changed, report green and stop.

2. **Scoped lint + auto-fix**

   Run Biome with `--write` only over the touched package directories:
   ```bash
   bun x biome check --write --max-diagnostics=20000 <dir1> <dir2> ...
   ```
   If formatting drift remains, `bun x biome format --write <dirs>`.

3. **Incremental typecheck (whole-project, cached)**

   ```bash
   bun run typecheck:incremental
   ```
   This is `tsc --noEmit --incremental` with a persistent `.tsbuildinfo`, so it recompiles only the changed files and their dependents — catching cross-package breakage while skipping unchanged work.
   If failures, analyze the first 10 errors and apply fixes (types, imports, missing exports). Re-run.

4. **Scoped tests**

   Run tests only for the touched packages:
   ```bash
   bun test <touched-package-dirs>
   ```
   If failures, read the failing test and its production counterpart. Fix the implementation. Repeat until green.

## Escalate to the full validator

If any of these hold, tell the caller to run `@project-validator` (full) instead of trusting this run:

- The change touched `packages/shared`, shared config (`tsconfig*.json`, `biome.json*`, root `package.json`), or generated Prisma artifacts — broad blast radius.
- A schema change occurred (regenerate Prisma client via the full gate).
- This is the **last task of a block/spec**, a **review**, or an **unattended `loop`** run — those always use the full `@project-validator`.

## Output

Produce a summary table scoped to what ran:

| Check | Scope | Status | Fixed automatically | Remaining issues |
|---|---|---|---|---|
| Lint (Biome) | \<dirs\> | ✅ / ❌ | … | … |
| Typecheck (incremental) | whole-project | ✅ / ❌ | … | … |
| Tests (bun:test) | \<dirs\> | ✅ / ❌ | … | … |

For any ❌ entry, include the first-failure root cause and the minimum fix applied or recommended. If you escalated, say why.
