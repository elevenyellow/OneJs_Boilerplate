# Proposal: Fix init script template residue

## Problem

The `scripts/init-project.ts` script leaves **template residue** in generated projects, causing broken CI pipelines, incorrect IDE rules, and AI agents recommending non-existent imports. This was discovered in production when initializing the Dermoscan project from the template.

**8 distinct issues, 4 root causes:**

### 1. Walker ignores all `.*` directories (affects CI, IDE rules, agent skills)

The `findFiles()` walker in `init-project.ts:518` skips **any directory starting with `.`**:

```ts
if (!entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name)) {
  await scan(fullPath)
}
```

This means replacements **never reach**:
- `.github/workflows/*.yml` → CI fails with `@dfs/database` not found
- `.cursor/.rules/*.mdc` → IDE rules reference `@dfs/...` imports
- `.agents/skills/**/*.md` → AI agents recommend `@dfs/api`, `@dfs/ui/variants`
- `.agents/agents/*.md` → Agent frontmatter says "for the DDD Fullstack Starter"

**Impact**: GitHub Actions typecheck and test workflows fail immediately on first push. Cursor and Claude agents generate broken imports.

### 2. Replacement list doesn't cover all template identifier variants

Current replacements only handle:
- `@dfs` → new identifier
- `ddd-fullstack-starter` → new project name

**Missing variants** found in production:
- `DDD Fullstack Starter` (Title Case) in `AGENTS.md`, `docs/conventions/readme.md`, agent frontmatter
- `fullstack-starter` (slug without prefix) in skill descriptions
- `dfs-` (bare, with hyphen) in `render.yaml` service names: `dfs-webapp`, `dfs-db`
- `dfs_` (bare, with underscore) in `render.yaml` database config: `dfs_user`, `ddd_fullstack_starter`

**Impact**: `render.yaml` deploys with wrong service names. Documentation still references the template. Grep-based verification finds dozens of false positives.

### 3. README.md stays unchanged

The init script doesn't touch `README.md`, leaving:
- "Use this template" badge pointing to the template repo
- Section "What the Init Script Does" (irrelevant post-init)
- Example identifier `@map` / `@mp` in usage examples
- Description of the template's user management example as if it were the project's feature

**Impact**: Confusing onboarding for new developers. README describes the template, not the actual project.

### 4. Wizard files survive initialization

After running `bun run init`, the project still contains:
- `.agents/skills/init/SKILL.md` and `checklist.md` (full of legitimate `@dfs` references)
- `scripts/init-project.ts` and `scripts/init-project.smoke.test.ts`
- `package.json` script `"init": "bun run scripts/init-project.ts"`

**Impact**: Noise in the codebase. Any grep-based verification for template residue hits these files with false positives. The `init` script is useless post-initialization.

### 5. No post-flight verification

The init script has no final check to confirm all replacements succeeded. Silent failures leave broken projects.

**Impact**: Issues only discovered when CI runs or developers try to build. No early signal that something went wrong during init.

## Solution

Fix all 4 root causes in a single atomic change:

### 1. Walker scope: allowlist `.github`, `.cursor`, `.agents`, `.vscode`

Change the directory scanning logic to **explicitly process** these dot-directories while keeping the rest ignored (`.git`, `.next`, `.turbo`, `.cache`, `.bun` stay excluded).

```ts
const PROCESSED_DOT_DIRS = new Set(['.github', '.cursor', '.agents', '.vscode'])

// New condition:
if (!IGNORED_DIRS.has(entry.name) && 
    (!entry.name.startsWith('.') || PROCESSED_DOT_DIRS.has(entry.name))) {
  await scan(fullPath)
}
```

### 2. Extended replacement table

Add missing variants, **ordered by length** (longest first to avoid partial matches):

| Pattern | Replacement | Example |
|---|---|---|
| `DDD Fullstack Starter` | `titleCase(projectName)` | `Dermoscan` |
| `ddd-fullstack-starter` | `projectName` | `dermoscan` |
| `fullstack-starter` | `projectName` | `dermoscan` |
| `@dfs` | `identifier` | `@ds` |
| `\bdfs([-_])` (regex) | `idWithoutAt + "$1"` | `ds-webapp`, `ds_user` |

The regex pattern `\bdfs([-_])` with word boundary ensures we only match `dfs-` and `dfs_` when they appear as standalone prefixes, not inside other words.

### 3. README handling

