## Context

The repository currently enforces a heavyweight review cycle after every production code change. From `AGENTS.md`:

> **Mandatory Review Gate**: After implementing or modifying production code, you MUST run `/task-code-review`, `/task-tests-review`, and `/task-architecture-review` in parallel **before reporting the task as complete**.

That gate fans out to four opus/sonnet-class reviewer subagents per task. In an OpenSpec `apply` session with 10–15 tasks, this means dozens of reviewer invocations for a single change, most of which find nothing actionable because the increment was too small to evaluate architecturally. Meanwhile, the cheap deterministic gate (lint + typecheck + test, run by `project-validator`) is implicit — operators are expected to remember it.

We have agreed (see conversation log preceding this proposal) on four design decisions:
1. The `apply` skill is responsible for invoking `project-validator` after each task (option C: the SKILL prompt enforces it).
2. Reviewers run only inside `archive`, and are filtered: `code`, `tests`, `architecture` always run; `frontend` runs only when the change touches `apps/webapp` or `apps/mobile`.
3. The `archive` mode keeps `claude-sonnet-4.5` but moves from `reasoningEffort: "low"` to `"medium"` to support the orchestration.
4. `AGENTS.md` swaps "Mandatory Review Gate" for "Mandatory Validation Gate".

This design captures the rationale and the trade-offs.

## Goals / Non-Goals

**Goals:**
- Cheap, deterministic backpressure (`project-validator`) runs on every completed task during `apply`.
- Expensive, opinionated review (the four reviewer subagents) runs once per change, at archive time.
- Reviewer selection at archive time reflects the actual diff (frontend reviewer is conditional).
- The contract between `apply`, `archive`, `project-validator`, and reviewers is documented as a first-class capability (`agentic-review-gate`) so it can evolve without re-reading prose in `AGENTS.md`.
- Manual escape hatches (`/task-*-review` skills) remain available for operators who want mid-change review.

**Non-Goals:**
- Not introducing loops, Ralph-style autonomous iteration, or external schedulers.
- Not changing reviewer subagent prompts, models, scopes, or tool permissions.
- Not changing `explore`, `propose`, `init` modes or the `project-validator` subagent.
- Not changing the trigger for any reviewer beyond the `frontend-reviewer` diff filter.
- Not introducing a new mode (`close`); `archive` absorbs the orchestration.

## Decisions

### Decision 1 — Validation gate lives inside the `apply` SKILL prompt (option C)

**Choice:** The `openspec-apply-change` SKILL prompt instructs the model to invoke `@project-validator` after writing code for each task, and to refuse to mark the task as complete in `tasks.md` until validation returns green.

**Alternatives considered:**
- **Option A — `apply` mode invokes validator implicitly.** Rejected: hides orchestration inside the mode runtime; harder to reason about and harder to override.
- **Option B — Operator invokes validator manually.** Rejected: too easy to skip, defeats the purpose of a "gate".

**Rationale:** This mirrors the existing pattern in `AGENTS.md` (which already used option C for reviewers). The model has agency to obey or skip, but the contract is explicit in prose and reviewable. No runtime coupling.

### Decision 2 — Reviewers run only at archive, filtered by diff

**Choice:** `archive` runs `code-reviewer`, `tests-reviewer`, and `architecture-reviewer` unconditionally. `frontend-reviewer` runs only when `git diff` against the change base reveals files under `apps/webapp/` or `apps/mobile/`.

**Alternatives considered:**
- **All four reviewers always.** Rejected: wastes opus tokens on changes that never touched frontend.
- **Frontend filter declared in `proposal.md` frontmatter.** Rejected: requires `propose` to predict the diff and adds friction; less reliable than the diff itself.
- **Reviewer-by-content heuristic** (e.g. "does `tasks.md` mention `webapp`?"). Rejected: subjective and easy to miscalibrate.

**Rationale:** `git diff` is the ground truth of what changed. The rule is one line of `bash`, easy to inspect and easy to extend later (e.g. skip `tests-reviewer` if no `tests/` files changed — explicitly out of scope here but possible).

