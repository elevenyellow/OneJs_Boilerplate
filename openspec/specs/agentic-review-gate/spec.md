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

### Requirement: Reviewer subagents run only during spec-review

Reviewer subagents (`code-reviewer`, `tests-reviewer`, `architecture-reviewer`, `frontend-reviewer`) SHALL NOT be auto-invoked during `spec-apply` or `spec-archive`. They SHALL be invoked only by the `openspec-review` SKILL (the dedicated `spec-review` phase), or manually by the operator through the standalone `task-*-review` skills.

#### Scenario: Apply does not fan out to reviewers
- **WHEN** an operator runs `spec-apply` and completes a task
- **THEN** no reviewer subagent is invoked automatically as part of completing the task

#### Scenario: Review phase invokes reviewers
- **WHEN** an operator runs `spec-review` on a change with all tasks complete
- **THEN** the review SKILL invokes `code-reviewer`, `tests-reviewer`, and `architecture-reviewer` in parallel

#### Scenario: Manual reviewer invocation remains available
- **WHEN** an operator explicitly invokes `/task-code-review`, `/task-tests-review`, `/task-architecture-review`, or `/task-frontend-review` outside of `spec-review`
- **THEN** the corresponding reviewer runs as before, with no behavioural change to the skill

### Requirement: Frontend reviewer selection based on diff

The `openspec-review` SKILL SHALL invoke `frontend-reviewer` only when the change's diff against the base branch includes files under `packages/*/infrastructure/` or `apps/`. When diff detection fails, the SKILL SHALL invoke `frontend-reviewer` as a safe default.

#### Scenario: Change touches infrastructure layer
- **GIVEN** a change whose diff against `main` includes files under `packages/*/infrastructure/`
- **WHEN** the review SKILL determines which reviewers to invoke
- **THEN** `frontend-reviewer` is invoked alongside the other reviewers

#### Scenario: Change touches apps
- **GIVEN** a change whose diff against `main` includes files under `apps/`
- **WHEN** the review SKILL determines which reviewers to invoke
- **THEN** `frontend-reviewer` is invoked alongside the other reviewers

#### Scenario: Change touches only domain or application layers
- **GIVEN** a change whose diff against `main` includes no files under `packages/*/infrastructure/` or `apps/`
- **WHEN** the review SKILL determines which reviewers to invoke
- **THEN** `frontend-reviewer` is not invoked

#### Scenario: Diff detection fails
- **GIVEN** a change where `git diff` cannot resolve the merge-base (for example, no `main` branch, detached HEAD, or shallow clone)
- **WHEN** the review SKILL attempts to determine which reviewers to invoke
- **THEN** `frontend-reviewer` is invoked as a safe default

### Requirement: Archive delegates to the openspec CLI

The `openspec-archive-change` SKILL SHALL delegate the archive operation to the `openspec archive "<name>" --yes` CLI command and SHALL NOT run reviewer subagents. Reviewers run during `spec-review`, not `spec-archive`. Archive trusts that `spec-review` left the tree green.

#### Scenario: Clean change closes successfully
- **GIVEN** all tasks in a change are complete, `spec-review` has been run, and the codebase is green
- **WHEN** the operator runs `spec-archive`
- **THEN** the SKILL runs `@project-validator`, delegates `openspec archive "<name>" --yes`, and confirms the change moved to `openspec/changes/archive/<id>/`

#### Scenario: Pre-archive validator fails
- **GIVEN** a change where the validator is red
- **WHEN** the operator runs `spec-archive` and the validator run fails
- **THEN** the SKILL surfaces the failure and does not proceed to archive until the validator is green

#### Scenario: Re-running archive on an already-archived change
- **GIVEN** a change whose folder has already been moved under `openspec/changes/archive/`
- **WHEN** the operator runs `spec-archive` for the same change id
- **THEN** the SKILL detects the archived state and short-circuits

### Requirement: AGENTS.md publishes the validation gate as the cross-cutting contract

`AGENTS.md` SHALL contain a "Mandatory Validation Gate" section requiring `@project-validator` after every completed task during `apply`, and SHALL NOT contain a "Mandatory Review Gate" requiring reviewers per task.

#### Scenario: Validation gate present
- **WHEN** any operator or agent reads `AGENTS.md`
- **THEN** the file contains a clearly labelled "Mandatory Validation Gate" section that names `@project-validator` and the lint/typecheck/test trio

#### Scenario: Review gate removed
- **WHEN** any operator or agent reads `AGENTS.md`
- **THEN** the file does not contain a "Mandatory Review Gate" section or any instruction to run reviewer subagents after every task

### Requirement: spec-archive agent uses sonnet low reasoning

The `spec-archive` agent in `opencode.json` SHALL use `claude-sonnet-4.6` with `reasoningEffort: "medium"` and `temperature: 0.1`.

#### Scenario: spec-archive agent configuration
- **WHEN** OpenCode loads `opencode.json`
- **THEN** `agent.spec-archive.model` is `claude-sonnet-4.6`, `agent.spec-archive.reasoningEffort` is `medium`, and `agent.spec-archive.temperature` is `0.1`
