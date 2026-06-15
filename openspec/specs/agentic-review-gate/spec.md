## ADDED Requirements

### Requirement: Validation gate enforced after every apply task

The `openspec-apply-change` SKILL SHALL require the `@project-validator` subagent to run after the code for each task in `tasks.md` is written, and SHALL forbid marking a task as complete until the validator returns green (lint, typecheck, and tests all passing).

#### Scenario: Task completes with green validator
- **GIVEN** an operator is running `apply` on a change with pending tasks
- **WHEN** the model finishes writing code for a task and `@project-validator` returns no failures
- **THEN** the model marks the task as `[x]` in `tasks.md` and proceeds to the next task

#### Scenario: Task blocked by red validator
- **GIVEN** an operator is running `apply` on a change with pending tasks
- **WHEN** the model finishes writing code for a task and `@project-validator` reports lint, typecheck, or test failures
- **THEN** the model addresses the failures and re-invokes `@project-validator` before considering the task complete, and the task remains unchecked in `tasks.md` until validation is green

#### Scenario: Validator not invoked
- **GIVEN** an operator is running `apply` on a change with pending tasks
- **WHEN** the model writes code for a task without invoking `@project-validator`
- **THEN** the SKILL prompt instructs the model to invoke the validator before reporting any task as complete

### Requirement: Reviewer subagents run only at archive time

Reviewer subagents (`code-reviewer`, `tests-reviewer`, `architecture-reviewer`, `frontend-reviewer`) SHALL NOT be auto-invoked during `apply`. They SHALL be invoked only by the `openspec-archive-change` SKILL, or manually by the operator through the standalone `task-*-review` skills.

#### Scenario: Apply does not fan out to reviewers
- **WHEN** an operator runs `apply` and completes a task
- **THEN** no reviewer subagent is invoked automatically as part of completing the task

#### Scenario: Archive invokes reviewers
- **WHEN** an operator runs `archive` on a change with all tasks complete
- **THEN** the archive SKILL invokes `code-reviewer`, `tests-reviewer`, and `architecture-reviewer` in parallel

#### Scenario: Manual reviewer invocation remains available
- **WHEN** an operator explicitly invokes `/task-code-review`, `/task-tests-review`, `/task-architecture-review`, or `/task-frontend-review` outside of `archive`
- **THEN** the corresponding reviewer runs as before, with no behavioural change to the skill

### Requirement: Frontend reviewer selection based on diff

The `openspec-archive-change` SKILL SHALL invoke `frontend-reviewer` only when the change's diff against the base branch includes files under `apps/webapp/` or `apps/mobile/`. When diff detection fails, the SKILL SHALL invoke `frontend-reviewer` as a safe default.

#### Scenario: Change touches webapp
- **GIVEN** a change whose diff against `main` includes files under `apps/webapp/`
- **WHEN** the archive SKILL determines which reviewers to invoke
- **THEN** `frontend-reviewer` is invoked alongside the other reviewers

#### Scenario: Change touches mobile
- **GIVEN** a change whose diff against `main` includes files under `apps/mobile/`
- **WHEN** the archive SKILL determines which reviewers to invoke
- **THEN** `frontend-reviewer` is invoked alongside the other reviewers

#### Scenario: Change touches only backend
- **GIVEN** a change whose diff against `main` includes no files under `apps/webapp/` or `apps/mobile/`
- **WHEN** the archive SKILL determines which reviewers to invoke
- **THEN** `frontend-reviewer` is not invoked

#### Scenario: Diff detection fails
- **GIVEN** a change where `git diff` cannot resolve the merge-base (for example, no `main` branch, detached HEAD, or shallow clone)
- **WHEN** the archive SKILL attempts to determine which reviewers to invoke
- **THEN** `frontend-reviewer` is invoked as a safe default

### Requirement: Archive orchestrates the full closing sequence

The `openspec-archive-change` SKILL SHALL execute the following sequence before moving the change to `archive/`:
1. Run `@project-validator` once as a final pre-review check.
2. Detect affected surfaces via `git diff` against the change's base branch.
3. Launch `code-reviewer`, `tests-reviewer`, and `architecture-reviewer` in parallel; conditionally launch `frontend-reviewer` per the diff rule.
4. Consolidate reviewer findings and apply fixes (directly, or by delegating back to a reviewer that has write access).
5. Re-run `@project-validator` and verify all findings are resolved.
6. Move the change folder to `openspec/changes/archive/<id>/`.

#### Scenario: Clean change closes successfully
- **GIVEN** all tasks in a change are complete and the codebase is green
- **WHEN** the operator runs `archive`
- **THEN** the SKILL runs the validator, launches the applicable reviewers in parallel, finds no actionable issues, runs the validator again, and moves the change to `archive/`

#### Scenario: Reviewer findings block archive until resolved
- **GIVEN** a change where `code-reviewer` reports a naming violation
- **WHEN** the operator runs `archive`
- **THEN** the SKILL applies the fix, re-runs the validator, and only proceeds to move the change once the validator is green and no unresolved findings remain

#### Scenario: Pre-review validator fails
- **GIVEN** a change where `apply` left a red test or type error
- **WHEN** the operator runs `archive` and the initial validator run fails
- **THEN** the SKILL surfaces the failure and does not proceed to reviewers until the validator is green

#### Scenario: Re-running archive on an already-archived change
- **GIVEN** a change whose folder has already been moved under `openspec/changes/archive/`
- **WHEN** the operator runs `archive` for the same change id
- **THEN** the SKILL detects the archived state and short-circuits without re-running reviewers

### Requirement: AGENTS.md publishes the validation gate as the cross-cutting contract

`AGENTS.md` SHALL contain a "Mandatory Validation Gate" section requiring `@project-validator` after every completed task during `apply`, and SHALL NOT contain a "Mandatory Review Gate" requiring reviewers per task.

#### Scenario: Validation gate present
- **WHEN** any operator or agent reads `AGENTS.md`
- **THEN** the file contains a clearly labelled "Mandatory Validation Gate" section that names `@project-validator` and the lint/typecheck/test trio

#### Scenario: Review gate removed
- **WHEN** any operator or agent reads `AGENTS.md`
- **THEN** the file does not contain a "Mandatory Review Gate" section or any instruction to run reviewer subagents after every task

### Requirement: Archive mode uses sonnet medium reasoning

The `archive` mode in `opencode.json` SHALL use `claude-sonnet-4.5` with `reasoningEffort: "medium"` and `temperature: 0.1`.

#### Scenario: Archive mode configuration
- **WHEN** OpenCode loads `opencode.json`
- **THEN** `mode.archive.model` is `github-copilot/claude-sonnet-4.5`, `mode.archive.reasoningEffort` is `medium`, and `mode.archive.temperature` is `0.1`
