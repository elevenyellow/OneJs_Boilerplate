## Why

The current AGENTS.md enforces a "Mandatory Review Gate" that runs four code reviewers (code, tests, architecture, frontend) after every production code change. This is expensive (opus-class models), slow (four parallel subagents), and noisy (most micro-changes do not warrant architectural review). At the same time, cheap deterministic backpressure (lint, typecheck, test) is not explicitly enforced after each apply task — relying on the operator to remember.

We want to invert the cost curve: run cheap validation often, run expensive review rarely but at the right moment.

## What Changes

- **BREAKING** Remove the "Mandatory Review Gate" from `AGENTS.md` that requires running `/task-code-review`, `/task-tests-review`, `/task-architecture-review` (and optionally `/task-frontend-review`) after every code change.
- Add a new "Mandatory Validation Gate" to `AGENTS.md` requiring `@project-validator` (lint + typecheck + test) after every completed task during `apply`.
- Update `.agents/skills/openspec-apply-change/SKILL.md` to enforce the validation gate: a task is not marked complete in `tasks.md` until `@project-validator` returns green.
- Update `.agents/skills/openspec-archive-change/SKILL.md` to orchestrate the full closing sequence: final validation → detect affected surfaces via `git diff` → launch reviewers in parallel (frontend reviewer conditional on diff touching `apps/webapp` or `apps/mobile`) → consolidate and apply findings → re-validate → move change to `archive/`.
- Upgrade `mode.archive` in `opencode.json` from `reasoningEffort: "low"` to `"medium"` to support the added orchestration responsibility. Model and temperature unchanged.
- Reviewer subagents (`code-reviewer`, `tests-reviewer`, `architecture-reviewer`, `frontend-reviewer`) and the standalone `task-*-review` skills remain available as manual escape hatches but are no longer auto-invoked during `apply`.

## Capabilities

### New Capabilities
- `agentic-review-gate`: defines when and how validation (cheap, frequent) and review (expensive, gated) run inside the OpenSpec workflow. Owns the contract between `apply`, `archive`, `project-validator`, and the four reviewer subagents.

### Modified Capabilities
<!-- none — first formal capability for the agentic workflow -->

## Impact

**Affected files**
- `opencode.json` — `mode.archive.reasoningEffort` raised to `medium`.
- `AGENTS.md` — "Mandatory Review Gate" section replaced by "Mandatory Validation Gate".
- `.agents/skills/openspec-apply-change/SKILL.md` — adds validation-gate step.
- `.agents/skills/openspec-archive-change/SKILL.md` — rewrites closing flow with diff-based reviewer selection.

**Affected packages / apps**
None directly. This is an agentic-workflow change; no production code under `packages/` or `apps/` is modified. All bounded contexts are unaffected.

**Behavioural impact for operators**
- Faster `apply` turns — no more 4-reviewer fan-out per task; only the validator runs.
- Slower `archive` turn — it now orchestrates reviewers, fixes, and re-validation before moving the change.
- Architectural issues that previously surfaced per-task will now surface only at archive time. Operators who want mid-change architectural feedback can still invoke `/task-architecture-review` manually.

**Non-goals**
- Not introducing loops, Ralph-style autonomous iteration, or any external scheduler.
- Not changing the reviewer subagents themselves (their prompts, models, or scopes).
- Not changing `explore`, `propose`, or `init` modes.
- Not changing the `project-validator` subagent.
- Not introducing automatic reviewer selection beyond the simple `git diff` rule for `frontend-reviewer`.