- Detect if `README.md` is the template's (heuristic: contains `"What the Init Script Does"` or `use this template` badge)
- If yes: replace with minimal skeleton (project name, install, dev commands)
- If no (user already edited): leave untouched
- Template lives in `scripts/templates/README.md.template`

### 4. Auto-uninstall wizard files

After successful initialization, remove:
- `.agents/skills/init/` (entire directory)
- `scripts/init-project.ts`
- `scripts/init-project.smoke.test.ts`
- `"init"` script entry from `package.json`

### 5. Post-flight verification (fail-hard)

After all replacements, run:

```bash
rg '@dfs|ddd-fullstack-starter|DDD Fullstack Starter|fullstack-starter|\bdfs[-_]' \
   --glob '!node_modules' --glob '!.git'
```

If **any match** is found:
- Print list of affected files
- Exit with code 1
- Message: "Template residue detected. This is a bug in the init script. Please report to template maintainers."

This guarantees zero false negatives. If a new variant slips through, the init fails loudly instead of silently producing a broken project.

## Goals

- **Zero template residue** after `bun run init` in any mode (`webapp`, `mobile`, `both`, `none`)
- **Green CI pipeline** on first push (typecheck + tests pass)
- **Correct IDE rules** (`.cursor/`, `.agents/` reference new identifier)
- **Clean codebase** (no wizard files, no init script)
- **Fail-fast** (init exits with error if verification finds residue)

## Non-goals

- Fixing `render.yaml` Next.js → Vite paths (separate change: `fix-render-yaml-vite-build`)
- Parsing `.gitignore` to auto-exclude ignored dirs (overkill, allowlist is sufficient)
- Generating project-specific README content (only minimal skeleton)
- Supporting re-init on already-initialized projects (not a use case)

## Affected components

- **scripts/init-project.ts** — walker, replacements, README handling, auto-uninstall, post-flight
- **scripts/init-project.smoke.test.ts** — new test cases for all 4 fixes
- **scripts/templates/README.md.template** — new file (minimal skeleton)
- **.github/workflows/*.yml** — only changed when running init (not edited in this change)
- **.cursor/.rules/*.mdc** — only changed when running init
- **.agents/skills/**, **.agents/agents/** — only changed when running init
- **AGENTS.md**, **docs/conventions/readme.md** — only changed when running init (via Title Case replacement)
- **package.json** — wizard auto-removes itself

## Success criteria

1. After `bun run init -n foo -i @foo --components webapp,mobile --skip-git-check`:
   - `rg '@dfs|ddd-fullstack-starter|DDD Fullstack Starter|fullstack-starter|\bdfs[-_]' --glob '!node_modules' --glob '!.git'` returns **0 matches**
   - `.github/workflows/typecheck.yml` and `tests.yml` reference `@foo/database`, not `@dfs/database`
   - `.cursor/.rules/project-info.mdc` says `Project Name: foo` and `Project Identifier: @foo`
   - `scripts/init-project.ts`, `scripts/init-project.smoke.test.ts`, `.agents/skills/init/` **do not exist**
   - `package.json` has no `"init"` script
   - `README.md` is the minimal skeleton with project name `foo`

2. `bun install && bun run typecheck && bun test` pass in the generated project

3. Smoke test `init-project.smoke.test.ts` (runs **from the template**, not the generated project) covers all 4 fixes

4. Init fails with exit code 1 and clear message if post-flight grep finds residue (tested with artificial residue in fixture)

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Allowlist forgets a future `.*` dir (`.opencode`, `.idea`) | Post-flight grep will detect it and init will fail → clear signal to add to allowlist |
| Replacement of `dfs-` bare matches unintended strings | Use regex with word boundary `\b` and validate with smoke test; pattern only appears in config files |
| Deleting `scripts/init-project.ts` during its own execution causes self-modification | Auto-uninstall runs as last phase after script loaded everything into memory; explicit `process.exit(0)` after unlink |
| README skeleton doesn't fit user's needs | User rewrites it; at least it's not contaminated with template content. Document in template CHANGELOG |
| Smoke test is slow (clones/initializes real project) | Reuse existing `init-project.smoke.test.ts` harness instead of creating new one |
| `--dry-run` must respect new behavior | Auto-uninstall and post-flight are dry-run aware (print what they would do, don't execute) |
| Post-flight grep has false positives | Allowlist is tight (only 4 dirs); wizard files removed before grep runs; pattern tested in smoke test |
