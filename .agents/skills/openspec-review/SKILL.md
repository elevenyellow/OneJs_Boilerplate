---
name: openspec-review
description: Run the full review gate for an implemented OpenSpec change before archive. Invokes code/tests/architecture/frontend reviewers in parallel, consolidates findings, applies fixes, and validates until green. Use after `apply` completes all tasks and before `archive`.
license: MIT
metadata:
  author: smoke-test
  version: "1.0"
---

Run the full review gate for an implemented OpenSpec change before it can be archived.

**Input**: Optionally specify a change name. If omitted, try to infer it from conversation context or from the single active change. If ambiguous, prompt the user via the AskUserQuestion tool using `openspec list --json`.

**Position in workflow**: explore → propose → apply → **review** → archive.

This mode owns everything that used to live between "all tasks done" and "move to archive":
- final `@project-validator` check
- the four reviewer subagents (`code-reviewer`, `tests-reviewer`, `architecture-reviewer`, `frontend-reviewer`)
- consolidating findings, applying fixes, and re-validating until green

`apply` keeps its per-task `@project-validator` gate for fast feedback. `archive` no longer runs reviewers — it trusts that `review` already left the tree green.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` and use the AskUserQuestion tool

   Announce: "Reviewing change: <name>".

2. **Confirm implementation is complete**

   Run `openspec status --change "<name>" --json` and read the tasks file.

   - If tasks are incomplete (`- [ ]` present) or artifacts are not `done`, surface the gap and ask the operator via AskUserQuestion whether to:
     a. Stop and go back to `apply`
     b. Proceed with a partial review anyway (record the decision in the summary)

   Default recommendation: stop. Reviewers run best against complete work.

3. **Run an initial validation pass**

   Invoke `@project-validator` once as a pre-review baseline.

   - If red: surface the failure and stop. Do not run reviewers on a broken tree — fix lint/typecheck/tests first (delegate to `apply` or fix in place per operator's choice).
   - If green: continue.

4. **Detect affected surfaces**

   Run `git diff --name-only "$(git merge-base HEAD main)...HEAD"` (or the equivalent against the repo's default branch) to detect which files changed.

   Set a boolean `frontendTouched` flag: true if any path matches `^apps/(webapp|mobile)/` or `^packages/ui/`.

   **Fallback**: if `git merge-base` fails (detached HEAD, no `main`, shallow clone), treat `frontendTouched` as `true` (safe default — don't miss a UI regression).

5. **Run reviewers in parallel**

   Invoke the following reviewer subagents concurrently via the Task tool, each scoped to the change folder and the diff:
   - `code-reviewer` (always)
   - `tests-reviewer` (always)
   - `architecture-reviewer` (always)
   - `frontend-reviewer` (only if `frontendTouched` is `true`)

   Pass each reviewer:
   - the change id and the path `openspec/changes/<name>/`
   - the diff scope (base ref and HEAD)
   - explicit instruction: apply low-ambiguity fixes inside the scope, surface anything ambiguous as a finding

   All reviewers run in a single message (parallel tool calls) to minimize wall-clock time.

6. **Consolidate findings**

   Collect every reviewer's output. For each finding, classify it as:
   - **Applied** — the reviewer already wrote the fix
   - **Auto-apply** — low ambiguity, can be fixed without operator input (do it now)
   - **Needs decision** — design/UX/scope question for the operator

   Apply all auto-apply fixes.

   If any **Needs decision** findings remain:
   - Surface them grouped by reviewer with file/line references
   - Ask the operator via AskUserQuestion how to proceed (apply manually, delegate back to a specific reviewer, defer to a follow-up change, or ignore with justification)
   - Wait for guidance before continuing

7. **Re-run the validator until green**

   After any fixes are applied, invoke `@project-validator` again.

   - If red: address failures, re-invoke. Repeat until green.
   - If a fix from a reviewer caused the regression and the operator chose to defer it, revert that specific fix and re-validate.

   Do not finish the review until the validator is green.

8. **Commit review fixes**

   If reviewers or the operator applied any fixes during this run, stage and commit them per `.agents/skills/guidelines/git-strategy/SKILL.md` (loaded via `instructions`). Use Conventional Commits with the most fitting scope (typically the package or bounded context touched, or `chore(review)` for cross-cutting fixes).

   The working tree must be clean before the summary — do not leave review fixes uncommitted for the operator to clean up.

9. **Display review summary**

   ```
   ## Review Complete

   **Change:** <change-name>
   **Validator:** ✓ green
   **Reviewers run:** <list, e.g., "code, tests, architecture, frontend">
   **Findings:**
     - Applied by reviewers: <n>
     - Auto-applied: <n>
     - Deferred (with operator approval): <n>
   **Commits:** <hashes or "none — no fixes needed">

   Ready to archive. Run `archive` next.
   ```

**Output On Stop (Pre-Review Validator Red)**

```
## Review Blocked — Validator Red

**Change:** <change-name>
**Validator:** ✗ <summary of failures>

The tree must be green before reviewers run. Fix the validator failures (via `apply` or directly) and re-run `review`.
```

**Output On Stop (Unresolved Findings)**

```
## Review Paused — Unresolved Findings

**Change:** <change-name>
**Findings needing a decision:**
  1. [<reviewer>] <file:line> — <description>
  2. ...

What would you like to do?
```

**Guardrails**
- Never run reviewers on a red validator — fix first, review second.
- Always run the four reviewers in parallel (skip `frontend-reviewer` only when nothing under `apps/webapp`, `apps/mobile`, or `packages/ui` changed).
- Reviewers are scoped to the change diff; do not let them refactor unrelated code.
- Never finish `review` with a red validator or unresolved high-severity findings.
- Never leave review fixes uncommitted — `archive` expects a clean tree.
- This mode never moves the change to `archive/` — that is `archive`'s job. Stop after the review summary and let the operator switch modes.
- If the operator invokes `review` on a change that is already archived (folder under `openspec/changes/archive/`), short-circuit and report it.
