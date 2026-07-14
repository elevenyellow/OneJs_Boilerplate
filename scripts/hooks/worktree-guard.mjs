#!/usr/bin/env node
// worktree-guard.mjs — PreToolUse(Edit|Write|MultiEdit) hook.
//
// Enforces the worktree→PR workflow regardless of how many workers run: editing
// IMPLEMENTATION code (apps/, packages/, .oneJs/) in the PRIMARY `main` checkout
// is denied — that work belongs in a per-change git worktree
// (`scripts/spec-worktree.sh new <change>`). A linked worktree's `.git` is a
// FILE (gitdir pointer); the primary checkout's `.git` is a DIRECTORY.
//
// Always allowed on `main`: docs/, openspec/, scripts/, .agents/, and root
// config — the flow's own maintenance. Escape hatch for deliberate main edits:
// env CLAUDE_MAIN_EDIT=1 (operator sets it; the assistant cannot).
//
// Output contract (PreToolUse): print JSON with permissionDecision "deny" to
// block; print nothing + exit 0 to allow.

import { readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

// Implementation roots that must live in a worktree, not the main checkout.
const IMPL_PREFIXES = ['apps/', 'packages/', '.oneJs/']

// Walk up from a path to the enclosing repo root (first dir containing `.git`).
// Returns { root, gitIsFile } or null. Exported for reuse by propose-guard.
export function repoRootOf(startDir) {
  let dir = startDir
  for (let i = 0; i < 64; i++) {
    try {
      const st = statSync(join(dir, '.git'))
      return { root: dir, gitIsFile: st.isFile() }
    } catch {
      /* keep walking */
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
  return null
}

// Returns the repo-relative path if editing `filePath` is a blocked
// implementation edit in the primary checkout, else null. Exported for reuse by
// the OpenCode plugin (.opencode/plugins/worktree-policy.js). Does NOT check the
// escape env — the caller does.
export function blockedImplEdit(filePath, baseDir) {
  const base = baseDir || process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const abs = isAbsolute(filePath) ? filePath : resolve(base, filePath)
  const repo = repoRootOf(dirname(abs))
  if (!repo) return null // not in a git repo
  if (repo.gitIsFile) return null // inside a linked worktree → allowed
  const rel = relative(repo.root, abs)
  if (rel.startsWith('..')) return null // outside the repo
  return IMPL_PREFIXES.some((p) => rel.startsWith(p)) ? rel : null
}

function main() {
  let payload
  try {
    payload = JSON.parse(readStdin() || '{}')
  } catch {
    process.exit(0)
  }

  const tool = payload?.tool_name
  if (!['Edit', 'Write', 'MultiEdit'].includes(tool)) process.exit(0)

  const filePath = payload?.tool_input?.file_path
  if (typeof filePath !== 'string' || !filePath) process.exit(0)

  // Operator escape hatch for deliberate main-checkout edits.
  const esc = process.env.CLAUDE_MAIN_EDIT
  if (esc && esc !== '0' && esc.toLowerCase() !== 'false') process.exit(0)

  const rel = blockedImplEdit(filePath)
  if (!rel) process.exit(0) // worktree / docs / openspec / scripts / config → allowed

  const out = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `Worktree workflow: editing implementation code (${rel}) in the primary ` +
        `'main' checkout is not allowed. This work belongs in a per-change git ` +
        `worktree so main stays clean and every change is a PR. Create/enter one:\n` +
        `  scripts/spec-worktree.sh new <change>   # then cd ../worktrees/<repo>/<change>\n` +
        `Docs/openspec/scripts/config edits on main are fine. For a deliberate ` +
        `main-checkout edit, the operator sets CLAUDE_MAIN_EDIT=1. See AGENTS.md → Git Policy.`,
    },
  }
  process.stdout.write(JSON.stringify(out))
  process.exit(0)
}

// Run as a Claude Code hook only when executed directly. When imported (OpenCode
// plugin), export the functions without running main().
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main()
