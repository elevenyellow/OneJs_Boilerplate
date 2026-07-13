---
name: openspec-merge-review
description: Pre-merge gate for the worktree→PR workflow. Given a spec branch / PR, checks supersession and mergeability against the CURRENT main, runs the reviewer panel on the branch→main diff, confirms the branch gate is green, and emits a MERGE / REBASE-FIRST / CLOSE-SUPERSEDED / FIX verdict. Never merges — the operator merges. Use right before merging a PR into main.
license: MIT
compatibility: Requires git + openspec CLI + reviewer subagents.
---

Pre-merge gate. Run this on a `spec/<change>` branch (or its PR) **before** merging into `main`. It does NOT merge, push, or mutate git — it inspects, reviews, and recommends. The operator performs the merge.

**This gate is a single terminal pass — it never loops or re-runs itself.** It executes the workflow once, emits exactly one verdict, and stops. The verdicts `FIX`, `REBASE-FIRST`, and `CLOSE-SUPERSEDED` are **handoffs to the operator**, not instructions this gate acts on: it must NOT auto-rebase, auto-fix findings, auto-push, or re-invoke merge-review afterwards. Fixing blockers and re-reviewing is a separate, human-initiated `apply`/`review` cycle. An autonomous runner that treats a `FIX`/`REBASE-FIRST` verdict as "fix and re-run me" creates an unbounded rebase/fix→re-review loop — that is the failure this rule exists to prevent. If this gate has already returned the *same* blocking verdict on the *same* branch tip, do not run it again; escalate to the operator.

This closes the gap that `openspec-review` (pre-archive, on the local change) leaves: in the worktree→PR flow the merge is a separate, later action, and `main` may have evolved since the branch was cut. This gate validates the branch against the CURRENT `main`.

**Input**: a spec branch name (`spec/<change>`), a change id, or a PR number. If missing, infer from the current worktree branch; if ambiguous, run `git branch --list 'spec/*'` (and `gh pr list` if available) and ask.

## Workflow

1. **Resolve & orient.** Determine `BRANCH=spec/<change>` and announce `Merge-review: <BRANCH>`. `git fetch origin main --quiet`. Establish `BASE=origin/main`.

2. **Supersession check** (the trap we keep hitting). Determine whether the branch's work is already in `main`:
   - Net-new files the branch adds vs its merge-base: `git diff --diff-filter=A --name-only $(git merge-base $BASE $BRANCH) $BRANCH` — check whether each already exists in `$BASE`.
   - Distinctive new symbols/exports the branch introduces — grep `$BASE` (`git cat-file`/`git grep $BASE`) for them.
   - If `main` already contains the work (files present + symbols found) → **verdict `CLOSE-SUPERSEDED`**: recommend closing the PR (merging would revert `main`) and pruning the worktree (`scripts/spec-worktree.sh remove <change>`). Stop.

3. **Mergeability.** `git merge-base --is-ancestor $BASE $BRANCH`:
   - If `$BASE` is NOT an ancestor of `$BRANCH`, the branch is behind `main` → likely conflicts. Dry-run: `git merge-tree $(git merge-base $BASE $BRANCH) $BASE $BRANCH` and scan for conflict markers.
   - If diverged/conflicting → **verdict `REBASE-FIRST`**: recommend `git rebase main` in the worktree (resolve per git-strategy: union distinct features, take main for shared catalog/data, reconstruct tangled tests), then `git push --force-with-lease`. Stop until clean.

4. **Green gate.** Confirm the branch tip is green. If the branch was pushed, its `pre-push` hook already ran lint+typecheck+tests; note the last push result. If unsure, recommend the operator push (or run the trio in the worktree). A red branch → **verdict `FIX`**.

5. **Reviewer panel on the branch→main diff.** Compute changed files: `git diff --name-only $BASE...$BRANCH`. Dispatch the reviewer subagents **scoped to that diff only** (not the whole repo), in parallel, **exactly once**:
   - `@code-reviewer` — always.
   - `@tests-reviewer` — if any `__tests__/` or `*.test.*` changed.
   - `@architecture-reviewer` — if `packages/*/domain|application`, ports/adapters, or `*.model.prisma` changed.
   - `@frontend-reviewer` — if `apps/admin`, `apps/summit`, or `apps/web` changed.
   Collect findings; keep only CRITICAL/HIGH as merge-blocking.

   **Bounds (prevent runaway fan-out):** launch each applicable reviewer **once** for this branch tip — do not re-spawn the panel within a run, and do not re-run the panel on a tip you have already reviewed (idempotent per branch-tip SHA). The reviewers are leaf agents: they report findings only and must not spawn further sub-agents or trigger fixes.

6. **Verdict.** Emit one of:
   - **`MERGE`** — no supersession, mergeable (or already rebased), green, no blocking findings. The PR should already contain the archive move (archive runs in the worktree before this gate — see openspec-archive-change); if it does not, send it back to `archive` first. Print the merge command for the operator:
     ```bash
     gh pr merge <pr> --merge        # or the operator's preferred method — carries the archived state into main
     scripts/spec-worktree.sh remove <change>   # after merge: prune worktree + branch
     ```
   - **`REBASE-FIRST`** / **`CLOSE-SUPERSEDED`** / **`FIX`** — with the specific reason, the blocking items, and the exact next command **for the operator to run**. Do NOT recommend merging, and do NOT act on the command yourself or re-run this gate. Then **stop** — the operator decides whether to rebase/fix (a fresh `apply`/`review` cycle) and, when ready, re-invoke merge-review. Blocking findings often need human judgment (e.g. a deliberately quarantined flaky E2E, or a finding that is out of the change's scope) — surfacing them, not auto-fixing them, is the whole job.

## Guardrails

- **Never** run `merge`, `push`, `rebase`, or any state-changing git — this gate is read-only except for spawning reviewer subagents. The operator merges.
- **Single terminal pass — never loop.** Run the workflow once, emit one verdict, stop. Never auto-rebase/auto-fix/auto-push on a `FIX`/`REBASE-FIRST` verdict, and never re-invoke merge-review yourself. Fixing blockers is a separate human-initiated `apply`/`review` cycle; only then does the operator re-run this gate. Re-running on an unchanged branch tip, or acting on the verdict's command, is the runaway loop this forbids.
- **Reviewer panel runs once per branch tip.** Do not re-spawn reviewers within a run or re-review a tip already reviewed; reviewers are leaf agents (no sub-agents, no fixes).
- Review the diff **against the current `main`**, not the branch in isolation — `main` may have moved.
- A branch whose work is already in `main` is **closed, not merged** — merging reverts `main`.
- Scope reviewers to the branch→main diff; do not re-review the whole repo.
- If `gh` is unavailable, still do supersession/mergeability/reviewers against `origin/main` and report the manual merge steps.
- Blocking = CRITICAL/HIGH only; MEDIUM/LOW are advisory in the summary.
