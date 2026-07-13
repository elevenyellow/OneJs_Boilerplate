// worktree-policy.js — OpenCode plugin mirroring the Claude Code PreToolUse
// hooks (scripts/hooks/git-guard.mjs + worktree-guard.mjs) so the worktree→PR
// workflow is enforced under OpenCode too, regardless of how many workers run.
//
// Enforced on the primary `main` checkout (blocked → throw):
//   - `bash`: state-changing git (commit/push/rebase/…) — commit inside the
//     change's worktree instead. Escape: CLAUDE_GIT_ALLOW=1.
//   - `edit`/`write`/`patch`: editing implementation code (apps/, packages/,
//     .oneJs/). Create a worktree first. Escape: CLAUDE_MAIN_EDIT=1.
// Inside a linked worktree everything passes; docs/openspec/scripts/config on
// main pass. Single source of truth: the exported detectors are reused here.

import {
  isLinkedWorktree,
  offendingGhMerge,
  offendingGit,
} from '../../scripts/hooks/git-guard.mjs'
import { blockedImplEdit } from '../../scripts/hooks/worktree-guard.mjs'

const envOn = (v) => Boolean(v) && v !== '0' && v.toLowerCase() !== 'false'

export const WorktreePolicy = async ({ directory }) => {
  return {
    'tool.execute.before': async (input, output) => {
      const tool = input?.tool
      const args = output?.args ?? {}

      // Bash: block `gh pr merge` unconditionally (a merge needs a human), and
      // state-changing git on the primary checkout.
      if (tool === 'bash' && typeof args.command === 'string') {
        if (offendingGhMerge(args.command)) {
          throw new Error(
            "Merge policy: 'gh pr merge' integrates a PR into main and must NOT " +
              'run autonomously — a merge always requires human verification. Open/' +
              'keep the PR (draft), run merge-review, and let the operator merge it.',
          )
        }
        if (envOn(process.env.CLAUDE_GIT_ALLOW)) return
        const offending = offendingGit(args.command)
        if (offending && !isLinkedWorktree(args.command, directory)) {
          throw new Error(
            `Git policy: '${offending}' changes git state on the primary 'main' ` +
              `checkout. Commit/push inside the change's git worktree instead ` +
              `(main is protected; merge PRs on GitHub). Escape: CLAUDE_GIT_ALLOW=1. ` +
              `See AGENTS.md → Git Policy.`,
          )
        }
      }

      // Edit/Write/Patch: block implementation-code edits on the primary checkout.
      if (
        (tool === 'edit' || tool === 'write' || tool === 'patch') &&
        typeof args.filePath === 'string'
      ) {
        if (envOn(process.env.CLAUDE_MAIN_EDIT)) return
        const rel = blockedImplEdit(args.filePath, directory)
        if (rel) {
          throw new Error(
            `Worktree workflow: editing implementation code (${rel}) in the ` +
              `primary 'main' checkout is not allowed — this work belongs in a ` +
              `per-change worktree. Create one: scripts/spec-worktree.sh new <change>. ` +
              `Docs/openspec/scripts/config on main are fine. Escape: CLAUDE_MAIN_EDIT=1. ` +
              `See AGENTS.md → Git Policy.`,
          )
        }
      }
    },
  }
}
