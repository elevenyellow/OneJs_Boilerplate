# Tasks: Add `--target-dir` flag to init script

## Implementation order

Tasks follow inside-out TDD where applicable. For pure infrastructure tasks (CLI parsing, git operations), we write tests first then implement.

---

## Group 1: Test infrastructure

### Task 1.1: Add smoke test fixture for git clone mock

**Type**: Infrastructure (no TDD)

**What**: Create a minimal template fixture in `scripts/fixtures/template-minimal/` that can be copied instead of cloning from GitHub during tests.

**Steps**:
1. Create `scripts/fixtures/template-minimal/` directory
2. Add minimal `package.json` with `name: "smoke-test"`
3. Add `.gitkeep` files to represent template structure
4. This fixture will be used by tests to mock `git clone`

**Acceptance**:
- Fixture exists at `scripts/fixtures/template-minimal/`
- Contains `package.json` with correct name
- Can be copied to simulate a clone

---

### Task 1.2: Add smoke test cases for target-dir mode

**Type**: Test-first

**RED**: Write failing smoke tests in `scripts/init-project.smoke.test.ts`:

```typescript
describe('init with --target-dir', () => {
  test('creates and clones into non-existent directory', async () => {
    // Given: target-dir does not exist
    // When: run init with --target-dir
    // Then: directory created, template cloned, init succeeds, exit 0
  })
  
  test('clones into empty directory', async () => {
    // Given: target-dir exists but is empty
    // When: run init with --target-dir
    // Then: template cloned, init succeeds, exit 0
  })
  
  test('fails on non-empty directory without --force', async () => {
    // Given: target-dir has files
    // When: run init with --target-dir (no --force)
    // Then: exit code 1, error message contains "not empty"
  })
  
  test('proceeds on non-empty directory with --force', async () => {
    // Given: target-dir has files
    // When: run init with --target-dir --force
    // Then: init proceeds, warning emitted, exit 0
  })
  
  test('emits valid JSON in quiet mode on success', async () => {
    // Given: valid flags with --quiet
    // When: run init
    // Then: stdout is valid JSON, status="ok", exit 0
  })
  
  test('emits error JSON in quiet mode on failure', async () => {
    // Given: invalid flags (non-empty dir, no force) with --quiet
    // When: run init
    // Then: stdout is valid JSON, status="error", exit 1
  })
  
  test('clones specified ref/branch', async () => {
    // Given: --ref custom-branch
    // When: run init with --target-dir
    // Then: git clone called with --branch custom-branch (mock verification)
  })
  
  test('resets git history after clone', async () => {
    // Given: successful clone
    // When: check .git in target-dir
    // Then: git log shows only 1 commit: "chore: initialize from smoke-test"
  })
  
  test('backward compat: no target-dir works as before', async () => {
    // Given: no --target-dir flag, running from inside template
    // When: run init
    // Then: behavior identical to current version, exit 0
  })
})
```

