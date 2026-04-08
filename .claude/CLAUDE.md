# OneJs Boilerplate — Claude Instructions

## Project Overview

TypeScript monorepo (Bun runtime) providing a full-stack framework with:
- **DI Container** — decorator-based IoC (`@Injectable`, `@Inject`, `@Optional`)
- **Plugin system** — lifecycle-based bootstrap (`BootstrapPlugin`)
- **Event bus** — in-memory pub/sub with middleware support
- **HTTP server** — Hono-based with controller decorators
- **Prisma integration** — schema merging across packages
- **Jobs scheduler** — cron-based background tasks

## Rules

@rules/common/coding-style.md
@rules/common/testing.md
@rules/common/patterns.md
@rules/common/security.md
@rules/common/agents.md
@rules/common/development-workflow.md
@rules/typescript/coding-style.md
@rules/typescript/testing.md
@rules/typescript/patterns.md
@rules/typescript/security.md
@rules/domain.md

## Project Conventions

### No property accessors
Do NOT use JavaScript `get`/`set` property accessors in class definitions:
```typescript
// WRONG
class Foo {
  get name() { return this._name }
  set name(v) { this._name = v }
}

// CORRECT — use explicit methods
class Foo {
  getName(): string { return this._name }
  withName(name: string): Foo { return new Foo(name) }
}
```

### Test framework
- Runtime: **Bun** — use `import { describe, test, expect, beforeEach } from 'bun:test'`
- Test files: `*.test.ts` next to source files
- Run tests: `bun --test`

### Package structure
- Framework packages live in `.oneJs/` (core, server, event-bus, prisma, jobs)
- Domain packages live in `packages/`
- Apps live in `apps/`
- Import framework via workspace aliases: `@OneJs/core`, `@OneJs/server`, etc.

### Linting & formatting
- **Biome** is the formatter and linter — run `biome check --write <file>` after edits
- No `console.log` in production code — use the `logger` from `@OneJs/core`
- No `any` types — use `unknown` and narrow safely

### DI Container usage
- Register services via `@Injectable` decorator, not `container.register()` directly
- Resolve via bootstrap auto-loader, not `container.get()` directly in application code
- `container.get()` is acceptable only in tests and plugins

## Commands

```bash
bun --test                    # run all tests
bun run start:api:dev         # start API in dev mode
bun run prisma:build          # merge + generate Prisma schema
bunx biome check --write .    # format + lint everything
```
