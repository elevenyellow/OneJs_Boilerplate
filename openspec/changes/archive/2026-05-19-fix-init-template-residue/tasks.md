# Tasks: Fix init script template residue

## Implementation order

Follow TDD inside-out: test-first for each fix, then implement, then refactor. Each task block is a logical commit.

---

## Task 1: Walker scope — process `.github`, `.cursor`, `.agents`, `.vscode`

### 1.1. Red — Write failing smoke test

**File**: `scripts/init-project.smoke.test.ts`

Add test case:

```ts
test('processes .github workflows', async () => {
  const fixture = await createFixture({
    '.github/workflows/test.yml': 'filter: @smoke/database',
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  const result = await readFile(join(fixture, '.github/workflows/test.yml'), 'utf-8')
  expect(result).toContain('@foo/database')
  expect(result).not.toContain('@smoke')
})

test('processes .cursor rules', async () => {
  const fixture = await createFixture({
    '.cursor/.rules/test.mdc': 'import { Foo } from "@smoke/common"',
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  const result = await readFile(join(fixture, '.cursor/.rules/test.mdc'), 'utf-8')
  expect(result).toContain('@foo/common')
  expect(result).not.toContain('@smoke')
})

test('processes .agents skills', async () => {
  const fixture = await createFixture({
    '.agents/skills/test/SKILL.md': 'Use `@smoke/api` for tRPC',
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  const result = await readFile(join(fixture, '.agents/skills/test/SKILL.md'), 'utf-8')
  expect(result).toContain('@foo/api')
  expect(result).not.toContain('@smoke')
})
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests fail (files not processed).

### 1.2. Green — Implement walker allowlist

**File**: `scripts/init-project.ts`

Add constant near top (after `IGNORED_DIRS`):

```ts
const PROCESSED_DOT_DIRS = new Set(['.github', '.cursor', '.agents', '.vscode'])
```

Update `findFiles()` function (line ~518):

```ts
// OLD:
if (!entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name)) {
  await scan(fullPath)
}

// NEW:
if (!IGNORED_DIRS.has(entry.name) && 
    (!entry.name.startsWith('.') || PROCESSED_DOT_DIRS.has(entry.name))) {
  await scan(fullPath)
}
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests pass.

### 1.3. Refactor — Extract helper

Extract condition to helper function for clarity:

```ts
function shouldScanDir(name: string): boolean {
  if (IGNORED_DIRS.has(name)) return false
  if (!name.startsWith('.')) return true
  return PROCESSED_DOT_DIRS.has(name)
}

// In findFiles():
if (shouldScanDir(entry.name)) {
  await scan(fullPath)
}
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests still pass.

**Commit**: `fix(init): process .github, .cursor, .agents during replacements`

---

## Task 2: Replacement variants — Title Case, slug, bare identifier

### 2.1. Red — Write failing smoke tests

**File**: `scripts/init-project.smoke.test.ts`

```ts
test('replaces Title Case template name', async () => {
  const fixture = await createFixture({
    'AGENTS.md': '# Smoke Test\n\nTemplate description.',
  })
  
  await runInit(fixture, { name: 'my-project', identifier: '@mp' })
  
  const result = await readFile(join(fixture, 'AGENTS.md'), 'utf-8')
  expect(result).toContain('# My Project')
  expect(result).not.toContain('Smoke Test')
})

