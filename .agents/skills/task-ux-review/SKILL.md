---
name: task-ux-review
description: API ergonomics evaluation of the Elysia backend — route naming, response shape, HTTP codes, and error consistency. Triggers "review UX", "API review", "check ergonomics".
argument-hint: "[spec:<path> | description of what to review]"
context: fork
agent: ux-reviewer
allowed-tools: Read, Glob, Bash, mcp__playwright__browser_network_request, mcp__playwright__browser_network_requests
---

# API Ergonomics Review

Launch the `ux-reviewer` subagent to evaluate the Elysia API's external surface quality — route design, response shape, HTTP status codes, and error format consistency.

## Usage

```
/task-ux-review spec:openspec/changes/<name>/specs/    → Extract endpoints from a spec
/task-ux-review "user registration endpoints"          → Free-text focus
/task-ux-review                                        → Auto-discover all controllers
```

## Prerequisites

- Backend running at `http://localhost:4000` (`bun run api` if not started).

## What the agent checks

- REST route naming (plural nouns, no verbs in paths, consistent `:id` params)
- HTTP status codes (201 for creation, 204 for deletion, correct 4xx mapping)
- Response shape consistency (DTOs from `entity.toDto()`, camelCase JSON keys)
- Error format consistency (same shape across all endpoints, no stack trace leaks)
- No sensitive fields in responses (password hashes, internal IDs)

## Output

Per endpoint group: controller path, findings table (category → issue → proposed fix → severity).
