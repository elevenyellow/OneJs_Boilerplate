---
name: task-frontend-review
description: Review infrastructure layer changes (packages/*/infrastructure/, apps/api/) for Elysia controller conventions and layer boundary violations. Triggers "review controllers", "review infrastructure", "infrastructure review".
argument-hint: "[git range]"
context: fork
agent: frontend-reviewer
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Infrastructure Review

Launch the `frontend-reviewer` subagent to review changed infrastructure files under `packages/*/infrastructure/` and `apps/api/`, fix issues, and re-run the smallest relevant validation.

## Scope resolution (in order)

1. If `$ARGUMENTS` is a git range (e.g. `abc123...HEAD`), use it:
   ```bash
   git diff --name-only <range> -- 'packages/*/infrastructure/**' 'apps/**' '*.ts'
   ```
2. Otherwise prefer staged or unstaged changed files.
3. Otherwise diff the current branch against `main`:
   ```bash
   git diff --name-only main -- 'packages/*/infrastructure/**' 'apps/**'
   ```
4. If none of those produces a trustworthy scope, stop and ask the user to narrow it.

Exclude tests, generated files, `node_modules`.

## What the agent checks

- **Controllers**: delegate to application services only — no domain logic, no direct repository calls.
- **VO construction at boundary**: raw request primitives → VO → `service.run(vo)`.
- **Error translation**: `OneJsError` caught and mapped to HTTP status codes.
- **App wiring** (`apps/api/`): thin shell only — CORS, server config, DI registration.
- **DI conventions**: `@Injectable()` on every class, `@Inject(ConcreteClass)` on constructor params.
- **Response format**: DTOs from `entity.toDto()`, no raw entities, no sensitive fields.

## Rules

- Never review or edit the whole repository by default.
- Never touch files outside the resolved scope.
- Never move domain logic into controllers.
- Never use `npm` — Bun only.

## Validation

1. `bun run typecheck`
2. `bun run lint:fix`

## References

- `docs/conventions/patterns/service-patterns.md`
- `docs/conventions/patterns/file-organization.md`
- `docs/conventions/patterns/error-handling.md`

## Output

A table per file: issues found, fixes applied, residual risks.
