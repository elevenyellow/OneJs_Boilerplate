#!/usr/bin/env node
// propose-guard.mjs — PreToolUse(Bash | Edit|Write|MultiEdit) hook.
//
// Enforces "1 change = 1 worktree" at PROPOSAL time. Two chokepoints, so the
// worktree is ALWAYS created before a proposal is generated:
//
//   1. Bash — scaffolding a change (`openspec new change <name>`, the only CLI
//      command that creates one) is denied on the primary `main` checkout.
//   2. Edit|Write|MultiEdit — writing a change artifact under
//      `openspec/changes/<name>/` (proposal.md / design.md / tasks.md) is denied
//      on the primary checkout, so a flow can't hand-write artifacts and bypass
//      the CLI. `openspec/changes/archive/**` stays allowed (archive runs on
//      main post-merge), as do `openspec/specs/**` and openspec root config.
//
// The proposal thus lives on the spec branch from its first byte; the whole
// change — propose → apply → PR — is one worktree and main stays clean.
//
// A linked worktree's `.git` is a FILE (gitdir pointer); the primary checkout's
// `.git` is a DIRECTORY (reused via isLinkedWorktree / repoRootOf). Inside a
// worktree everything is allowed. Escape hatch for a deliberate main-checkout
// proposal: env CLAUDE_MAIN_EDIT=1 (operator sets it; the assistant cannot).
//
// Output contract (PreToolUse): print JSON with permissionDecision "deny" to
// block; print nothing + exit 0 to allow.

import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { isLinkedWorktree } from './git-guard.mjs'
import { repoRootOf } from './worktree-guard.mjs'

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

// Split a compound command into segments on shell separators (&&, ||, |, ;,
// newlines) so a `cd x && openspec ...` prefix doesn't hide the scaffold.
function segments(command) {
  return command.split(/&&|\|\||[|;\n]/).map((s) => s.trim())
}

// Return 'openspec new change' if any segment is a change-scaffold invocation,
// else null. Requires the segment to START with `openspec` (after an optional
// `sudo ` prefix) so the token appearing inside `echo`/`grep` args is ignored.
// Exported for reuse by tests and the OpenCode plugin.
export function offendingProposeCreate(command) {
  for (const seg of segments(command)) {
    const s = seg.replace(/^sudo\s+/, '')
    if (!/^openspec\b/.test(s)) continue
    // Must contain the `new` then `change` tokens, in order, as whole words.
    if (/\bnew\b[\s\S]*\bchange\b/.test(s)) return 'openspec new change'
  }
  return null
}

// Return the repo-relative path if writing `filePath` is an active change-
// proposal artifact write in the primary checkout, else null. Active =
// `openspec/changes/<name>/…` but NOT `openspec/changes/archive/…`. Inside a
// linked worktree returns null (allowed). Exported for reuse by tests and the
// OpenCode plugin. Does NOT check the escape env — the caller does.
export function blockedProposalWrite(filePath, baseDir) {
  const base = baseDir || process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const abs = isAbsolute(filePath) ? filePath : resolve(base, filePath)
  const repo = repoRootOf(dirname(abs))
  if (!repo) return null // not in a git repo
  if (repo.gitIsFile) return null // inside a linked worktree → allowed
  const rel = relative(repo.root, abs)
  if (rel.startsWith('..')) return null // outside the repo
  if (!rel.startsWith('openspec/changes/')) return null // not a change proposal
  if (rel.startsWith('openspec/changes/archive/')) return null // archive is on main
  return rel
}

// Operator escape hatch for a deliberate main-checkout proposal.
function escaped() {
  const esc = process.env.CLAUDE_MAIN_EDIT
  return Boolean(esc) && esc !== '0' && esc.toLowerCase() !== 'false'
}

function deny(what) {
  const out = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `Worktree workflow: ${what} on the primary 'main' checkout is not ` +
        `allowed. A proposal must be created INSIDE its own worktree so main ` +
        `stays clean and the whole change is one PR. Create the worktree first, ` +
        `then relaunch the session inside it:\n` +
        `  scripts/spec-worktree.sh new <change>   # then cd ../worktrees/<repo>/<change>\n` +
        `On the relaunch (cwd inside the worktree) proposing is allowed. For a ` +
        `deliberate main-checkout proposal, the operator sets CLAUDE_MAIN_EDIT=1. ` +
        `See AGENTS.md → Git Policy.`,
    },
  }
  process.stdout.write(JSON.stringify(out))
  process.exit(0)
}

function main() {
  let payload
  try {
    payload = JSON.parse(readStdin() || '{}')
  } catch {
    process.exit(0)
  }

  const tool = payload?.tool_name

  if (tool === 'Bash') {
    const command = payload?.tool_input?.command
    if (typeof command !== 'string' || !command) process.exit(0)
    if (!offendingProposeCreate(command)) process.exit(0)
    if (escaped()) process.exit(0)
    if (isLinkedWorktree(command)) process.exit(0) // already in the worktree
    deny("scaffolding a new change ('openspec new change')")
  }

  if (['Edit', 'Write', 'MultiEdit'].includes(tool)) {
    const filePath = payload?.tool_input?.file_path
    if (typeof filePath !== 'string' || !filePath) process.exit(0)
    if (!blockedProposalWrite(filePath)) process.exit(0)
    if (escaped()) process.exit(0)
    deny('writing a change proposal artifact (openspec/changes/…)')
  }

  process.exit(0)
}

// Run as a Claude Code hook only when executed directly. When imported (tests /
// OpenCode plugin), export the functions without running main().
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main()
