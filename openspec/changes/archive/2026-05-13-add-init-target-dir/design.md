# Design: Add `--target-dir` flag to init script

## Overview

The init script will support two modes:

1. **In-place mode** (current behavior, backward compatible):
   - User is inside a cloned template
   - Script modifies current directory
   - No `--target-dir` flag

2. **Target-dir mode** (new):
   - User can be anywhere
   - Script clones template to `--target-dir`
   - Script operates on the cloned directory
   - Requires `--target-dir` flag

## Architecture

### New CLI flags

```typescript
interface Config {
  // ... existing fields ...
  targetDir?: string        // --target-dir, -t
  templateUrl?: string      // --template-url (default: github.com/elevenyellow/ddd-fullstack-starter.git)
  ref?: string              // --ref (default: main)
  force?: boolean           // --force (allow non-empty target-dir)
  quiet?: boolean           // --quiet (JSON output only)
}
```

### Control flow

```
main()
  │
  ├─ parseCliArgs() → Config
  │
  ├─ if (config.targetDir)
  │    ├─ validateTargetDir(targetDir, force)
  │    ├─ cloneTemplate(targetDir, templateUrl, ref)
  │    ├─ resetGitHistory(targetDir)
  │    └─ rootDir = targetDir
  │  else
  │    └─ rootDir = resolveRootDir()  // current behavior
  │
  ├─ ... existing init logic using rootDir ...
  │
  └─ if (config.quiet)
       └─ emitJsonSummary(stdout)
     else
       └─ emitHumanSummary(stdout)
```

### New functions

#### `validateTargetDir(targetDir: string, force: boolean): Promise<void>`

```typescript
async function validateTargetDir(targetDir: string, force: boolean): Promise<void> {
  const absPath = resolve(targetDir)
  
  if (!existsSync(absPath)) {
    // Will be created by git clone
    return
  }
  
  const entries = await readdir(absPath)
  
  if (entries.length === 0) {
    // Empty dir is OK
    return
  }
  
  if (!force) {
    throw new Error(`Target directory is not empty: ${absPath}. Use --force to proceed.`)
  }
  
  // force=true: allow non-empty, but warn
  console.warn(`⚠️  Target directory is not empty: ${absPath}`)
}
```

**Exit code**: 1 if validation fails

#### `cloneTemplate(targetDir: string, templateUrl: string, ref: string): Promise<void>`

```typescript
async function cloneTemplate(
  targetDir: string,
  templateUrl: string,
  ref: string
): Promise<void> {
  const absPath = resolve(targetDir)
  
  // Create parent directories if needed
  await mkdir(dirname(absPath), { recursive: true })
  
  // Clone with shallow history for speed
  const proc = Bun.spawn([
    'git', 'clone',
    '--depth', '1',
    '--branch', ref,
    templateUrl,
    absPath
  ], {
    stdout: 'pipe',
    stderr: 'pipe'
  })
  
  await proc.exited
  
  if (proc.exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`Failed to clone template: ${stderr}`)
  }
}
```

**Exit code**: 2 if clone fails

#### `resetGitHistory(targetDir: string): Promise<void>`

```typescript
async function resetGitHistory(targetDir: string): Promise<void> {
  const gitDir = join(targetDir, '.git')
  
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
    throw new Error('Failed to initialize git repository')
  }
  
  // Create initial commit
  const addProc = Bun.spawn(['git', 'add', '.'], {
    cwd: targetDir,
    stdout: 'pipe',
    stderr: 'pipe'
  })
  await addProc.exited
  
  const commitProc = Bun.spawn([
    'git', 'commit', '-m', 'chore: initialize from ddd-fullstack-starter'
  ], {
    cwd: targetDir,
    stdout: 'pipe',
    stderr: 'pipe'
  })
  await commitProc.exited
}
```

### Refactoring `resolveRootDir()`

Current function assumes CWD or `../` from scripts. Needs to accept optional parameter:

```typescript
function resolveRootDir(targetDir?: string): string {
  if (targetDir) {
    return resolve(targetDir)
  }
  
  // Existing logic as fallback
  const cwd = process.cwd()
  if (looksLikeTemplateRoot(cwd)) return cwd
  return join(import.meta.dir, '..')
}
```

All downstream functions already receive `rootDir` as parameter — no changes needed there.

### Quiet mode and JSON output

When `--quiet` is active:

- Suppress all `console.log`, progress bars, emojis
- Only emit errors to stderr
- Emit single JSON object to stdout at the end

**Success JSON**:
```json
{
  "status": "ok",
  "projectName": "foo",
  "projectIdentifier": "@foo",
  "targetDir": "/home/orlando/projects/foo",
  "components": "webapp",
  "filesUpdated": 87,
  "durationMs": 4231,
  "warnings": []
}
```

**Error JSON**:
```json
{
  "status": "error",
  "error": "Target directory is not empty: /home/orlando/projects/foo",
  "code": "TARGET_NOT_EMPTY"
}
```

**Implementation**: Create a `Logger` class that respects `quiet` flag:

