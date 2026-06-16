# Design: Fix init script template residue

## Overview

This change fixes 4 root causes of template residue in generated projects by modifying `scripts/init-project.ts` in 5 phases:

1. **Walker scope** — extend directory scanning to process `.github`, `.cursor`, `.agents`, `.vscode`
2. **Replacement variants** — add Title Case, slug variants, and bare identifier patterns
3. **README handling** — replace template README with minimal skeleton
4. **Auto-uninstall** — remove wizard files after successful init
5. **Post-flight verification** — fail-hard if any residue remains

All changes are **backward compatible** — existing init usage without these fixes continues to work (just with residue). The fixes are additive.

## 1. Walker scope change

### Current behavior

```ts
// scripts/init-project.ts:518
if (!entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name)) {
  await scan(fullPath)
}
```

This skips **all** dot-directories, including `.github`, `.cursor`, `.agents`.

### New behavior

```ts
const PROCESSED_DOT_DIRS = new Set(['.github', '.cursor', '.agents', '.vscode'])

if (!IGNORED_DIRS.has(entry.name) && 
    (!entry.name.startsWith('.') || PROCESSED_DOT_DIRS.has(entry.name))) {
  await scan(fullPath)
}
```

**Logic**: Process a directory if:
- It's not in `IGNORED_DIRS` (`.git`, `.next`, `.turbo`, etc.) **AND**
- Either it doesn't start with `.` **OR** it's in the allowlist

### Why allowlist instead of blocklist?

- **Safety**: Unknown dot-directories (`.cache`, `.bun`, `.idea`, `.vscode-test`) stay ignored by default
- **Explicit**: Clear which dirs are processed; easy to audit
- **Future-proof**: Adding `.opencode` or other dirs requires conscious decision

### Files affected by this change

When walker starts processing these dirs, replacements will reach:

| Directory | File count | Extensions | Contains |
|---|---|---|---|
| `.github/workflows/` | 3 | `.yml` | `@smoke/database` in typecheck/tests workflows |
| `.cursor/.rules/` | 7 | `.mdc` | `@smoke/...` imports, project name, identifier |
| `.agents/skills/` | ~15 | `.md` | `@smoke/api`, `@smoke/ui`, template name in descriptions |
| `.agents/agents/` | 7 | `.md` | Template name in frontmatter |
| `.vscode/` | 0-2 | `.json` | (Optional, user-created; safe to process) |

All these extensions are already in `EXTENSIONS_TO_UPDATE` (line 19), so no change needed there.

## 2. Replacement variants

### Current replacements

```ts
const replacements: Array<{ old: string; new: string }> = [
  { old: CURRENT_IDENTIFIER, new: config.identifier },        // @smoke → @foo
  { old: CURRENT_NAME, new: config.projectName },             // smoke-test → foo
  { old: CURRENT_DESCRIPTION, new: config.projectDescription }, // (optional)
  { old: CURRENT_APP_SCHEME, new: config.appScheme },         // smoke-test → foo
]
```

### Extended replacements

```ts
const replacements: Array<{ old: string; new: string }> = [
  // Title Case variant (must come before slug to avoid partial match)
  { old: 'Smoke Test', new: toTitleCase(config.projectName) },
  
  // Slug variants (order matters: longest first)
  { old: CURRENT_NAME, new: config.projectName },             // smoke-test → foo
  { old: 'smoke-test', new: config.projectName },      // smoke-test → foo
  
  // Identifier variants
  { old: CURRENT_IDENTIFIER, new: config.identifier },        // @smoke → @foo
  { old: CURRENT_APP_SCHEME, new: config.appScheme },         // smoke-test → foo (Expo scheme)
  
  // Optional description
  ...(config.projectDescription 
    ? [{ old: CURRENT_DESCRIPTION, new: config.projectDescription }] 
    : []),
]
```

**Plus** a separate regex-based pass for bare identifier with separators:

```ts
// After string replacements, apply regex for bare identifier variants
const idWithoutAt = config.identifier.replace(/^@/, '')
content = content.replace(/\bsmoke-test([-_])/g, `${idWithoutAt}$1`)
```

