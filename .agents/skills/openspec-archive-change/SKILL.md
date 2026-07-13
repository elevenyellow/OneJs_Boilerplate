---
name: openspec-archive-change
description: Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change AFTER `review` has left the tree green. This mode does NOT run reviewers or the project-validator — that is `review`'s job.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.1"
  generatedBy: "1.3.1"
---

Archive a completed change in the experimental workflow.

**Position in workflow**: explore → propose → apply → review → **archive**.

This mode assumes `review` already ran successfully (validator green, reviewer findings resolved, fixes committed). If the operator skipped `review`, prompt them to run it first; archive is a clerical move, not a quality gate.

This mode delegates the final spec merge and archive move to the official OpenSpec CLI. Do not reimplement archive behavior with filesystem moves. The wrapper's job is to apply the project's policy before and after the CLI call.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Choose spec update policy**

   `sync` is optional and belongs before review when the operator wants to inspect `openspec/specs/` while the change remains active. Archive itself can update specs, so do not run a separate sync here.

   Check for delta specs at `openspec/changes/<name>/specs/`.

   **If delta specs exist:**
   - Default recommendation: archive and update canonical specs with `openspec archive "<name>" --yes`
   - Offer "Archive without updating specs" only for infrastructure, tooling, or docs-only changes where the operator explicitly wants `--skip-specs`

   **If no delta specs exist:**
   - Proceed with the default archive command. The CLI will have no specs to update.

5. **Confirm `review` has run**

   Verify the tree is in a post-review state:
   - Run `git status --porcelain` — must be clean. If dirty, stop and ask the operator to commit or stash; archive never runs on a dirty tree.
   - Optionally check recent commits for a review pass (`git log --oneline -20`). If there is no evidence `review` ran and the operator did not explicitly confirm, prompt via AskUserQuestion:
     a. Stop and run `review` first (recommended)
     b. Proceed anyway (the operator takes responsibility for skipping the gate)

   This mode does **not** run `@project-validator` or any reviewer subagents. Those live in the `review` mode.

6. **Perform the archive with the official CLI**

    **Idempotency check:** If `openspec/changes/archive/` already contains a directory matching the pattern `*-<change-name>` for the same change id, short-circuit and report that the change is already archived.

    Build the command from the spec update policy:

    ```bash
    openspec archive "<name>" --yes
    ```

    If the operator explicitly chose to archive without updating specs:

    ```bash
    openspec archive "<name>" --skip-specs --yes
    ```

    Capture and summarize the CLI output. If the CLI fails, stop and report the exact failure. Do not try to complete the archive manually.

7. **Normalize generated canonical spec purposes**

    If specs were updated (not skipped), inspect the canonical specs touched by the archive before committing:

    ```bash
    rg -n "TBD - created by archiving change" openspec/specs
    ```

    For each generated placeholder found:
    - Replace only the `Purpose` placeholder text with a concise, human-readable purpose derived from the archived change's `proposal.md`, `design.md`, or capability name.
    - Keep the CLI-merged requirements and scenarios unchanged.
    - If a meaningful purpose cannot be inferred, stop and ask the operator for wording before committing.

    Then run `openspec validate --all`. If validation fails, fix the spec formatting/content and re-run it before committing.

8. **Commit the archive move**

    Stage the archive move and any spec updates created by the CLI, then commit per the rules in `.agents/skills/guidelines/git-strategy/SKILL.md` (loaded via `instructions`). Use a `chore(openspec)` scope:

    ```bash
    git add -A
    git commit -m "chore(openspec): archive <change-name>"
    ```

    If specs were updated or skipped, mention it in the body. Do not leave archive changes uncommitted — the working tree must be clean before the summary.

9. **Display summary**

    Show archive completion summary including:
    - Change name
    - Schema that was used
    - Archive location
    - Whether specs were updated, skipped, or unchanged according to the CLI output
    - Whether generated canonical spec purpose placeholders were normalized
    - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ Updated by `openspec archive` (or "No delta specs" or "Skipped with --skip-specs")

All artifacts complete. All tasks complete. Review gate previously passed.
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings — just inform and confirm
- Show clear summary of what happened
- Delegate archive to `openspec archive`; never move the change directory manually
- Use `openspec archive "<name>" --yes` by default after this wrapper has handled prompts
- Use `--skip-specs --yes` only when the operator explicitly chooses to archive without updating specs
- Do not use `--no-validate` unless the operator explicitly requests it after acknowledging the risk
- Never archive on a dirty working tree
- Before committing, replace any generated `TBD - created by archiving change` purpose placeholders in canonical specs and run `openspec validate --all`
- This mode does NOT run reviewers or `@project-validator`; if the operator skipped `review`, prompt them before proceeding
- Detect already-archived changes and short-circuit
