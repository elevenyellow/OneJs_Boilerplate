# OneJs Framework

Internal framework for the OneJs DDD Boilerplate.

## Packages

- `@OneJs/core` — DI, Entity/VO base classes, Logger, OneJsError
- `@OneJs/server` — Elysia HTTP server integration
- `@OneJs/event-bus` — Event bus with Redis bridge
- `@OneJs/jobs` — BullMQ job queue integration
- `@OneJs/prisma` — Prisma ORM integration
- `@OneJs/auth` — Clerk authentication integration

## Documentation

For project conventions, architecture, and usage patterns, see:
- Root [AGENTS.md](../AGENTS.md) — authoritative source for all conventions
- [docs/conventions/](../docs/conventions/) — detailed pattern documentation
- `apps/api/index.ts` — real integration example
- Each package's `src/__tests__/` — actual usage examples