This handles:
- `smoke-test-webapp` → `foo-webapp`
- `smoke-test_user` → `foo_user`
- `databaseName: smoke_test` → `databaseName: foo` (via slug replacement above)

### Why separate regex pass?

String replacements are simpler and safer for exact matches. Regex is only needed for the bare identifier pattern where we need to preserve the separator (`-` or `_`). Doing it in two passes keeps the logic clear.

### Helper: `toTitleCase()`

```ts
function toTitleCase(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Examples:
// 'dermoscan' → 'Dermoscan'
// 'my-awesome-project' → 'My Awesome Project'
```

### Order matters

Replacements run in array order. `Smoke Test` must come before `smoke-test` because the latter is a substring. If we did it reversed:

```
"Smoke Test" 
→ (replace smoke-test with foo) 
→ "DDD foo Starter"  ❌ wrong
```

Correct order:
```
"Smoke Test" 
→ (replace Smoke Test with Dermoscan) 
→ "Dermoscan"  ✓
```

## 3. README handling

### Detection heuristic

```ts
function isTemplateReadme(content: string): boolean {
  return content.includes('What the Init Script Does') ||
         content.includes('use this template') ||
         content.includes('github.com/elevenyellow/smoke-test/generate')
}
```

If any of these strings are present, it's the template README.

### Replacement flow

```ts
async function handleReadme(config: InitConfig): Promise<void> {
  const readmePath = join(config.rootDir, 'README.md')
  const currentContent = await readFile(readmePath, 'utf-8')
  
  if (!isTemplateReadme(currentContent)) {
    console.log('  ℹ README.md appears to be customized, leaving untouched')
    return
  }
  
  if (config.dryRun) {
    console.log('  [DRY RUN] Would replace README.md with minimal skeleton')
    return
  }
  
  const skeleton = await generateReadmeSkeleton(config)
  await writeFile(readmePath, skeleton, 'utf-8')
  console.log('  ✓ Replaced README.md with minimal skeleton')
}
```

### Skeleton template

Lives in `scripts/templates/README.md.template`:

```markdown
# {{PROJECT_NAME}}

> Generated from [smoke-test](https://github.com/elevenyellow/smoke-test)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.13
- Docker or Podman (for PostgreSQL{{#REDIS}} and Redis{{/REDIS}})

### Installation

\`\`\`bash
bun install
\`\`\`

### Development

\`\`\`bash
# Start database services
bun run dbs

# Sync database schema
bun run db:sync

{{#WEBAPP}}
# Start web application (localhost:3000)
bun run webapp
{{/WEBAPP}}

{{#MOBILE}}
# Start mobile app
bun run mobile
{{/MOBILE}}

{{#API}}
# Start API server (localhost:4000)
bun run api
{{/API}}
\`\`\`

### Code Quality

\`\`\`bash
bun run lint:fix    # Auto-fix linting issues
bun run typecheck   # TypeScript type checking
bun test            # Run tests
\`\`\`

## Documentation

See [docs/](./docs/) for architecture, conventions, and development guides.

## License

[MIT](./LICENSE)
```

Template uses Mustache-style placeholders. The `generateReadmeSkeleton()` function replaces them based on `config.components`.

### Why not just delete README?

GitHub shows a warning for repos without README. A minimal skeleton is better than nothing and gives new developers immediate orientation.

## 4. Auto-uninstall wizard files

### Files to remove

```ts
const WIZARD_FILES = [
  '.agents/skills/init',                    // entire directory
  'scripts/init-project.ts',
  'scripts/init-project.smoke.test.ts',
]
```

### package.json script removal

```ts
async function removeInitScript(rootDir: string): Promise<void> {
  const pkgPath = join(rootDir, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  
  if (pkg.scripts?.init) {
    delete pkg.scripts.init
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  }
}
```

### Execution order

Auto-uninstall runs **after** all replacements and README handling, but **before** post-flight verification. This ensures:

