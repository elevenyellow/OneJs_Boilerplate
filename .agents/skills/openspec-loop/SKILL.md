---
name: openspec-loop
description: Unattended Ralph-style loop over an OpenSpec change. Implements ONE task per iteration with strict TDD, gated by @project-validator, until every task is checked. Driven externally by scripts/loop.sh.
license: MIT
metadata:
  author: onejs-boilerplate
  version: "1.0"
---

# OpenSpec Loop Harness (Ralph)

You are working in a loop driven by `scripts/loop.sh`. **Each iteration is a
fresh session.** The git history and the files on disk are your memory — not
your context window.

This harness defines HOW you work. `openspec/changes/$CHANGE/` defines WHAT
you are building. The change id arrives in your kickoff prompt; if it is
missing, stop and ask for it.

This is the unattended sibling of the `spec-apply` mode. It loads the same
`openspec-apply-change` skill but with ONE hard override: **you implement
exactly one task per iteration, then stop.** The external loop will start the
next iteration.

---

## Phase 0 — Orientation (read before acting)

Study the current state. Do NOT assume something is missing just because it is
not in your context — verify on disk first.

- `openspec/changes/$CHANGE/tasks.md` — `- [ ]` is pending, `- [x]` is done.
- `openspec/changes/$CHANGE/proposal.md` — the why and the scope.
- `openspec/changes/$CHANGE/design.md` — technical decisions and discarded alternatives.
- `openspec/changes/$CHANGE/specs/` — Given-When-Then scenarios.
- `openspec/config.yaml` — project context and referenced guidelines.
- `git log --oneline -20`
- `bun test 2>&1 | tail -30`
- `bun run typecheck 2>&1 | tail -30`

## Phase 1 — Pick the next task

Open `openspec/changes/$CHANGE/tasks.md`. Pick the **lowest-numbered unchecked
`- [ ]` item**. Do ONLY that one. **One task per iteration** (guardrail L3).

## Phase 2 — Implement with strict TDD baby steps

Follow `.agents/skills/guidelines/tdd-practices/SKILL.md` and
`.agents/skills/guidelines/testing-standards/SKILL.md`. For each behavioural
slice of the task:

- **RED**: write ONE failing test. Run it, see it fail.
- **GREEN**: write the minimum production code to pass. Faking is allowed only
  when the next test in the SAME iteration generalises it.
- **REFACTOR**: clean up while tests stay green. Re-run after each change.

Respect hexagonal boundaries (`.agents/skills/guidelines/hexagonal-architecture/SKILL.md`)
and design principles (`.agents/skills/guidelines/design-principles/SKILL.md`):
ports in domain, adapters in infrastructure, constructor injection, no
getters/setters, `@OneJs/*` imports in infrastructure layer only.

## Phase 3 — Validate, then commit (MANDATORY gate)

Before marking anything done, the task MUST pass the project validation gate.

1. Invoke `@project-validator` (it runs `lint:fix` + `typecheck` + `test`).
2. If it reports failures, fix them and re-invoke. **Do not proceed until green.**
   This gate is non-negotiable — it mirrors the `spec-apply` mode rule.
3. Only when green: flip the `- [ ]` you just finished to `- [x]` in `tasks.md`.
4. Commit with a Conventional Commit scoped to the change, following
   `.agents/skills/guidelines/git-strategy/SKILL.md`:
   `git commit -m "<type>(<scope>): <task summary>"`.

## Phase 4 — Completion check

Emit the completion sigil ONLY when **EVERY task AND every acceptance criterion
in `tasks.md` is `- [x]`**. Verify each one explicitly on disk first. If, and
only if, all are checked and the validator is green:

<promise>DONE</promise>

(alone on its own line). Otherwise, end the iteration normally — the next loop
picks up the next task.

---

## Guardrails

### L1 — DO NOT lie to escape the loop
If you are stuck, you must NOT emit the completion sigil. The loop exists to
keep you working. Honesty above all. Leave the task `- [ ]` and explain the
blocker.

### L2 — DO NOT implement placeholders
No `throw new Error("not implemented")`. No `// TODO`. If you cannot finish a
task this iteration, leave its checkbox `- [ ]` and the next loop will pick it
up. Fake-it inside a baby step is allowed only when the next test of the SAME
iteration generalises it.

### L3 — One task per iteration
Do not implement multiple tasks in one iteration even if you can see the next
one. This keeps each session bounded and the git history clean.

### L4 — Strict TDD, always
Failing test BEFORE production code. No exceptions.

### L5 — The validator gate is mandatory
Never flip a checkbox to `- [x]` without a green `@project-validator` run in
the same iteration. Never delete or weaken a test to make it pass — fix the
implementation.

### L6 — NEVER invoke reviewer subagents
Do NOT call `@code-reviewer`, `@tests-reviewer`, `@architecture-reviewer`, or
`@frontend-reviewer`, and do NOT run the `/task-*-review` skills. Reviewers
belong to the dedicated `spec-review` mode that runs between implementation and
`spec-archive`. The ONLY subagent this loop may call is `@project-validator`.

### L7 — Parallel reads, serial builds
You may parallelise reads (search, grep, file inspection). You MUST serialise
builds (`bun test`, `bun run typecheck`, lint) — run them one at a time.

### L8 — Verify, do not assume
Before claiming a test passes, run it. Before claiming a file exists, list the
directory. Before claiming an import works, run the typecheck.

### L9 — Test naming
Follow the naming style in `.agents/skills/guidelines/testing-standards/SKILL.md`:
`describe("The [Subject]", ...)` using the domain concept (not the function
name), and domain verbs for cases (calculates, accepts, rejects, lists) rather
than technical verbs (returns, throws, calls). In Phase 4, verify every test
name follows this.
