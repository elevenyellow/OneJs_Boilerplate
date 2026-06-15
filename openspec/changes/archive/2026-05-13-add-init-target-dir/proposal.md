# Proposal: Add `--target-dir` flag to init script

## Problem

The `scripts/init-project.ts` script currently only works **inside** an already-cloned template directory. It modifies the current working directory (or resolves to `../` from `scripts/`). This forces a manual three-step workflow:

```bash
git clone git@github.com:elevenyellow/ddd-fullstack-starter.git foo
cd foo
bun run init -n foo -i @foo --components webapp --skip-git-check
```

For automation (n8n workflows in cloudbox) or quick invocation from any machine, this creates unnecessary friction. Users must manually clone the template before they can initialize a project.

## Solution

Add a `--target-dir` flag to the init script that:

1. Clones the template to the specified directory
2. Resets git history (removes template's `.git`, creates fresh repo)
3. Runs the existing init logic on the cloned template
4. Leaves a ready-to-use project at the target path

This enables single-command project creation from anywhere:

```bash
bun run init \
  -n my-project \
  -i @mp \
  --target-dir /home/orlando/projects/my-project \
  --components webapp \
  --skip-git-check
```

Or via `bunx` without cloning the template first:

```bash
bunx github:elevenyellow/ddd-fullstack-starter init \
  -n my-project -i @mp --target-dir ~/projects/my-project \
  --components webapp --skip-git-check --quiet
```

## Goals

- **Single-command project creation**: Clone + init in one step
- **Machine-agnostic**: Works on Mac, cloudbox VM, or any machine with `bun` and `git`
- **Automation-friendly**: Add `--quiet` flag for JSON output (parseable by n8n)
- **Backward compatible**: Existing usage without `--target-dir` works unchanged
- **Clean git history**: New project starts with fresh repo, not template's history

## Non-goals

- Creating GitHub repositories automatically (`gh repo create`) — user/orchestrator handles this
- Configuring git remote — user/orchestrator handles this
- OpenCode skill integration — separate iteration
- n8n workflow implementation — separate iteration (in cloudbox repo)
- Refactoring `.env.local` generation (platform vs app config separation) — future work
- Integration with cloudbox's `new-project` script — future work

## Affected components

- **scripts/init-project.ts** — core logic changes
- **scripts/init-project.smoke.test.ts** — new test cases for target-dir mode
- **README.md** — document new usage pattern
- **No packages or apps affected** — this is a tooling change only

## Success criteria

1. From a clean machine with only `bun` and `git`:
   ```bash
   bunx github:elevenyellow/ddd-fullstack-starter init \
     -n foo -i @foo --target-dir ~/projects/foo \
     --components webapp --skip-git-check --quiet
   ```
   produces a functional project in `~/projects/foo` and emits valid JSON.

2. All existing tests pass (zero regression).

3. New smoke tests cover target-dir mode (empty dir, non-empty dir, force flag, quiet mode).

4. Output with `--quiet` is valid JSON parseable by `jq`:
   ```bash
   bun run init … --quiet | jq '.status'
   # "ok"
   ```

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `git clone` fails (SSH key, network) | Detect git exit code, clear error message, exit code 2 |
| Template URL becomes stale | Override via `--template-url` flag |
| `--force` accidentally overwrites user work | `--force` only allows operating on non-empty dir; actual file collisions still fail |
| Clone brings heavy history | Use `git clone --depth 1` for speed |
| Malformed JSON output on early errors | Wrap `main()` in try/catch, always emit valid JSON in `--quiet` mode |