1. Wizard files don't interfere with post-flight grep (they contain legitimate `@smoke`)
2. If post-flight fails, wizard files are already gone (user can't re-run init to fix it; must report bug)

### Dry-run behavior

```ts
if (config.dryRun) {
  console.log('  [DRY RUN] Would remove wizard files:')
  for (const file of WIZARD_FILES) {
    console.log(`    - ${file}`)
  }
  console.log('  [DRY RUN] Would remove "init" script from package.json')
  return
}
```

### Self-modification safety

The script deletes itself (`scripts/init-project.ts`) while running. This is safe because:

1. Node.js/Bun loads the entire script into memory before execution
2. Deleting the file on disk doesn't affect the running process
3. We call `process.exit(0)` immediately after uninstall to prevent any post-uninstall code from trying to access the deleted file

## 5. Post-flight verification

### Grep patterns

```ts
const RESIDUE_PATTERNS = [
  '@smoke',
  'smoke-test',
  'Smoke Test',
  'smoke-test',
  '\\bsmoke-test[-_]',  // regex: word boundary + smoke-test + hyphen or underscore
]
```

### Implementation

Use `ripgrep` (faster, respects `.gitignore` by default) if available, fall back to regex-based JS scan:

```ts
async function postflightVerify(rootDir: string): Promise<void> {
  console.log('\n🔍 Running post-flight verification...')
  
  const pattern = RESIDUE_PATTERNS.join('|')
  
  // Try ripgrep first
  const rgResult = await exec(
    `rg '${pattern}' --glob '!node_modules' --glob '!.git' --files-with-matches`,
    { cwd: rootDir, ignoreExitCode: true }
  )
  
  if (rgResult.exitCode === 0) {
    // Found matches
    const files = rgResult.stdout.trim().split('\n').filter(Boolean)
    console.error('\n❌ Template residue detected in the following files:')
    for (const file of files) {
      console.error(`   - ${file}`)
    }
    console.error('\nThis is a bug in the init script.')
    console.error('Please report to: https://github.com/elevenyellow/smoke-test/issues')
    process.exit(1)
  }
  
  if (rgResult.exitCode === 1) {
    // No matches (success)
    console.log('  ✓ No template residue found')
    return
  }
  
  // Exit code 2 = rg not found or error; fall back to JS scan
  await postflightVerifyFallback(rootDir)
}
```

### Fallback implementation

If `rg` is not available, scan files manually:

```ts
async function postflightVerifyFallback(rootDir: string): Promise<void> {
  const files = await findFiles(rootDir, EXTENSIONS_TO_UPDATE)
  const residueFiles: string[] = []
  
  const regex = new RegExp(RESIDUE_PATTERNS.join('|'), 'g')
  
  for (const file of files) {
    const content = await readFile(file, 'utf-8')
    if (regex.test(content)) {
      residueFiles.push(file.replace(`${rootDir}/`, ''))
    }
  }
  
  if (residueFiles.length > 0) {
    console.error('\n❌ Template residue detected in the following files:')
    for (const file of residueFiles) {
      console.error(`   - ${file}`)
    }
    console.error('\nThis is a bug in the init script.')
    console.error('Please report to: https://github.com/elevenyellow/smoke-test/issues')
    process.exit(1)
  }
  
  console.log('  ✓ No template residue found')
}
```

### Dry-run behavior

```ts
if (config.dryRun) {
  console.log('  [DRY RUN] Would verify no template residue remains')
  return
}
```

### Why fail-hard instead of warning?

A warning is easy to miss in CI logs. Failing hard ensures:

1. CI catches the issue immediately
2. User knows something is wrong before pushing to production
3. Template maintainers get bug reports instead of silent failures

## Execution flow

### New phase order

```
1. Parse CLI args
2. Gather config (interactive or from flags)
3. findFiles() + analyzeFile()          ← walker scope change applies here
4. createBackup() (if not --no-backup)
5. replaceInFiles()                     ← extended replacements apply here
6. handleReadme()                       ← NEW
7. removeWizardFiles()                  ← NEW
8. postflightVerify()                   ← NEW
9. printSummary()
10. process.exit(0)
```

### Error handling

Each phase can fail independently:

| Phase | Failure mode | Exit code |
|---|---|---|
| findFiles() | Permission denied, disk error | 1 |
| createBackup() | Disk full, permission denied | 1 |
| replaceInFiles() | Write error | 1 |
| handleReadme() | Template file missing | 1 |
| removeWizardFiles() | Permission denied | 1 |
| postflightVerify() | Residue found | 1 |

All errors print clear messages and exit immediately. No partial state (backup can be restored).

## Testing strategy

### Smoke test structure

Extend `scripts/init-project.smoke.test.ts` with new test cases:

```ts
describe('Init script residue fixes', () => {
  test('processes .github workflows', async () => {
    // Create fixture with .github/workflows/test.yml containing @smoke
    // Run init
    // Assert .github/workflows/test.yml contains new identifier
  })
  
  test('processes .cursor rules', async () => {
    // Create fixture with .cursor/.rules/test.mdc containing @smoke
    // Run init
    // Assert .cursor/.rules/test.mdc contains new identifier
  })
  
  test('processes .agents skills and agents', async () => {
    // Create fixture with .agents/skills/test/SKILL.md containing @smoke
    // Run init
    // Assert .agents/skills/test/SKILL.md contains new identifier
  })
  
  test('replaces Title Case template name', async () => {
    // Create fixture with "Smoke Test" in AGENTS.md
    // Run init with project name "my-project"
    // Assert AGENTS.md contains "My Project"
  })
  
  test('replaces bare identifier variants', async () => {
    // Create fixture with smoke-test-webapp, smoke-test_user in render.yaml
    // Run init with identifier @foo
    // Assert render.yaml contains foo-webapp, foo_user
  })
  
  test('replaces README with skeleton', async () => {
    // Create fixture with template README
    // Run init
    // Assert README contains project name and minimal structure
  })
  
  test('preserves custom README', async () => {
    // Create fixture with custom README (no template markers)
    // Run init
    // Assert README unchanged
  })
  
  test('removes wizard files', async () => {
    // Run init
    // Assert .agents/skills/init/ does not exist
    // Assert scripts/init-project.ts does not exist
    // Assert package.json has no "init" script
  })
  
  test('post-flight fails on residue', async () => {
    // Create fixture with artificial residue (@smoke in a random file)
    // Run init
    // Assert exit code 1
    // Assert error message mentions the file
  })
  
  test('post-flight passes on clean project', async () => {
    // Run init normally
    // Assert exit code 0
    // Assert success message
  })
})
```

### Integration test

Full end-to-end test:

```bash
# From template root
bun run init -n test-project -i @test --components webapp --skip-git-check --target-dir /tmp/test-init

# Verify
cd /tmp/test-init
rg '@smoke|smoke-test|Smoke Test|smoke-test|\bsmoke-test[-_]' \
   --glob '!node_modules' --glob '!.git' || echo "✓ No residue"

bun install
bun run typecheck
bun test
```

If all pass, the fix is complete.

## Backward compatibility

All changes are **additive**:

- Existing `--components`, `--postgres-port`, etc. flags work unchanged
- Existing `.env.local` generation unchanged
- Existing backup mechanism unchanged
- New phases (README, auto-uninstall, post-flight) only add behavior

Projects initialized with the old script continue to work (just with residue). No migration needed.

## Performance impact

| Phase | Current | New | Delta |
|---|---|---|---|
| findFiles() | ~500 files | ~550 files (+50 from dot-dirs) | +10% |
| replaceInFiles() | 4 patterns | 6 patterns + 1 regex | +50% per file, negligible overall |
| handleReadme() | N/A | 1 file read + 1 write | <100ms |
| removeWizardFiles() | N/A | 3 unlink + 1 JSON edit | <50ms |
| postflightVerify() | N/A | 1 rg call or full scan | 100-500ms |

**Total overhead**: ~200-700ms on a typical project. Acceptable for a one-time init operation.

## Rollback plan

If this change causes issues:

1. Revert the commit
2. Projects already initialized with the new script are **not affected** (init only runs once)
3. New projects fall back to old behavior (with residue, but functional)

No data loss risk — backup mechanism unchanged.
