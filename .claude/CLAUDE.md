# Claude Code — Project-Specific Instructions

These instructions extend `AGENTS.md` (shared with Copilot) with behavior specific to Claude Code.

## Review Policy

Do NOT run reviewer agents (`/task-code-review`, `/task-tests-review`, `/task-architecture-review`) automatically after every task. Reviewers run only during the dedicated `spec-review` phase (`/opsx:review`) or when the operator explicitly requests one. The per-task gate is `@project-validator-fast` during interactive apply (escalate to full `@project-validator` on broad blast radius, schema changes, or last task of a block). Unattended `spec-loop` always uses the full `@project-validator`.
