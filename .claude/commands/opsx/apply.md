---
description: Implement tasks from an OpenSpec change
disable-model-invocation: true
---

# OpenSpec Apply

> **Maintenance**: Thin Claude Code wrapper for `.agents/skills/openspec-apply-change/SKILL.md`; keep workflow behavior in the canonical skill.

Read and follow `.agents/skills/openspec-apply-change/SKILL.md`.

Implement tasks from an existing OpenSpec change. Always select the change, inspect `openspec status --change "<name>" --json`, read the context files returned by `openspec instructions apply --change "<name>" --json`, then work through pending tasks until complete or blocked.

If all tasks are complete, suggest `/opsx:review` before `/opsx:archive`.