```typescript
class Logger {
  constructor(private quiet: boolean) {}
  
  info(msg: string) {
    if (!this.quiet) console.log(msg)
  }
  
  error(msg: string) {
    console.error(msg)  // Always emit errors
  }
  
  progress(current: number, total: number) {
    if (!this.quiet) {
      // ... existing progress bar logic
    }
  }
}
```

Replace all `console.log` calls with `logger.info()`.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Validation error (flags, target-dir not empty, etc.) |
| 2 | Git error (clone failed, no network, etc.) |
| 3 | Init logic error (file replace failed, etc.) |

### Backup behavior in target-dir mode

Current script creates `.init-backup/<timestamp>/` for safety. In target-dir mode, this is unnecessary — the entire directory is disposable if something fails.

**Decision**: When `--target-dir` is present, `--no-backup` is implicit. User can override with explicit `--backup` flag.

### Template URL configuration

Default: `git@github.com:elevenyellow/ddd-fullstack-starter.git`

Override via:
1. `--template-url` flag (highest priority)
2. `DFS_TEMPLATE_URL` environment variable
3. Hardcoded default

```typescript
const DEFAULT_TEMPLATE_URL = 'git@github.com:elevenyellow/ddd-fullstack-starter.git'

function getTemplateUrl(cliValue?: string): string {
  return cliValue 
    || process.env.DFS_TEMPLATE_URL 
    || DEFAULT_TEMPLATE_URL
}
```

## Testing strategy

### Smoke tests (scripts/init-project.smoke.test.ts)

New test cases:

1. **Target-dir with non-existent directory**
   - Given: target-dir does not exist
   - When: run init with --target-dir
   - Then: directory created, template cloned, init succeeds

2. **Target-dir with empty directory**
   - Given: target-dir exists but is empty
   - When: run init with --target-dir
   - Then: template cloned, init succeeds

3. **Target-dir with non-empty directory, no force**
   - Given: target-dir has files
   - When: run init with --target-dir (no --force)
   - Then: exit code 1, error message

4. **Target-dir with non-empty directory, with force**
   - Given: target-dir has files
   - When: run init with --target-dir --force
   - Then: init proceeds, warning emitted

5. **Quiet mode emits valid JSON**
   - Given: valid flags with --quiet
   - When: run init
   - Then: stdout is valid JSON with status="ok"

6. **Quiet mode on error emits error JSON**
   - Given: invalid flags with --quiet
   - When: run init
   - Then: stdout is valid JSON with status="error"

7. **Custom ref clones correct branch**
   - Given: --ref feature-branch
   - When: run init with --target-dir
   - Then: feature-branch is cloned (mock git to verify)

8. **Git history is reset**
   - Given: successful clone
   - When: check .git in target-dir
   - Then: no template history, only initial commit

9. **Backward compatibility: no target-dir**
   - Given: no --target-dir flag
   - When: run init from inside template
   - Then: behavior identical to current version

**Mock strategy**: Mock `git clone` with a local fixture copy to avoid network dependency in CI.

### Unit tests

No new unit tests needed — existing functions already tested. New functions (`validateTargetDir`, `cloneTemplate`, `resetGitHistory`) are covered by smoke tests.

## File changes

### Modified files

- `scripts/init-project.ts`
  - Add new CLI flags to `parseCliArgs()`
  - Add `validateTargetDir()`, `cloneTemplate()`, `resetGitHistory()`
  - Refactor `resolveRootDir()` to accept optional `targetDir`
  - Add `Logger` class for quiet mode
  - Update `main()` to handle target-dir flow
  - Emit JSON summary in quiet mode
  - Update `printHelp()` with new flags and examples

- `scripts/init-project.smoke.test.ts`
  - Add 9 new test cases for target-dir mode
  - Add git clone mock fixture

- `README.md`
  - Add section documenting `--target-dir` usage
  - Add example with `bunx github:elevenyellow/ddd-fullstack-starter init`

### No changes to

- Any files in `packages/` or `apps/` — this is tooling only
- Existing test files (unit tests remain unchanged)
- `package.json` scripts (init script invocation unchanged)

## Edge cases

| Case | Behavior |
|---|---|
| Target-dir is a file, not directory | Error: "Target path exists and is not a directory" |
| No git installed | Clone fails with clear error, exit code 2 |
| No network access | Clone fails with clear error, exit code 2 |
| SSH key not configured | Clone fails with git's SSH error, exit code 2 |
| Template URL is invalid | Clone fails with git error, exit code 2 |
| Ref/branch does not exist | Clone fails with git error, exit code 2 |
| Target-dir path is relative | Resolved to absolute path via `resolve()` |
| User Ctrl+C during clone | Process exits, partial clone left in target-dir (acceptable) |

## Future enhancements (out of scope)

- Auto-create GitHub repo with `gh repo create`
- Configure git remote automatically
- Support for multiple template sources (not just GitHub)
- Interactive mode when flags are missing (wizard)
- Progress streaming in quiet mode (NDJSON)
