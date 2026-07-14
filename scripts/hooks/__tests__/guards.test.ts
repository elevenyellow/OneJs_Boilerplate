import { describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isLinkedWorktree,
  offendingGhMerge,
  offendingGit,
} from '../git-guard.mjs'
import {
  blockedProposalWrite,
  offendingProposeCreate,
} from '../propose-guard.mjs'
import { blockedImplEdit } from '../worktree-guard.mjs'

// The repository root for import path checks (this test lives at scripts/hooks/__tests__).
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function withPrimaryCheckout<T>(run: (repo: string) => T): T {
  const repo = mkdtempSync(resolve(tmpdir(), 'onejs-primary-checkout-'))
  mkdirSync(resolve(repo, '.git'))
  const priorProjectDir = process.env.CLAUDE_PROJECT_DIR
  process.env.CLAUDE_PROJECT_DIR = repo
  try {
    return run(repo)
  } finally {
    if (priorProjectDir === undefined) {
      delete process.env.CLAUDE_PROJECT_DIR
    } else {
      process.env.CLAUDE_PROJECT_DIR = priorProjectDir
    }
    rmSync(repo, { recursive: true, force: true })
  }
}

function withLinkedWorktree<T>(run: (repo: string) => T): T {
  const repo = mkdtempSync(resolve(tmpdir(), 'onejs-linked-worktree-'))
  writeFileSync(resolve(repo, '.git'), 'gitdir: /tmp/onejs-worktree-git-dir\n')
  const priorProjectDir = process.env.CLAUDE_PROJECT_DIR
  process.env.CLAUDE_PROJECT_DIR = repo
  try {
    return run(repo)
  } finally {
    if (priorProjectDir === undefined) {
      delete process.env.CLAUDE_PROJECT_DIR
    } else {
      process.env.CLAUDE_PROJECT_DIR = priorProjectDir
    }
    rmSync(repo, { recursive: true, force: true })
  }
}

describe('git-guard offendingGit', () => {
  test('flags state-changing git subcommands', () => {
    expect(offendingGit('git commit -m x')).toBe('git commit')
    expect(offendingGit('git push')).toBe('git push')
    expect(offendingGit('git rebase main')).toBe('git rebase')
    expect(offendingGit('git reset --hard')).toBe('git reset')
    expect(offendingGit('git stash')).toBe('git stash')
  })

  test('allows read-only git', () => {
    expect(offendingGit('git status')).toBeNull()
    expect(offendingGit('git log --oneline')).toBeNull()
    expect(offendingGit('git diff HEAD~1')).toBeNull()
    expect(offendingGit('git branch --list')).toBeNull()
    expect(offendingGit('git worktree list')).toBeNull()
  })

  test('distinguishes conditional subcommands by args', () => {
    expect(offendingGit('git branch --list')).toBeNull()
    expect(offendingGit('git branch new-feature')).toBe('git branch')
    expect(offendingGit('git tag -l')).toBeNull()
    expect(offendingGit('git tag v1.0.0')).toBe('git tag')
  })

  test('scans compound commands and prefixes', () => {
    expect(offendingGit('cd /tmp && git commit -m x')).toBe('git commit')
    expect(offendingGit('sudo git push')).toBe('git push')
    expect(offendingGit('git -C /some/path commit -m x')).toBe('git commit')
  })

  test('does not flag git appearing as a mere argument', () => {
    expect(offendingGit('echo "git push"')).toBeNull()
    expect(offendingGit('grep git file.txt')).toBeNull()
    expect(offendingGit('ls && echo done')).toBeNull()
  })
})

