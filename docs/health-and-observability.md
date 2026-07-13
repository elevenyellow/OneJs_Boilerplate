# Health Checks & Observability

`@OneJs/server` ships built-in primitives for production observability: a health-check controller and a request-ID middleware. Both are optional — wire them in your app entry point when needed.

## Health Checks (`HealthController`)

A controller exposing the three probe endpoints expected by Kubernetes, Cloud Run, Fly, Render, and most PaaS load balancers.

| Endpoint | Probe type | Use |
|----------|-----------|-----|
| `GET /health/` | (generic) | Aggregated health summary — uptime, env, timestamp |
| `GET /health/live` | Liveness | Is the process alive? (PaaS will restart on failure) |
| `GET /health/ready` | Readiness | Can the process serve traffic? (PaaS will remove from LB on failure) |

### Source

`/.oneJs/server/src/controllers/health.controller.ts`

### Register it

The controller is decorated with `@Controller('/health')`. To make it active, ensure it's discovered by the bootstrap auto-loader:

```typescript
// apps/api/index.ts
import { OneJs } from '@OneJs/core'
import { AutoLoaderPlugin } from '@OneJs/core/bootstrap'
import { HealthController } from '@OneJs/server'   // re-exported

const container = await new OneJs()
  .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
  .start()
```

Or register it explicitly via the controller registry (advanced).

### Response shape

```json
// GET /health
{
  "status": "ok",
  "timestamp": "2026-06-16T14:00:00.000Z",
  "uptime": 12345.67,
  "environment": "production"
}

// GET /health/live
{ "status": "alive", "timestamp": "..." }

// GET /health/ready
{ "status": "ready", "timestamp": "..." }
```

### Extending readiness

Default `/health/ready` always returns 200. In real deployments you want it to check downstream dependencies (DB, Redis, etc.) and return 503 when unhealthy.

```typescript
// packages/<app>/infrastructure/controllers/app-health.controller.ts
import { Inject, Injectable } from '@OneJs/core'
import { Controller, Get } from '@OneJs/server'
import { PrismaClientOneJs } from '@OneJs/prisma'
import type { Context } from 'elysia'

@Injectable()
@Controller('/health')
export class AppHealthController {
  constructor(@Inject(PrismaClientOneJs) private readonly db: PrismaClientOneJs) {}

  @Get('/ready')
  async ready(ctx: Context) {
    try {
      await this.db.$queryRaw`SELECT 1`
      return { status: 'ready', dependencies: { db: 'ok' } }
    } catch (err) {
      ctx.set.status = 503
      return {
        status: 'not_ready',
        dependencies: { db: 'failing' },
        error: (err as Error).message,
      }
    }
  }
}
```

If you keep the built-in `HealthController` registered alongside your custom one, the last-registered wins for `/health/ready`. Prefer registering only your own controller in production deployments.

## Request ID (`requestIdMiddleware`)

Plain function middleware that:

1. Reads `x-request-id` from the incoming request, or generates a fresh UUIDv4.
2. Adds `x-request-id` to the response headers.
3. Stores the ID on `ctx.store.requestId` for downstream access (logging, error reporting).

### Source

`/.oneJs/server/src/middlewares/request-id.middleware.ts`

### Wire it globally

```typescript
// apps/api/index.ts
import { OneJs } from '@OneJs/core'
import { Server, ServerPlugin, requestIdMiddleware } from '@OneJs/server'

const container = await new OneJs()
  .use(new ServerPlugin())
  .start()

container
  .get(Server)
  .setPrefix('/api')
  .use(requestIdMiddleware)
  .start(4000)
```

### Use the ID in services

```typescript
import { Inject, Injectable, Logger } from '@OneJs/core'
import type { Context } from 'elysia'

@Injectable()
export class SomeController {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  @Post('/')
  async create(ctx: Context) {
    const requestId = (ctx.store as any).requestId
    this.logger.info('app:request', `[${requestId}] creating resource`)
    // pass requestId into application services for end-to-end correlation
  }
}
```

### When to set `x-request-id` on the client

Upstream callers (load balancer, API gateway, frontend SDK) often inject `x-request-id` already. The middleware respects whatever is present and only generates a new UUID when missing — this preserves request correlation across hops.

## Recommended observability stack

This repo ships the building blocks. Full observability typically adds:

| Concern | Tool / pattern |
|---------|----------------|
| Structured logs | `Logger` already uses pino under the hood — pipe stdout to your log collector |
| Metrics | Prometheus + `prom-client` — add `/metrics` endpoint |
| Tracing | OpenTelemetry SDK + auto-instrumentation for Elysia, Prisma, Redis |
| Error reporting | Sentry / Highlight — hook into `OneJsError` in error middleware |
| APM | Datadog / New Relic agent at process level |

None of these are wired by default — add as needed per deployment target.

## Pre-deployment checklist

Before shipping to production:

- [ ] `/health/live` returns 200 within 100ms of startup
- [ ] `/health/ready` checks every critical downstream (DB, Redis, external APIs)
- [ ] `requestIdMiddleware` is registered globally
- [ ] Logger pipes to a log aggregator
- [ ] CORS is configured for actual frontend origins (not `*`)
- [ ] Process handles `SIGTERM` for graceful shutdown (TODO: Phase 3 of `.oneJs/` refactor will add this)