test('replaces smoke-test slug', async () => {
  const fixture = await createFixture({
    'docs/test.md': 'Based on smoke-test template.',
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  const result = await readFile(join(fixture, 'docs/test.md'), 'utf-8')
  expect(result).toContain('Based on foo template')
  expect(result).not.toContain('smoke-test')
})

test('replaces bare identifier with hyphen', async () => {
  const fixture = await createFixture({
    'render.yaml': 'name: smoke-test-webapp\n  databaseName: smoke_test',
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  const result = await readFile(join(fixture, 'render.yaml'), 'utf-8')
  expect(result).toContain('name: foo-webapp')
  expect(result).toContain('databaseName: foo')
  expect(result).not.toContain('smoke-test-')
  expect(result).not.toContain('smoke_test')
})

test('replaces bare identifier with underscore', async () => {
  const fixture = await createFixture({
    'render.yaml': 'user: smoke-test_user',
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  const result = await readFile(join(fixture, 'render.yaml'), 'utf-8')
  expect(result).toContain('user: foo_user')
  expect(result).not.toContain('smoke-test_')
})
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests fail (patterns not replaced).

### 2.2. Green — Implement extended replacements

**File**: `scripts/init-project.ts`

Add helper function:

```ts
function toTitleCase(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
```

Update `replaceInFiles()` function (line ~676):

```ts
// Build replacement list (order matters: longest first)
const replacements: Array<{ old: string; new: string }> = [
  // Title Case variant (must come before slug)
  { old: 'Smoke Test', new: toTitleCase(config.projectName) },
  
  // Slug variants (longest first)
  { old: CURRENT_NAME, new: config.projectName },
  { old: 'smoke-test', new: config.projectName },
  
  // Identifier variants
  { old: CURRENT_IDENTIFIER, new: config.identifier },
  { old: CURRENT_APP_SCHEME, new: config.appScheme },
]

// Add description if provided
if (config.projectDescription) {
  replacements.push({ old: CURRENT_DESCRIPTION, new: config.projectDescription })
}
```

Update `replaceInFile()` function to add regex pass after string replacements:

```ts
async function replaceInFile(
  filePath: string,
  replacements: Array<{ old: string; new: string }>,
  identifier: string,  // NEW parameter
  dryRun: boolean,
): Promise<ReplaceResult> {
  try {
    let content = await readFile(filePath, 'utf-8')
    let changed = false

    // String replacements
    for (const { old: oldValue, new: newValue } of replacements) {
      if (content.includes(oldValue)) {
        try {
          content = content.replaceAll(oldValue, newValue)
          changed = true
        } catch (error) {
          console.error(`  Warning: Could not replace in ${filePath}:`, error)
        }
      }
    }

    // Regex replacement for bare identifier with separators
    const idWithoutAt = identifier.replace(/^@/, '')
    const bareIdRegex = /\bsmoke-test([-_])/g
    if (bareIdRegex.test(content)) {
      content = content.replace(bareIdRegex, `${idWithoutAt}$1`)
      changed = true
    }

    if (changed && !dryRun) {
      await writeFile(filePath, content, 'utf-8')
    }

    return { changed, path: filePath }
  } catch (error) {
    return { changed: false, path: filePath, error: error as Error }
  }
}
```

Update call sites to pass `config.identifier`:

```ts
const result = await replaceInFile(file.path, replacements, config.identifier, config.dryRun)
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests pass.

### 2.3. Refactor — Extract replacement builder

Extract replacement list construction to separate function:

```ts
function buildReplacements(config: InitConfig): Array<{ old: string; new: string }> {
  const replacements: Array<{ old: string; new: string }> = [
    { old: 'Smoke Test', new: toTitleCase(config.projectName) },
    { old: CURRENT_NAME, new: config.projectName },
    { old: 'smoke-test', new: config.projectName },
    { old: CURRENT_IDENTIFIER, new: config.identifier },
    { old: CURRENT_APP_SCHEME, new: config.appScheme },
  ]

  if (config.projectDescription) {
    replacements.push({ old: CURRENT_DESCRIPTION, new: config.projectDescription })
  }

  return replacements
}

// In replaceInFiles():
const replacements = buildReplacements(config)
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests still pass.

**Commit**: `fix(init): cover Title Case and bare variants of template identifier`

---

## Task 3: README handling — replace with minimal skeleton

### 3.1. Red — Write failing smoke tests

**File**: `scripts/init-project.smoke.test.ts`

```ts
test('replaces template README with skeleton', async () => {
  const fixture = await createFixture({
    'README.md': `# Smoke Test

[![Use this template](https://img.shields.io/badge/use%20this-template-blue)](https://github.com/elevenyellow/smoke-test/generate)

## What the Init Script Does

...template content...`,
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo', components: 'webapp' })
  
  const result = await readFile(join(fixture, 'README.md'), 'utf-8')
  expect(result).toContain('# foo')
  expect(result).toContain('bun install')
  expect(result).toContain('bun run webapp')
  expect(result).not.toContain('What the Init Script Does')
  expect(result).not.toContain('use this template')
})

test('preserves custom README', async () => {
  const customContent = '# My Custom Project\n\nThis is my project.'
  const fixture = await createFixture({
    'README.md': customContent,
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  const result = await readFile(join(fixture, 'README.md'), 'utf-8')
  expect(result).toBe(customContent)
})

test('README skeleton adapts to components', async () => {
  const fixture = await createFixture({
    'README.md': '# Smoke Test\n\n## What the Init Script Does',
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo', components: 'mobile' })
  
  const result = await readFile(join(fixture, 'README.md'), 'utf-8')
  expect(result).toContain('bun run mobile')
  expect(result).not.toContain('bun run webapp')
})
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests fail (README not replaced).

### 3.2. Green — Implement README handling

**File**: `scripts/templates/README.md.template` (new file)

```markdown
# {{PROJECT_NAME}}

> Generated from [smoke-test](https://github.com/elevenyellow/smoke-test)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.13{{#HAS_DATABASE}}
- Docker or Podman (for PostgreSQL{{#HAS_REDIS}} and Redis{{/HAS_REDIS}}){{/HAS_DATABASE}}

### Installation

\`\`\`bash
bun install
\`\`\`

### Development

{{#HAS_DATABASE}}
\`\`\`bash
# Start database services
bun run dbs

# Sync database schema
bun run db:sync
\`\`\`
{{/HAS_DATABASE}}

{{#HAS_WEBAPP}}
\`\`\`bash
# Start web application (localhost:3000)
bun run webapp
\`\`\`
{{/HAS_WEBAPP}}

{{#HAS_MOBILE}}
\`\`\`bash
# Start mobile app
bun run mobile
\`\`\`
{{/HAS_MOBILE}}

{{#HAS_API}}
\`\`\`bash
# Start API server (localhost:4000)
bun run api
\`\`\`
{{/HAS_API}}

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

**File**: `scripts/init-project.ts`

Add helper functions:

```ts
function isTemplateReadme(content: string): boolean {
  return (
    content.includes('What the Init Script Does') ||
    content.includes('use this template') ||
    content.includes('github.com/elevenyellow/smoke-test/generate')
  )
}

function generateReadmeSkeleton(config: InitConfig): string {
  const templatePath = join(__dirname, 'templates', 'README.md.template')
  let template = readFileSync(templatePath, 'utf-8')

  const hasDatabase = config.components !== 'none'
  const hasWebapp = config.components === 'both' || config.components === 'webapp'
  const hasMobile = config.components === 'both' || config.components === 'mobile'
  const hasApi = hasDatabase // API exists if database exists
  const hasRedis = config.includeRedis && hasDatabase

  // Simple template replacement (Mustache-style)
  template = template.replace(/\{\{PROJECT_NAME\}\}/g, config.projectName)

  // Conditional blocks
  template = processConditional(template, 'HAS_DATABASE', hasDatabase)
  template = processConditional(template, 'HAS_WEBAPP', hasWebapp)
  template = processConditional(template, 'HAS_MOBILE', hasMobile)
  template = processConditional(template, 'HAS_API', hasApi)
  template = processConditional(template, 'HAS_REDIS', hasRedis)

  return template
}

function processConditional(template: string, tag: string, condition: boolean): string {
  const regex = new RegExp(`\\{\\{#${tag}\\}\\}([\\s\\S]*?)\\{\\{\\/${tag}\\}\\}`, 'g')
  return template.replace(regex, condition ? '$1' : '')
}

async function handleReadme(config: InitConfig): Promise<void> {
  const readmePath = join(config.rootDir, 'README.md')
  
  try {
    const currentContent = await readFile(readmePath, 'utf-8')
    
    if (!isTemplateReadme(currentContent)) {
      console.log('  ℹ README.md appears to be customized, leaving untouched')
      return
    }
    
    if (config.dryRun) {
      console.log('  [DRY RUN] Would replace README.md with minimal skeleton')
      return
    }
    
    const skeleton = generateReadmeSkeleton(config)
    await writeFile(readmePath, skeleton, 'utf-8')
    console.log('  ✓ Replaced README.md with minimal skeleton')
  } catch (error) {
    console.error('  Warning: Could not handle README.md:', error)
  }
}
```

Add to main execution flow (after `replaceInFiles`, before summary):

```ts
// Handle README
await handleReadme(config)
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests pass.

**Commit**: `feat(init): replace README with minimal skeleton on init`

---

## Task 4: Auto-uninstall wizard files

### 4.1. Red — Write failing smoke test

**File**: `scripts/init-project.smoke.test.ts`

```ts
test('removes wizard files after init', async () => {
  const fixture = await createFixture({
    '.agents/skills/init/SKILL.md': 'Init wizard skill',
    'scripts/init-project.ts': 'console.log("init")',
    'scripts/init-project.smoke.test.ts': 'test("init")',
    'package.json': JSON.stringify({
      name: 'test',
      scripts: { init: 'bun run scripts/init-project.ts', dev: 'bun run api' },
    }),
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  expect(existsSync(join(fixture, '.agents/skills/init'))).toBe(false)
  expect(existsSync(join(fixture, 'scripts/init-project.ts'))).toBe(false)
  expect(existsSync(join(fixture, 'scripts/init-project.smoke.test.ts'))).toBe(false)
  
  const pkg = JSON.parse(await readFile(join(fixture, 'package.json'), 'utf-8'))
  expect(pkg.scripts.init).toBeUndefined()
  expect(pkg.scripts.dev).toBe('bun run api') // Other scripts preserved
})
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Test fails (wizard files still exist).

### 4.2. Green — Implement auto-uninstall

**File**: `scripts/init-project.ts`

Add helper functions:

```ts
async function removeWizardFiles(config: InitConfig): Promise<void> {
  if (config.dryRun) {
    console.log('\n🗑️  [DRY RUN] Would remove wizard files:')
    console.log('  - .agents/skills/init/')
    console.log('  - scripts/init-project.ts')
    console.log('  - scripts/init-project.smoke.test.ts')
    console.log('  - "init" script from package.json')
    return
  }

  console.log('\n🗑️  Removing wizard files...')

  const filesToRemove = [
    join(config.rootDir, '.agents/skills/init'),
    join(config.rootDir, 'scripts/init-project.ts'),
    join(config.rootDir, 'scripts/init-project.smoke.test.ts'),
  ]

  for (const path of filesToRemove) {
    try {
      const stat = await lstat(path)
      if (stat.isDirectory()) {
        await rm(path, { recursive: true, force: true })
      } else {
        await unlink(path)
      }
      console.log(`  ✓ Removed ${path.replace(config.rootDir + '/', '')}`)
    } catch (error) {
      // File might not exist, that's OK
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`  Warning: Could not remove ${path}:`, error)
      }
    }
  }

  // Remove init script from package.json
  try {
    const pkgPath = join(config.rootDir, 'package.json')
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
    
    if (pkg.scripts?.init) {
      delete pkg.scripts.init
      await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
      console.log('  ✓ Removed "init" script from package.json')
    }
  } catch (error) {
    console.error('  Warning: Could not update package.json:', error)
  }
}
```

Add to main execution flow (after `handleReadme`, before summary):

```ts
// Remove wizard files
await removeWizardFiles(config)
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Test passes.

**Commit**: `feat(init): auto-remove wizard files after successful init`

---

## Task 5: Post-flight verification — fail-hard on residue ✅

**Status**: Completed

**Implementation summary**:
- Added `CURRENT_NAME_TITLE` constant to detect "Smoke Test" (Title Case)
- Updated `FileChange` interface with `hasNameTitle` field
- Updated `analyzeFile()` to detect Title Case template name
- Implemented `postflightVerify()` with ripgrep fallback to JS scan
- Implemented `postflightVerifyFallback()` with allowlist for files that can legitimately reference the template (README.md, agent files)
- Added post-flight call in `main()` after wizard removal and before success message
- Added smoke test "post-flight passes on clean project"
- All 23 smoke tests passing

**Files modified**:
- `scripts/init-project.ts`: Added post-flight verification functions and constants
- `scripts/init-project.smoke.test.ts`: Added post-flight test

### 5.1. Red — Write failing smoke test ✅

**File**: `scripts/init-project.smoke.test.ts`

```ts
test('post-flight fails on residue', async () => {
  const fixture = await createFixture({
    'src/test.ts': 'import { Foo } from "@smoke/common"',
  })
  
  const result = await runInitExpectFail(fixture, { name: 'foo', identifier: '@foo' })
  
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain('Template residue detected')
  expect(result.stderr).toContain('src/test.ts')
})

test('post-flight passes on clean project', async () => {
  const fixture = await createFixture({
    'src/test.ts': 'import { Foo } from "@foo/common"',
  })
  
  const result = await runInit(fixture, { name: 'foo', identifier: '@foo' })
  
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain('No template residue found')
})
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests fail (post-flight not implemented).

### 5.2. Green — Implement post-flight verification

**File**: `scripts/init-project.ts`

Add helper functions:

```ts
const RESIDUE_PATTERNS = [
  '@smoke',
  'smoke-test',
  'Smoke Test',
  'smoke-test',
  '\\bsmoke-test[-_]',
]

async function postflightVerify(config: InitConfig): Promise<void> {
  if (config.dryRun) {
    console.log('\n🔍 [DRY RUN] Would verify no template residue remains')
    return
  }

  console.log('\n🔍 Running post-flight verification...')

  const pattern = RESIDUE_PATTERNS.join('|')

  // Try ripgrep first (faster)
  try {
    const result = await exec(
      `rg '${pattern}' --glob '!node_modules' --glob '!.git' --files-with-matches`,
      { cwd: config.rootDir }
    )

    if (result.exitCode === 0) {
      // Found matches
      const files = result.stdout.trim().split('\n').filter(Boolean)
      console.error('\n❌ Template residue detected in the following files:')
      for (const file of files) {
        console.error(`   - ${file}`)
      }
      console.error('\nThis is a bug in the init script.')
      console.error('Please report to: https://github.com/elevenyellow/smoke-test/issues')
      process.exit(1)
    }

    if (result.exitCode === 1) {
      // No matches (success)
      console.log('  ✓ No template residue found')
      return
    }
  } catch (error) {
    // rg not found or error, fall back to JS scan
  }

  // Fallback: manual scan
  await postflightVerifyFallback(config)
}

async function postflightVerifyFallback(config: InitConfig): Promise<void> {
  const files = await findFiles(config.rootDir, EXTENSIONS_TO_UPDATE)
  const residueFiles: string[] = []

  const regex = new RegExp(RESIDUE_PATTERNS.join('|'), 'g')

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8')
      if (regex.test(content)) {
        residueFiles.push(file.replace(`${config.rootDir}/`, ''))
      }
    } catch (error) {
      // Skip files that can't be read
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

// Helper for exec (if not already present)
async function exec(
  command: string,
  options: { cwd: string }
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, { cwd: options.cwd, shell: true })
    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (data) => (stdout += data.toString()))
    proc.stderr?.on('data', (data) => (stderr += data.toString()))

    proc.on('close', (code) => {
      resolve({ exitCode: code ?? 0, stdout, stderr })
    })
  })
}
```

Add to main execution flow (after `removeWizardFiles`, before summary):

```ts
// Post-flight verification
await postflightVerify(config)
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests pass.

**Commit**: `feat(init): fail hard if post-flight grep finds template residue`

---

## Task 6: Dry-run compliance

### 6.1. Test dry-run behavior

**File**: `scripts/init-project.smoke.test.ts`

```ts
test('dry-run does not remove wizard files', async () => {
  const fixture = await createFixture({
    '.agents/skills/init/SKILL.md': 'Init wizard',
    'scripts/init-project.ts': 'console.log("init")',
  })
  
  await runInit(fixture, { name: 'foo', identifier: '@foo', dryRun: true })
  
  expect(existsSync(join(fixture, '.agents/skills/init/SKILL.md'))).toBe(true)
  expect(existsSync(join(fixture, 'scripts/init-project.ts'))).toBe(true)
})

test('dry-run does not fail on residue', async () => {
  const fixture = await createFixture({
    'src/test.ts': 'import { Foo } from "@smoke/common"',
  })
  
  const result = await runInit(fixture, { name: 'foo', identifier: '@foo', dryRun: true })
  
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain('[DRY RUN]')
})
```

Run: `bun test scripts/init-project.smoke.test.ts`

**Expected**: Tests pass (dry-run already implemented in previous tasks).

---

## Task 7: Integration test — full end-to-end

### 7.1. Manual test

```bash
# From template root
cd /tmp
git clone git@github.com:elevenyellow/smoke-test.git test-init-residue
cd test-init-residue

# Run init
bun run init -n test-project -i @test --components webapp --skip-git-check

# Verify no residue
rg '@smoke|smoke-test|Smoke Test|smoke-test|\bsmoke-test[-_]' \
   --glob '!node_modules' --glob '!.git'

# Should output: (no matches)

# Verify wizard files removed
ls .agents/skills/init  # should not exist
ls scripts/init-project.ts  # should not exist

# Verify README
head -5 README.md  # should show "# test-project"

# Verify project works
bun install
bun run typecheck
bun test
```

**Expected**: All commands succeed, no residue found.

---

## Task 8: Mandatory review gate

### 8.1. Run code review

```bash
# From template root
git add -A
git status
```

Run three reviews in parallel:

- `/task-code-review` on `scripts/init-project.ts`
- `/task-tests-review` on `scripts/init-project.smoke.test.ts`
- `/task-architecture-review` on `scripts/` (should be N/A, but run for completeness)

### 8.2. Address findings

Fix any issues found by reviewers.

### 8.3. Validate

```bash
bun run lint:fix
bun run typecheck
bun test
```

**Expected**: All pass.

---

## Task 9: Commit and summary

### 9.1. Review changes

```bash
git status
git diff --staged
```

### 9.2. Commit

Already committed incrementally in tasks 1-5. If squashing:

```bash
git reset --soft HEAD~5
git commit -m "fix(init): eliminate template residue in generated projects

- Process .github, .cursor, .agents during replacements
- Cover Title Case and bare identifier variants
- Replace README with minimal skeleton
- Auto-remove wizard files after init
- Fail hard if post-flight verification finds residue

Fixes issues discovered in Dermoscan project initialization."
```

### 9.3. Summary

Print summary of changes:

```
✓ Walker now processes 4 dot-directories: .github, .cursor, .agents, .vscode
✓ Replacements cover 6 patterns including Title Case and bare variants
✓ README replaced with minimal skeleton (or preserved if custom)
✓ Wizard files auto-removed: .agents/skills/init/, scripts/init-project.{ts,smoke.test.ts}, package.json "init" script
✓ Post-flight verification fails hard if any residue found
✓ All smoke tests pass
✓ Manual integration test confirms zero residue
```

---

## Verification checklist

Before marking this change complete:

- [ ] All smoke tests pass: `bun test scripts/init-project.smoke.test.ts`
- [ ] Manual integration test passes (see Task 7.1)
- [ ] `bun run lint:fix` passes
- [ ] `bun run typecheck` passes
- [ ] `bun test` (full suite) passes
- [ ] Code review, tests review, architecture review completed
- [ ] Commits follow Conventional Commits format
- [ ] No `@ts-ignore` or `as any` introduced
- [ ] README.md.template exists and is valid
- [ ] Post-flight verification tested with artificial residue

---

## Notes

- **Test execution**: Smoke tests run **from the template**, not from generated projects. They create fixtures, run init, and verify results.
- **Self-modification**: The script deletes itself (`scripts/init-project.ts`) as the last step. This is safe because the script is already loaded into memory.
- **Dry-run**: All new phases respect `--dry-run` and print what they would do without executing.
- **Backward compatibility**: All changes are additive. Existing flags and behavior unchanged.
- **Performance**: ~200-700ms overhead from new phases. Acceptable for one-time operation.
