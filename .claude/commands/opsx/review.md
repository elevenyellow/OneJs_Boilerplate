---
description: Run the explicit OpenSpec review gate
disable-model-invocation: true
---

# OpenSpec Review

> **Maintenance**: Thin Claude Code wrapper for `.agents/skills/openspec-review/SKILL.md`; keep workflow behavior in the canonical skill.

Read and follow `.agents/skills/openspec-review/SKILL.md`.

Run the explicit review gate for an implemented OpenSpec change. Validate first, launch the scoped reviewers in parallel, consolidate findings, re-validate, and leave the change ready for `/opsx:archive`.
