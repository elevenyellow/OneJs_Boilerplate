---
name: task-qa
description: Functional QA of the Elysia API against a spec or description, plus integration test coverage audit. Triggers "QA", "manual testing", "check flows".
argument-hint: "[spec:<path> | description of flows to test]"
context: fork
agent: qa-tester
allowed-tools: Read, Glob, Grep, Bash, mcp__playwright__browser_network_request, mcp__playwright__browser_network_requests, mcp__playwright__browser_evaluate, mcp__playwright__browser_console_messages
---

# QA Testing

Launch the `qa-tester` subagent to verify API flows against a spec (or free-text description) via direct HTTP requests, and audit integration test coverage for the flows exercised.

## Usage

```
/task-qa spec:openspec/changes/<name>/specs/          → Extract flows from a spec folder
/task-qa "user registration and login flow"            → Free-text flow description
/task-qa                                               → Auto-discover routes from controllers
```

## Prerequisites

- Backend running at `http://localhost:4000` (`bun run api`).
- InMemory repositories or test DB wired if the flow touches persistence.

## What the agent verifies

- Each acceptance criterion exercised via real HTTP requests.
- Success path status codes (200/201) and DTO shape match expectations.
- At least one failure path per endpoint (invalid input, not-found, conflict).
- `OneJsError` surfaces correct HTTP status and error message shape.
- No 500 errors on happy path; no sensitive data leaking in responses.

## Integration test coverage audit

After running the flows, the agent inspects `packages/*/tests/integration/` for existing tests and reports:

- Flows covered by automated integration tests vs only verified manually.
- Recommended new integration tests (file path + description).

## Rules

- Never modify production code to make a flow pass — report the bug.
- Never write new tests inside this run — only recommend them.
- Never use `npm` — Bun only.

## Output

- Per acceptance criterion: ✅ / ❌ with evidence (route, status code, response excerpt).
- Errors and anomalies encountered.
- Coverage audit table: flow → covered by integration test? → recommendation.
