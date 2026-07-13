---
name: /opsx-propose
id: opsx-propose
category: Workflow
description: Propose a new change and generate required artifacts
---

> **Maintenance**: Derived from `.agents/skills/openspec-propose/SKILL.md`; update both surfaces together.

Read and follow `.agents/skills/openspec-propose/SKILL.md`.

Create or continue an OpenSpec change proposal. Generate every artifact required by the active OpenSpec schema until the change is ready for implementation. Write only inside `openspec/changes/<change-id>/` unless the user explicitly asks for a different artifact update.

When ready to implement, use `/opsx-apply`.
