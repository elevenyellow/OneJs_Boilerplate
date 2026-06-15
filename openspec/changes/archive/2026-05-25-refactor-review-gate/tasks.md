## 1. Update opencode.json archive mode

- [x] 1.1 In `opencode.json`, change `mode.archive.reasoningEffort` from `"low"` to `"medium"`. Leave model (`github-copilot/claude-sonnet-4.5`), temperature (`0.1`), tools, and prompt unchanged.
- [x] 1.2 Verify the file is still valid JSON and the `$schema` reference still resolves.

## 2. Update AGENTS.md — swap review gate for validation gate

- [x] 2.1 In `AGENTS.md`, remove the existing "## Mandatory Review Gate" section in its entirety, including the paragraph that mandates running `/task-code-review`, `/task-tests-review`, `/task-architecture-review`, and the conditional `/task-frontend-review`.
- [x] 2.2 In the same location, add a new "## Mandatory Validation Gate" section. The section MUST state that after every completed task during `apply`, `@project-validator` (lint + typecheck + test) must run and the task MUST NOT be marked complete in `tasks.md` until the validator returns green. Use the same forceful tone as the previous review gate (non-negotiable, no skipping, no deferring).
- [x] 2.3 In the same section, add one sentence clarifying that reviewer subagents (`code-reviewer`, `tests-reviewer`, `architecture-reviewer`, `frontend-reviewer`) now run only during `archive`, and that the `task-*-review` skills remain available as manual escape hatches.

## 3. Update apply SKILL — enforce validation gate

- [x] 3.1 In `.agents/skills/openspec-apply-change/SKILL.md`, modify step 6 ("Implement tasks (loop until done or blocked)") so the per-task loop explicitly includes invoking `@project-validator` after the code changes are written and before marking the task as `[x]` in `tasks.md`.
- [x] 3.2 In the same step, document the failure path: if the validator returns red, address the failures, re-invoke the validator, and only then mark the task complete. The task stays unchecked while the validator is red.
- [x] 3.3 Add a bullet to the "Guardrails" section: "Never mark a task complete without a green @project-validator run."
- [x] 3.4 Add a sentence to the "Fluid Workflow Integration" section noting that operators may manually invoke `/task-architecture-review` (or any other `/task-*-review`) mid-change if they want early architectural feedback; these are escape hatches, not required.

## 4. Update archive SKILL — orchestrate the closing sequence

- [x] 4.1 In `.agents/skills/openspec-archive-change/SKILL.md`, between current step 4 ("Assess delta spec sync state") and current step 5 ("Perform the archive"), insert a new step "Run final validation". This step invokes `@project-validator` once; if red, surface the failure and stop without proceeding to reviewers.
- [x] 4.2 Insert a subsequent step "Detect affected surfaces". This step runs `git diff --name-only "$(git merge-base HEAD main)...HEAD"` (or the equivalent against the repo's default branch), parses the result, and sets a boolean for whether any file path matches `^apps/(webapp|mobile)/`. Document the fallback: if `git merge-base` fails, treat the frontend flag as `true` (safe default).
- [x] 4.3 Insert a subsequent step "Run reviewers in parallel". This step invokes `code-reviewer`, `tests-reviewer`, and `architecture-reviewer` in parallel via the Task tool. If the frontend flag is `true`, also invoke `frontend-reviewer` in the same parallel batch. Document that each reviewer receives the change folder path and the diff scope.
- [x] 4.4 Insert a subsequent step "Consolidate and apply findings". This step gathers reviewer outputs, applies low-ambiguity fixes (reviewers with `write: true` may have already applied theirs), and, if any non-trivial findings remain unresolved, surfaces them and asks the operator how to proceed.
- [x] 4.5 Insert a subsequent step "Re-run validator". After fixes, invoke `@project-validator` again. Do not proceed to the move step until green.
- [x] 4.6 At the top of the current step 5 ("Perform the archive"), add an idempotency check: if `openspec/changes/archive/` already contains a directory matching `YYYY-MM-DD-<name>` for the same change id, short-circuit and report that the change is already archived. Do not re-run reviewers.
- [x] 4.7 Update the "Output On Success" template to include sections for "Validator: ✓", "Reviewers run: <list>", and "Findings resolved: <count>".
- [x] 4.8 Add bullets to "Guardrails": (a) never archive on a red validator, (b) never archive with unresolved reviewer findings, (c) detect already-archived changes and short-circuit.

## 5. Validate the change end-to-end

- [x] 5.1 Run `openspec validate refactor-review-gate --strict` and confirm the change validates without errors.
- [x] 5.2 Re-read `AGENTS.md`, `opencode.json`, `.agents/skills/openspec-apply-change/SKILL.md`, and `.agents/skills/openspec-archive-change/SKILL.md` together as a single artifact to confirm the four documents agree on the new contract (validator-per-task in apply, reviewers-only-at-archive with frontend diff filter).
- [x] 5.3 Run `@project-validator` on the working tree to confirm the documentation-only changes have not introduced lint or formatting issues in any file touched.

## 6. Commit

- [x] 6.1 Stage all modified files and create a single conventional commit: `refactor(agentic): replace per-task review gate with validation gate; move reviewers into archive`. Body should summarise the four decisions captured in `design.md`.