**Diff detection:** the change base is the branch point against `main` (or the current default branch). Concretely:
```bash
git diff --name-only "$(git merge-base HEAD main)...HEAD" \
  | grep -E '^apps/(webapp|mobile)/' \
  && run_frontend_reviewer
```
This is documented in the `archive` SKILL.

### Decision 3 — `archive` mode upgraded to `reasoningEffort: medium`

**Choice:** `opencode.json → mode.archive.reasoningEffort` moves from `low` to `medium`. Model (`claude-sonnet-4.5`) and temperature (`0.1`) unchanged.

**Alternatives considered:**
- **Keep `low`.** Rejected: `archive` now orchestrates reviewers, parses findings, decides which to apply directly vs. delegate, and re-validates. Low effort risks shallow consolidation.
- **Upgrade to `claude-opus-4.7 high`.** Rejected: archive's job is orchestration and decision-making, not deep reasoning. The reviewers it invokes already use opus where it matters. Paying opus rates for the orchestrator is double-counting.

**Rationale:** Sonnet `medium` is the sweet spot for "read findings, decide, dispatch fixes". The expensive thinking happens inside the reviewers.

### Decision 4 — Replace "Mandatory Review Gate" with "Mandatory Validation Gate" in `AGENTS.md`

**Choice:** The section header and body in `AGENTS.md` change to enforce validator-after-each-task. Reviewers are explicitly moved to "run at archive time, see `openspec-archive-change` SKILL".

**Alternatives considered:**
- **Keep both gates (validator per task + reviewers per task).** Rejected: that is the current state and the problem we are fixing.
- **Remove both gates and rely on operator discipline.** Rejected: loses the cheap deterministic backpressure that is the whole point.

**Rationale:** The repo's source-of-truth for cross-cutting agent rules is `AGENTS.md`. Both gates have to be reflected there; otherwise the model running `apply` will follow stale instructions.

### Decision 5 — `archive` keeps full orchestration responsibility; no new `close` mode

**Choice:** Reuse the existing `archive` mode rather than introduce a `close` step before it.

**Alternatives considered:**
- **New `close` mode that runs reviewers + fixes, then `archive` only moves files.** Rejected for the four-modes simplicity: operators already think `explore → propose → apply → archive`; adding `close` doubles the cognitive load for marginal gain.

**Rationale:** The mental model "archive = close out the change" already implies validation + review + fix + move. Folding it into a single mode keeps the surface small.

## Risks / Trade-offs

**[Risk] Architectural drift discovered late.** Reviewers no longer flag patterns per task, so a violation introduced in task 3 may propagate to task 12 before `architecture-reviewer` sees it at archive time. → **Mitigation:** `/task-architecture-review` remains available as a standalone skill; operators are expected to invoke it on demand when the change is large or touches sensitive layers. Document this affordance in the new `apply` SKILL.

**[Risk] Operator skips the validation gate.** Option C relies on the model obeying the SKILL instruction. → **Mitigation:** The SKILL must be explicit (numbered, prominent), and the validation gate language in `AGENTS.md` should be at least as forceful as the previous review gate. Same level of trust the repo already places in option C.

**[Risk] Archive turn becomes slow and expensive.** Four reviewers in parallel, plus potential fixes and re-validation, can take many minutes and tokens. → **Mitigation:** Reviewers run in parallel (not sequential). Frontend filter eliminates unnecessary work. Sonnet-medium orchestrator is cheap. The cost is concentrated in one well-bounded turn instead of smeared across N tasks.

**[Risk] Diff detection edge cases.** `git merge-base HEAD main` may fail in detached HEAD, on long-lived branches, or in fresh clones without `main`. → **Mitigation:** The SKILL documents a fallback: if diff detection fails, run `frontend-reviewer` to err on the safe side. Better an extra reviewer than a missed regression.

**[Trade-off] Less feedback per task in `apply`.** Operators lose the per-task architectural sanity check. This is a deliberate choice in favour of speed and signal-to-noise.

**[Trade-off] `archive` is no longer trivially idempotent.** Re-running `archive` on a change that was already archived needs the SKILL to detect the archived state and short-circuit. Documented in the SKILL.