describe('git-guard isLinkedWorktree', () => {
  test('primary checkout is not a linked worktree', () => {
    withPrimaryCheckout(() => {
      // No -C / cd → resolves to CLAUDE_PROJECT_DIR/cwd; the primary checkout's
      // .git is a directory, so this is false.
      expect(isLinkedWorktree('git commit -m x')).toBe(false)
    })
  })

  test('linked worktree is allowed', () => {
    withLinkedWorktree(() => {
      expect(isLinkedWorktree('git commit -m x')).toBe(true)
    })
  })

  test('explicit -C directory overrides session dir', () => {
    withPrimaryCheckout(() => {
      const linked = mkdtempSync(
        resolve(tmpdir(), 'onejs-dash-c-linked-worktree-'),
      )
      writeFileSync(
        resolve(linked, '.git'),
        'gitdir: /tmp/onejs-dash-c-git-dir\n',
      )
      try {
        expect(isLinkedWorktree(`git -C ${linked} commit -m x`)).toBe(true)
      } finally {
        rmSync(linked, { recursive: true, force: true })
      }
    })
  })

  test('explicit tool directory overrides primary project dir for OpenCode', () => {
    withPrimaryCheckout(() => {
      const linked = mkdtempSync(
        resolve(tmpdir(), 'onejs-explicit-linked-worktree-'),
      )
      writeFileSync(
        resolve(linked, '.git'),
        'gitdir: /tmp/onejs-explicit-worktree-git-dir\n',
      )
      try {
        expect(isLinkedWorktree('git add -A', linked)).toBe(true)
      } finally {
        rmSync(linked, { recursive: true, force: true })
      }
    })
  })
})

describe('worktree-guard blockedImplEdit', () => {
  test('blocks implementation paths in the primary checkout', () => {
    withPrimaryCheckout((repo) => {
      mkdirSync(resolve(repo, 'packages/training'), { recursive: true })
      mkdirSync(resolve(repo, 'apps/summit'), { recursive: true })
      mkdirSync(resolve(repo, '.oneJs/core'), { recursive: true })

      expect(blockedImplEdit('packages/training/x.ts', repo)).toBe(
        'packages/training/x.ts',
      )
      expect(blockedImplEdit('apps/summit/x.tsx', repo)).toBe(
        'apps/summit/x.tsx',
      )
      expect(blockedImplEdit(`${repo}/.oneJs/core/y.ts`, repo)).toBe(
        '.oneJs/core/y.ts',
      )
    })
  })

  test('allows implementation paths in a linked worktree', () => {
    withLinkedWorktree((repo) => {
      expect(blockedImplEdit('packages/training/x.ts', repo)).toBeNull()
      expect(blockedImplEdit('apps/summit/x.tsx', repo)).toBeNull()
      expect(blockedImplEdit(`${repo}/.oneJs/core/y.ts`, repo)).toBeNull()
    })
  })

  test('allows non-implementation paths in the primary checkout', () => {
    withPrimaryCheckout((repo) => {
      expect(blockedImplEdit('docs/x.md', repo)).toBeNull()
      expect(blockedImplEdit('openspec/changes/c/spec.md', repo)).toBeNull()
      expect(blockedImplEdit('scripts/hooks/x.mjs', repo)).toBeNull()
      expect(blockedImplEdit('.agents/skills/x/SKILL.md', repo)).toBeNull()
      expect(blockedImplEdit('AGENTS.md', repo)).toBeNull()
    })
  })

  test('ignores paths outside any git repo', () => {
    expect(
      blockedImplEdit('/nonexistent/tmp/x.ts', '/nonexistent/tmp'),
    ).toBeNull()
  })

  test('uses the real checkout as a smoke fixture', () => {
    expect(blockedImplEdit('docs/x.md', REPO)).toBeNull()
  })
})

