---
name: openspec-apply-change
description: Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.3.1"
---

Implement tasks from an OpenSpec change.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (Cursor: `/opsx-apply <other>`; Claude Code: `/opsx:apply <other>`; OpenCode: `spec-apply <other>`).

2. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using Cursor `/opsx-propose`, Claude Code `/opsx:propose`, or OpenCode `spec-propose` to complete artifacts
   - If `state: "all_done"`: congratulate, suggest review via Cursor `/opsx-review`, Claude Code `/opsx:review`, or OpenCode `spec-review` before archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

6. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - Invoke `@project-validator-fast` to validate the delta (scoped lint + scoped tests + incremental typecheck)
   - If the fast validator returns red, address the failures and re-invoke until green
   - If the fast validator tells you to escalate (broad blast radius, schema change, or last task of the block), run the full `@project-validator` instead
   - Only when validation is green, mark task complete in the tasks file: `- [ ]` → `- [x]`
   - Continue to next task

   At the end of a **block of related tasks** (or the whole change), run the full `@project-validator` once as a checkpoint — the per-task fast gate keeps the inner loop cheap, the checkpoint guarantees the whole monorepo is green. Unattended `loop` runs always use the full `@project-validator` on every task.

   Commit policy:
   - `apply` is interactive and MUST NOT create commits unless the operator explicitly asks for a commit in this run or the already-approved tasks explicitly require one.
   - If a commit is requested, update the relevant `tasks.md` checkboxes before staging and include `tasks.md` in the same commit as the implementation/docs changes.
   - If no commit is requested, leave the intended implementation/docs changes and updated `tasks.md` uncommitted, then report a suggested Conventional Commit message.
   - Never create a separate "mark tasks complete" commit as the default path; that is only a repair step when a previous run committed too early.

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

7. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - Commit status:
     - If a commit was explicitly requested: report the commit hash/message and confirm the working tree is clean
     - If no commit was requested: report that changes are uncommitted and provide a suggested Conventional Commit message
   - If all done: suggest review via Cursor `/opsx-review`, Claude Code `/opsx:review`, or OpenCode `spec-review` before archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! Ready for explicit review.
Run Cursor `/opsx-review`, Claude Code `/opsx:review`, or OpenCode `spec-review` before archive.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Never mark a task complete without a green validator run — use `@project-validator-fast` per task during interactive apply; escalate to `@project-validator` on broad blast radius, schema changes, or last task of a block
- Update task checkbox immediately after completing each task, before any requested final commit
- Do not commit during `apply` unless the operator explicitly requested it or the already-approved tasks explicitly require it
- When committing during `apply`, include the updated `tasks.md` in the same logical commit; do not leave post-commit checkbox changes behind
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names
- **NEVER invoke reviewer subagents in `apply` mode.** Specifically: do NOT call `@code-reviewer`, `@tests-reviewer`, `@architecture-reviewer`, or `@frontend-reviewer`, and do NOT run the `/task-code-review`, `/task-tests-review`, `/task-architecture-review`, `/task-frontend-review`, `/task-ux-review`, or `/task-qa` skills. Reviewers belong to the dedicated `review` mode that runs between `apply` and `archive`. The ONLY subagents `apply` is allowed to call are `@project-validator-fast` (per-task gate) and `@project-validator` (checkpoint/escalation). If you feel the urge to "double-check" with a reviewer, resist — that is `review`'s job.

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