**GREEN**: Tests fail (functions don't exist yet)

**COMMIT**: `test: add smoke tests for init --target-dir mode`

---

## Group 2: Core functions (TDD)

### Task 2.1: Implement `validateTargetDir()`

**RED**: Tests from 1.2 fail on validation

**GREEN**: Implement in `scripts/init-project.ts`:

```typescript
async function validateTargetDir(targetDir: string, force: boolean): Promise<void> {
  const absPath = resolve(targetDir)
  
  // Check if path exists and is a file
  if (existsSync(absPath)) {
    const stat = await Bun.file(absPath).stat()
    if (!stat.isDirectory()) {
      throw new Error(`Target path exists and is not a directory: ${absPath}`)
    }
    
    // Check if directory is empty
    const entries = await readdir(absPath)
    if (entries.length > 0 && !force) {
      throw new Error(
        `Target directory is not empty: ${absPath}. Use --force to proceed.`
      )
    }
    
    if (entries.length > 0 && force) {
      console.warn(`⚠️  Target directory is not empty: ${absPath}`)
    }
  }
  // Non-existent path is OK (will be created by git clone)
}
```

**COMMIT**: `feat(init): add validateTargetDir function`

---

### Task 2.2: Implement `cloneTemplate()`

**RED**: Tests from 1.2 fail on clone step

**GREEN**: Implement in `scripts/init-project.ts`:

```typescript
async function cloneTemplate(
  targetDir: string,
  templateUrl: string,
  ref: string,
  verbose: boolean
): Promise<void> {
  const absPath = resolve(targetDir)
  
  // Create parent directories if needed
  await mkdir(dirname(absPath), { recursive: true })
  
  if (verbose) {
    console.log(`  Cloning ${templateUrl} (${ref}) to ${absPath}...`)
  }
  
  const proc = Bun.spawn([
    'git', 'clone',
    '--depth', '1',
    '--branch', ref,
    templateUrl,
    absPath
  ], {
    stdout: verbose ? 'inherit' : 'pipe',
    stderr: 'pipe'
  })
  
  await proc.exited
  
  if (proc.exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`Failed to clone template: ${stderr}`)
  }
}
```

**COMMIT**: `feat(init): add cloneTemplate function`

---

### Task 2.3: Implement `resetGitHistory()`

**RED**: Tests from 1.2 fail on git history check

**GREEN**: Implement in `scripts/init-project.ts`:

```typescript
async function resetGitHistory(targetDir: string, verbose: boolean): Promise<void> {
  const gitDir = join(targetDir, '.git')
  
  if (verbose) {
    console.log('  Resetting git history...')
  }
  
  // Remove template's git history
  await rm(gitDir, { recursive: true, force: true })
  
  // Initialize fresh repo
  const initProc = Bun.spawn(['git', 'init'], {
    cwd: targetDir,
    stdout: 'pipe',
    stderr: 'pipe'
  })
  await initProc.exited
  
  if (initProc.exitCode !== 0) {
    const stderr = await new Response(initProc.stderr).text()
    throw new Error(`Failed to initialize git repository: ${stderr}`)
  }
  
  // Stage all files
  const addProc = Bun.spawn(['git', 'add', '.'], {
    cwd: targetDir,
    stdout: 'pipe',
    stderr: 'pipe'
  })
  await addProc.exited
  
  // Create initial commit
  const commitProc = Bun.spawn([
    'git', 'commit', '-m', 'chore: initialize from smoke-test'
  ], {
    cwd: targetDir,
    stdout: 'pipe',
    stderr: 'pipe'
  })
  await commitProc.exited
  
  if (verbose) {
    console.log('  ✓ Git history reset')
  }
}
```

**COMMIT**: `feat(init): add resetGitHistory function`

---

## Group 3: CLI and integration

### Task 3.1: Add new CLI flags

**Type**: Infrastructure (no TDD, covered by smoke tests)

**What**: Extend `parseCliArgs()` to accept new flags

**Steps**:
1. Add to `parseArgs` options:
   - `target-dir` (alias `t`)
   - `template-url`
   - `ref`
   - `force`
   - `quiet`
2. Add to `Config` interface
3. Update `printHelp()` with examples

**Acceptance**:
- Flags parse correctly
- Help text shows new flags with examples
- Backward compatible (all flags optional)

**COMMIT**: `feat(init): add CLI flags for target-dir mode`

---

### Task 3.2: Refactor `resolveRootDir()` to accept targetDir

**Type**: Refactor (covered by existing + new tests)

**What**: Make `resolveRootDir()` accept optional `targetDir` parameter

**Steps**:
1. Add optional parameter: `resolveRootDir(targetDir?: string): string`
2. If `targetDir` provided, return `resolve(targetDir)`
3. Otherwise, use existing logic (CWD or `../`)
4. Verify all call sites (should only be in `main()`)

**Acceptance**:
- Existing tests pass (no targetDir)
- New tests pass (with targetDir)

**COMMIT**: `refactor(init): parameterize resolveRootDir with targetDir`

---

### Task 3.3: Implement Logger class for quiet mode

**Type**: Infrastructure

**What**: Create `Logger` class that respects `quiet` flag

**Steps**:
1. Create `Logger` class with `info()`, `error()`, `progress()` methods
2. Constructor accepts `quiet: boolean`
3. `info()` and `progress()` are no-ops when quiet
4. `error()` always emits to stderr
5. Replace all `console.log` calls with `logger.info()`
6. Replace progress bars with `logger.progress()`

**Acceptance**:
- In normal mode: output unchanged
- In quiet mode: no stdout during execution

**COMMIT**: `feat(init): add Logger class for quiet mode`

---

### Task 3.4: Implement JSON summary output

**Type**: Infrastructure

**What**: Emit JSON summary at end of execution when `--quiet` is active

**Steps**:
1. Create `SummaryData` interface:
   ```typescript
   interface SummaryData {
     status: 'ok' | 'error'
     projectName?: string
     projectIdentifier?: string
     targetDir?: string
     components?: string
     filesUpdated?: number
     durationMs?: number
     warnings?: string[]
     error?: string
     code?: string
   }
   ```
2. Accumulate data during execution
3. In `main()` catch block, emit error JSON if quiet
4. At end of successful execution, emit success JSON if quiet
5. Ensure JSON is always valid (even on early exit)

**Acceptance**:
- `--quiet` emits valid JSON to stdout
- Success JSON has `status: "ok"`
- Error JSON has `status: "error"` and `error` field
- Parseable by `jq`

**COMMIT**: `feat(init): add JSON summary output for quiet mode`

---

### Task 3.5: Integrate target-dir flow into main()

**Type**: Integration

**What**: Wire up target-dir mode in `main()` function

**Steps**:
1. After parsing args, check if `config.targetDir` is present
2. If yes:
   - Call `validateTargetDir(config.targetDir, config.force)`
   - Call `cloneTemplate(config.targetDir, templateUrl, ref, verbose)`
   - Call `resetGitHistory(config.targetDir, verbose)`
   - Set `rootDir = config.targetDir`
3. If no:
   - Use existing `resolveRootDir()` logic
4. Continue with existing init logic using `rootDir`
5. Handle errors with appropriate exit codes:
   - Validation error → exit 1
   - Git error → exit 2
   - Init error → exit 3

**Acceptance**:
- All smoke tests pass
- Backward compatibility maintained (no --target-dir works as before)
- Exit codes correct for each error type

**COMMIT**: `feat(init): integrate target-dir mode into main flow`

---

### Task 3.6: Add template URL configuration

**Type**: Infrastructure

**What**: Support `--template-url` flag and `DFS_TEMPLATE_URL` env var

**Steps**:
1. Add constant: `const DEFAULT_TEMPLATE_URL = 'git@github.com:elevenyellow/smoke-test.git'`
2. Create helper:
   ```typescript
   function getTemplateUrl(cliValue?: string): string {
     return cliValue 
       || process.env.DFS_TEMPLATE_URL 
       || DEFAULT_TEMPLATE_URL
   }
   ```
3. Use in `main()` when calling `cloneTemplate()`

**Acceptance**:
- Default URL used when no override
- `--template-url` overrides default
- `DFS_TEMPLATE_URL` env var overrides default
- CLI flag takes precedence over env var

**COMMIT**: `feat(init): add template URL configuration`

---

### Task 3.7: Implicit --no-backup in target-dir mode

**Type**: Logic tweak

**What**: When `--target-dir` is present, default to `--no-backup` (user can override)

**Steps**:
1. In config resolution, if `targetDir` present and `noBackup` not explicitly set:
   - Set `noBackup = true`
2. User can still pass `--backup` to override

**Acceptance**:
- Target-dir mode skips backup by default
- Explicit `--backup` still works
- In-place mode unchanged

**COMMIT**: `feat(init): default to no-backup in target-dir mode`

---

## Group 4: Documentation and validation

### Task 4.1: Update README.md

**Type**: Documentation

**What**: Document new `--target-dir` usage

**Steps**:
1. Add section "Creating a project from the template"
2. Show `bunx` example
3. Show local `bun run init --target-dir` example
4. Mention `--quiet` for automation

**Acceptance**:
- README clearly explains new workflow
- Examples are copy-pasteable

**COMMIT**: `docs: document init --target-dir usage`

---

### Task 4.2: Update help text

**Type**: Documentation

**What**: Update `printHelp()` with new flags and examples

**Steps**:
1. Add new flags to OPTIONS section
2. Add EXAMPLES section with:
   - Basic target-dir usage
   - bunx usage
   - Quiet mode for automation
   - Custom template URL

**Acceptance**:
- `bun run init --help` shows all new flags
- Examples are clear and correct

**COMMIT**: `docs: update init help text with target-dir examples`

---

## Group 5: Final validation

### Task 5.1: Run full validation suite

**Type**: Validation

**What**: Ensure all checks pass

**Steps**:
1. Run `bun run lint:fix`
2. Run `bun run typecheck`
3. Run `bun test`
4. All must pass

**Acceptance**:
- Zero lint errors
- Zero type errors
- All tests green

**COMMIT**: (no commit, validation only)

---

### Task 5.2: Manual smoke test

**Type**: Validation

**What**: Test the actual workflow end-to-end

**Steps**:
1. From a clean directory:
   ```bash
   rm -rf /tmp/test-init
   bun run init -n test-init -i @ti \
     --target-dir /tmp/test-init \
     --components webapp \
     --skip-git-check \
     --quiet
   ```
2. Verify:
   - Directory created at `/tmp/test-init`
   - Valid JSON emitted to stdout
   - Exit code 0
   - Project structure correct
   - Git history has only 1 commit
   - `package.json` has `name: "test-init"`
   - `@smoke` replaced with `@ti`

**Acceptance**:
- Manual test succeeds
- JSON output valid
- Project functional

**COMMIT**: (no commit, validation only)

---

### Task 5.3: Test bunx invocation (if possible)

**Type**: Validation

**What**: Verify `bunx github:elevenyellow/smoke-test init` works

**Steps**:
1. From outside the template repo:
   ```bash
   bunx github:elevenyellow/smoke-test init \
     -n bunx-test -i @bt \
     --target-dir /tmp/bunx-test \
     --components webapp \
     --skip-git-check \
     --quiet
   ```
2. Verify it works (may require pushing to GitHub first)

**Acceptance**:
- If bunx supports this pattern: works
- If not: document limitation in README

**COMMIT**: (no commit, validation only)

---

### Task 5.4: Run review tasks

**Type**: Validation

**What**: Run automated review tasks

**Steps**:
1. Run `/task-code-review` on `scripts/init-project.ts`
2. Run `/task-tests-review` on `scripts/init-project.smoke.test.ts`
3. Address any findings

**Acceptance**:
- Code review passes
- Tests review passes

**COMMIT**: (fixes applied in previous commits if needed)

---

### Task 5.5: Final commit

**Type**: Finalization

**What**: Ensure all changes are committed

**Steps**:
1. Review `git status`
2. Ensure all files staged
3. If any uncommitted changes, commit with:
   ```
   feat(init): add --target-dir flag for remote project creation
   
   - Add --target-dir, --template-url, --ref, --force, --quiet flags
   - Clone template to target directory
   - Reset git history (fresh repo with initial commit)
   - Emit JSON summary in quiet mode
   - Maintain backward compatibility (no --target-dir works as before)
   - Add smoke tests for all new modes
   - Update documentation
   ```

**Acceptance**:
- Working tree clean
- All changes committed

**COMMIT**: `feat(init): add --target-dir flag for remote project creation`

---

## Summary

**Total tasks**: 18 (5 groups)

**Estimated effort**: 
- Group 1 (tests): 1-2 hours
- Group 2 (core functions): 2-3 hours
- Group 3 (CLI integration): 3-4 hours
- Group 4 (docs): 1 hour
- Group 5 (validation): 1-2 hours

**Total**: ~8-12 hours

**Dependencies**:
- Group 2 depends on Group 1 (tests first)
- Group 3 depends on Group 2 (functions exist)
- Group 4 can run in parallel with Group 3
- Group 5 depends on all previous groups

**Risk areas**:
- Git operations (clone, init, commit) — test thoroughly
- JSON output formatting — ensure always valid
- Backward compatibility — existing tests must pass