describe('propose-guard offendingProposeCreate', () => {
  test('flags creating a new change (proposal scaffold)', () => {
    expect(offendingProposeCreate('openspec new change add-user-auth')).toBe(
      'openspec new change',
    )
    expect(offendingProposeCreate('openspec new change "add-user-auth"')).toBe(
      'openspec new change',
    )
    expect(offendingProposeCreate('openspec --no-color new change foo')).toBe(
      'openspec new change',
    )
  })

  test('scans compound commands and prefixes', () => {
    expect(offendingProposeCreate('cd /tmp && openspec new change foo')).toBe(
      'openspec new change',
    )
    expect(offendingProposeCreate('sudo openspec new change foo')).toBe(
      'openspec new change',
    )
  })

  test('allows other openspec subcommands', () => {
    expect(offendingProposeCreate('openspec status --change foo')).toBeNull()
    expect(offendingProposeCreate('openspec list')).toBeNull()
    expect(offendingProposeCreate('openspec archive foo')).toBeNull()
    expect(
      offendingProposeCreate('openspec instructions tasks --change foo'),
    ).toBeNull()
    // `new` without `change` (e.g. a hypothetical other item) is not the scaffold.
    expect(offendingProposeCreate('openspec new')).toBeNull()
  })

  test('does not flag openspec appearing as a mere argument', () => {
    expect(offendingProposeCreate('echo "openspec new change foo"')).toBeNull()
    expect(offendingProposeCreate('grep openspec file.txt')).toBeNull()
  })
})

describe('propose-guard blockedProposalWrite', () => {
  test('blocks writing change artifacts in the primary checkout', () => {
    withPrimaryCheckout((repo) => {
      expect(
        blockedProposalWrite('openspec/changes/add-foo/proposal.md', repo),
      ).toBe('openspec/changes/add-foo/proposal.md')
      expect(
        blockedProposalWrite('openspec/changes/add-foo/design.md', repo),
      ).toBe('openspec/changes/add-foo/design.md')
      expect(
        blockedProposalWrite(`${repo}/openspec/changes/add-foo/tasks.md`, repo),
      ).toBe('openspec/changes/add-foo/tasks.md')
    })
  })

  test('allows archived changes and non-change openspec paths in the primary checkout', () => {
    withPrimaryCheckout((repo) => {
      // Archive runs on main post-merge — must stay allowed.
      expect(
        blockedProposalWrite(
          'openspec/changes/archive/add-foo/proposal.md',
          repo,
        ),
      ).toBeNull()
      // Specs and openspec root config are not change proposals.
      expect(
        blockedProposalWrite('openspec/specs/user/spec.md', repo),
      ).toBeNull()
      expect(blockedProposalWrite('openspec/project.md', repo)).toBeNull()
      // Unrelated paths.
      expect(blockedProposalWrite('docs/x.md', repo)).toBeNull()
    })
  })

  test('allows change artifacts inside a linked worktree', () => {
    withLinkedWorktree((repo) => {
      expect(
        blockedProposalWrite('openspec/changes/add-foo/proposal.md', repo),
      ).toBeNull()
    })
  })

  test('ignores paths outside any git repo', () => {
    expect(
      blockedProposalWrite(
        '/nonexistent/tmp/openspec/changes/c/p.md',
        '/nonexistent/tmp',
      ),
    ).toBeNull()
  })
})

describe('git-guard offendingGhMerge', () => {
  test('flags gh pr merge (merge needs a human)', () => {
    expect(offendingGhMerge('gh pr merge 23')).toBe('gh pr merge')
    expect(offendingGhMerge('gh pr merge 23 --merge')).toBe('gh pr merge')
    expect(offendingGhMerge('sudo gh pr merge 5')).toBe('gh pr merge')
    expect(offendingGhMerge('cd /x && gh pr merge')).toBe('gh pr merge')
  })

  test('allows other gh pr subcommands and non-gh', () => {
    expect(offendingGhMerge('gh pr create --draft')).toBeNull()
    expect(offendingGhMerge('gh pr list')).toBeNull()
    expect(offendingGhMerge('gh pr view 23')).toBeNull()
    expect(offendingGhMerge('git commit -m x')).toBeNull()
    expect(offendingGhMerge('echo "gh pr merge"')).toBeNull()
  })
})
