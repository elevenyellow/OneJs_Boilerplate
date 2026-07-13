#!/usr/bin/env node
// git-guard.mjs — PreToolUse(Bash) hook.
//
// Hard rule: the assistant must not run any state-changing git command unless
// the operator explicitly asks. This hook enforces it at the harness level by
// forcing a permission prompt ("ask") for every mutating git invocation found
// in a Bash command — including compound commands (&&, ||, |, ;, newlines) and
// `cd x && git ...` / `sudo git ...` forms. Read-only git (status, diff, log,
// show, branch --list, ...) and non-git commands pass through untouched.
//
// Output contract (PreToolUse): print JSON with permissionDecision "ask" to
// force the prompt; print nothing + exit 0 to let the normal flow proceed.

import { readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

// Resolve the directory a git command targets: an explicit `-C <dir>`, else a
// leading `cd <dir> &&`, else the session dir (CLAUDE_PROJECT_DIR / cwd).
function targetDir(command, baseDir) {
  const base = baseDir || process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const expand = (p) => (p.startsWith('~') ? p.replace(/^~/, homedir()) : p)
  const dashC = command.match(/(?:^|\s)-C\s+("[^"]+"|'[^']+'|\S+)/)
  const cd = command.match(/(?:^|&&|;|\|)\s*cd\s+("[^"]+"|'[^']+'|\S+)/)
  const raw = (dashC?.[1] || cd?.[1] || base).replace(/^["']|["']$/g, '')
  const p = expand(raw)
  return isAbsolute(p) ? p : resolve(base, p)
}

// A linked worktree's `.git` is a FILE (gitdir: pointer); the primary checkout's
// `.git` is a DIRECTORY. State-changing git inside a linked worktree is allowed
// by policy (main stays protected). Returns true only when clearly a worktree.
export function isLinkedWorktree(command, baseDir) {
  try {
    return statSync(join(targetDir(command, baseDir), '.git')).isFile()
  } catch {
    return false
  }
}

// Scan a full (possibly compound) command; return the offending `git <sub>` if
// any segment is a state-changing git invocation, else null. Exported for reuse
// by the OpenCode plugin (.opencode/plugins/worktree-policy.js).
export function offendingGit(command) {
  for (const seg of segments(command)) {
    const o = mutatingGitSubcommand(seg)
    if (o) return o
  }
  return null
}

// git subcommands that only read — always allowed to pass through.
const READONLY = new Set([
  'status',
  'diff',
  'log',
  'show',
  'blame',
  'grep',
  'rev-parse',
  'describe',
  'shortlog',
  'ls-files',
  'ls-remote',
  'ls-tree',
  'cat-file',
  'show-ref',
  'for-each-ref',
  'name-rev',
  'merge-base',
  'diff-tree',
  'diff-files',
  'diff-index',
  'whatchanged',
  'rev-list',
  'count-objects',
  'var',
  'help',
  'version',
  'annotate',
  'cherry',
  'show-branch',
  'verify-commit',
  'verify-tag',
  'check-ignore',
  'check-attr',
  'instaweb',
])

// git global options that take a value (consume the next token).
const GLOBAL_OPTS_WITH_VALUE = new Set([
  '-C',
  '-c',
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--exec-path',
  '--super-prefix',
])

// Split a compound shell command into rough segments on separators.
function segments(command) {
  return command.split(/&&|\|\||[|;\n]/g)
}

// Tokenize a segment on whitespace (naive but sufficient for detection).
function tokenize(seg) {
  return seg.trim().split(/\s+/).filter(Boolean)
}

function isGitWord(tok) {
  return tok === 'git' || tok.endsWith('/git')
}

// Decide whether a single conditional subcommand's args make it read-only.
function conditionalReadonly(sub, args) {
  const has = (...flags) => args.some((a) => flags.includes(a))
  switch (sub) {
    case 'branch':
      // Listing / inspection is fine; creating/deleting/moving/renaming is not.
      if (args.length === 0) return true
      if (
        has(
          '-d',
          '-D',
          '-m',
          '-M',
          '-c',
          '-C',
          '-f',
          '--delete',
          '--move',
          '--copy',
          '--force',
          '--edit-description',
          '--set-upstream-to',
          '-u',
          '--unset-upstream',
        )
      )
        return false
      if (
        has(
          '--list',
          '-l',
          '-a',
          '-r',
          '-v',
          '-vv',
          '-vvv',
          '--all',
          '--remotes',
          '--verbose',
          '--merged',
          '--no-merged',
          '--contains',
          '--points-at',
          '--show-current',
        )
      )
        return true
      // A bare name argument means create → not read-only.
      return !args.some((a) => !a.startsWith('-'))
    case 'tag':
      if (args.length === 0) return true
      if (
        has(
          '-l',
          '--list',
          '-n',
          '--contains',
          '--points-at',
          '--merged',
          '--no-merged',
        )
      )
        return true
      if (
        has(
          '-d',
          '--delete',
          '-a',
          '-s',
          '-m',
          '-f',
          '--force',
          '--annotate',
          '--sign',
        )
      )
        return false
      return !args.some((a) => !a.startsWith('-'))
    case 'stash': {
      const first = args.find((a) => !a.startsWith('-'))
      return first === undefined ? false : ['list', 'show'].includes(first)
    }
    case 'remote': {
      const first = args.find((a) => !a.startsWith('-'))
      if (first === undefined) return true // bare `git remote` lists
      return ['show', 'get-url', '-v'].includes(first) || has('-v', '--verbose')
    }
    case 'config':
      return has(
        '--get',
        '--get-all',
        '--get-regexp',
        '--get-urlmatch',
        '-l',
        '--list',
      )
    case 'reflog': {
      const first = args.find((a) => !a.startsWith('-'))
      return first === undefined || ['show'].includes(first)
    }
    case 'worktree': {
      const first = args.find((a) => !a.startsWith('-'))
      return first === 'list'
    }
    case 'submodule': {
      const first = args.find((a) => !a.startsWith('-'))
      return first === 'status' || first === 'summary'
    }
    case 'notes': {
      const first = args.find((a) => !a.startsWith('-'))
      return first === 'list' || first === 'show'
    }
    default:
      return false
  }
}

const CONDITIONAL = new Set([
  'branch',
  'tag',
  'stash',
  'remote',
  'config',
  'reflog',
  'worktree',
  'submodule',
  'notes',
])

// Command-word prefixes that can legitimately precede `git` at the start of a
// segment. We skip these (and VAR=val assignments) to find the actual command
// word. If that command word is not git, the segment is NOT a git invocation —
// a `git` appearing later is just an argument (e.g. `echo "git push"`,
// `grep git file`) and must not be blocked.
const PREFIXES = new Set([
  'sudo',
  'env',
  'command',
  'builtin',
  'nice',
  'nohup',
  'time',
  'xargs',
  'then',
  'do',
  'else',
  'exec',
  '{',
  '(',
  '!',
])

function isAssignment(tok) {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(tok)
}

// Returns the offending subcommand string if the segment IS a git invocation
// whose subcommand mutates state, else null.
function mutatingGitSubcommand(seg) {
  const toks = tokenize(seg)
  // Find the command word: skip leading assignments and known prefixes.
  let i = 0
  while (i < toks.length && (isAssignment(toks[i]) || PREFIXES.has(toks[i]))) {
    i++
  }
  if (i < toks.length && isGitWord(toks[i])) {
    // Walk past git global options to find the subcommand.
    let j = i + 1
    while (j < toks.length && toks[j].startsWith('-')) {
      const opt = toks[j]
      if (GLOBAL_OPTS_WITH_VALUE.has(opt)) {
        j += 2 // option + its value
      } else if (
        [...GLOBAL_OPTS_WITH_VALUE].some((o) => opt.startsWith(o + '='))
      ) {
        j += 1 // --git-dir=... form
      } else {
        j += 1 // valueless global flag (-p, --no-pager, --bare, ...)
      }
    }
    if (j >= toks.length) return null // bare `git` with no subcommand
    const sub = toks[j]
    const args = toks.slice(j + 1)
    if (READONLY.has(sub)) return null
    if (CONDITIONAL.has(sub)) {
      return conditionalReadonly(sub, args) ? null : `git ${sub}`
    }
    // Unknown / unlisted subcommand that isn't read-only → treat as mutating.
    return `git ${sub}`
  }
  return null
}

function isGhWord(tok) {
  return tok === 'gh' || tok.endsWith('/gh')
}

// `gh pr merge` integrates a PR into `main` and must NEVER run autonomously —
// merging requires human verification. Returns 'gh pr merge' if a segment
// invokes it (handles prefixes like sudo/env; ignores it as a mere string).
export function offendingGhMerge(command) {
  for (const seg of segments(command)) {
    const toks = tokenize(seg)
    let i = 0
    while (
      i < toks.length &&
      (isAssignment(toks[i]) || PREFIXES.has(toks[i]))
    ) {
      i++
    }
    if (i < toks.length && isGhWord(toks[i])) {
      const words = toks.slice(i + 1).filter((t) => !t.startsWith('-'))
      if (words[0] === 'pr' && words[1] === 'merge') return 'gh pr merge'
    }
  }
  return null
}

function main() {
  let payload
  try {
    payload = JSON.parse(readStdin() || '{}')
  } catch {
    process.exit(0) // can't parse → don't block
  }
  if (payload?.tool_name !== 'Bash') process.exit(0)
  const command = payload?.tool_input?.command
  if (typeof command !== 'string' || command.length === 0) process.exit(0)

  const deny = (reason) => {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      }),
    )
    process.exit(0)
  }

  // `gh pr merge` is denied UNCONDITIONALLY — never bypassed by CLAUDE_GIT_ALLOW
  // or the worktree exception. Merging a PR into `main` requires human
  // verification: the flow may open the PR (draft), but a human merges it.
  if (offendingGhMerge(command)) {
    deny(
      `Merge policy: 'gh pr merge' integrates a PR into main and must NOT run ` +
        `autonomously — a merge always requires human verification. Open/keep the ` +
        `PR (draft), run merge-review, and let the operator merge it (GitHub UI ` +
        `or their own terminal). See AGENTS.md → Git Policy.`,
    )
  }

  const offending = offendingGit(command)
  if (!offending) process.exit(0) // read-only git / non-git → proceed

  // Human-only escape hatch. The operator sets CLAUDE_GIT_ALLOW=1 in the env that
  // launches Claude Code (or settings `env`). The assistant cannot set this from
  // a Bash tool call — this hook runs as a separate harness-spawned process.
  const allow = process.env.CLAUDE_GIT_ALLOW
  if (allow && allow !== '0' && allow.toLowerCase() !== 'false') {
    process.exit(0)
  }

  // Worktree-aware: state-changing git inside a linked worktree (a `spec/*`
  // checkout) is allowed by policy — `main` stays protected.
  if (isLinkedWorktree(command)) {
    process.exit(0)
  }

  const out = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `Hard git rule: '${offending}' changes git state on the primary checkout. ` +
        `The assistant must NOT run it here (work in a worktree instead). To allow ` +
        `git this session the operator sets CLAUDE_GIT_ALLOW=1, or runs it directly ` +
        `(e.g. \`!${offending} ...\`). See AGENTS.md → Git Policy.`,
    },
  }
  process.stdout.write(JSON.stringify(out))
  process.exit(0)
}

// Run as a Claude Code hook only when executed directly (node git-guard.mjs).
// When imported (OpenCode plugin), export the functions without running main().
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main()
