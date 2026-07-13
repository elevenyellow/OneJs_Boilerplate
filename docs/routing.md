# Routing & Controllers (`@OneJs/server`)

Decorator-driven HTTP routing on top of [Elysia.js](https://elysiajs.com/). Controllers are `@Injectable()` classes; route methods receive an Elysia `Context`.

## Imports

```typescript
import {
  Controller,
  Get, Post, Put, Patch, Delete,
  Server, ServerPlugin,
  type Context,         // re-export of Elysia's Context
  type AnyMiddleware,
} from '@OneJs/server'
```

## Defining a controller

```typescript
import { Inject, Injectable, ErrorCodes, OneJsError } from '@OneJs/core'
import { Controller, Get, Post } from '@OneJs/server'
import type { Context } from 'elysia'
import { UserService } from '../../application/user.service'

@Injectable()
@Controller('/users')
export class UserController {
  constructor(@Inject(UserService) private readonly users: UserService) {}

  @Get('/')
  async list(_ctx: Context) {
    const all = await this.users.findAll()
    return all.map((u) => u.toDto())
  }

  @Get('/:id')
  async get(ctx: Context) {
    const user = await this.users.findById(ctx.params.id)
    if (!user)
      throw new OneJsError('Not Found', 404, 'User not found', {}, ErrorCodes.RESOURCE_NOT_FOUND)
    return user.toDto()
  }

  @Post('/')
  async create(ctx: Context) {
    const body = ctx.body as Partial<{ email: string; password: string }>
    if (!body?.email || !body?.password)
      throw new OneJsError('Validation failed', 400, 'email and password required', {}, ErrorCodes.VALIDATION_FAILED)

    const user = await this.users.register(body.email, body.password)
    ctx.set.status = 201
    return user.toDto()
  }
}
```

### Key conventions

| Rule | Why |
|------|-----|
| Controller is `@Injectable()` + `@Controller(prefix)` | Container constructs it and binds the prefix |
| Constructor injects services via `@Inject(ServiceClass)` | No tokens — concrete class is the token |
| Route methods accept `ctx: Context` | Elysia's request context — `params`, `body`, `query`, `headers`, `set`, `store` |
| Return the response value directly | Elysia serializes plain objects to JSON |
| Set status via `ctx.set.status = 201` | Don't construct manual `Response` objects |
| Throw `OneJsError` for failures | Error middleware translates to JSON response |
| Validate input at the controller boundary | Construct DTOs / VOs before passing to services |

## HTTP method decorators

- `@Get(path)`
- `@Post(path)`
- `@Put(path)`
- `@Patch(path)`
- `@Delete(path)`

All accept an Elysia path pattern (`/`, `/:id`, `/files/*`). Patterns combine with the controller's `@Controller(prefix)` and the global server prefix.

## Context

Re-export of [Elysia `Context`](https://elysiajs.com/essential/handler.html#context):

```typescript
ctx.params   // path params: { id: string }
ctx.body     // request body (cast to your shape)
ctx.query    // query string params
ctx.headers  // request headers
ctx.request  // raw Request object
ctx.set      // mutate response: set.status, set.headers, set.cookie
ctx.store    // request-scoped data (used by AuthMiddleware, requestIdMiddleware)
```

When typing `ctx.body`, cast to a `Partial<>` of your DTO and validate explicitly — Elysia's schema system isn't wired by default in this boilerplate.

## Authentication & authorization

`@UseAuth()` and `@Roles(...roles)` from `@OneJs/auth`. See [Auth docs](auth.md).

```typescript
import { Roles, UseAuth } from '@OneJs/auth'
import { AppRoles } from '@shared/auth'

@Controller('/tasks')
export class TaskController {
  @Get('/')
  async list(_ctx: Context) { /* public */ }

  @Post('/')
  @UseAuth()                            // any authenticated user
  async create(ctx: Context) { /* ... */ }

  @Delete('/:id')
  @UseAuth()
  @Roles(AppRoles.ADMIN)                // admin only
  async delete(ctx: Context) { /* ... */ }
}
```

## Middleware

Use the `@Use(...)` decorator to attach middleware to a controller or a single route:

```typescript
import { Controller, Get, Use } from '@OneJs/server'
import { rateLimitMiddleware } from '../middlewares/rate-limit'

@Controller('/api')
@Use(rateLimitMiddleware)               // applies to every route in this controller
export class ApiController {
  @Get('/heavy')
  @Use(extraGuardMiddleware)            // applies only to this route
  async heavy(ctx: Context) { /* ... */ }
}
```

Middleware is a function `(ctx: Context) => void | Promise<void>` that mutates the context, sets headers, or throws.

## Bootstrap & server start

```typescript
// apps/api/index.ts
import { OneJs, logger } from '@OneJs/core'
import { AutoLoaderPlugin } from '@OneJs/core/bootstrap'
import { Server, ServerPlugin, requestIdMiddleware, type AnyMiddleware } from '@OneJs/server'
import cors from '@elysiajs/cors'

const container = await new OneJs()
  .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
  .use(new ServerPlugin())
  .start()

const port = Number(process.env.PORT ?? 4000)

container
  .get(Server)
  .setPrefix('/api')                    // all routes prefixed with /api
  .use(requestIdMiddleware)             // global middleware
  .use(cors({ credentials: true }) as unknown as AnyMiddleware)
  .start(port, () => {
    logger.info('api:startup', `Server started on port ${port}`)
  })
```

### `Server` API

| Method | Purpose |
|--------|---------|
| `setPrefix(prefix)` | Global path prefix (e.g. `/api`, `/api/v1`) |
| `use(middleware)` | Attach a global Elysia middleware / plugin |
| `start(port, callback?)` | Bind the port and run the callback once listening |

Controllers register themselves automatically when the bootstrap auto-loader imports them (decorator side effect).

## Error handling

`@OneJs/server` registers an error middleware that catches `OneJsError` and returns:

```json
{
  "type": "Validation failed",
  "statusCode": 400,
  "message": "email is required",
  "details": {},
  "code": "VALIDATION_FAILED"
}
```

Uncaught generic `Error` returns 500 with code `SERVER_ERROR`. Always prefer `OneJsError` so the client gets actionable info.

## See also

- [Auth](auth.md) — `@UseAuth`, `@Roles`, strategies
- [Health & Observability](health-and-observability.md) — `HealthController`, `requestIdMiddleware`
- [Error Handling](conventions/patterns/error-handling.md) — `OneJsError` patterns
- [Service Patterns](conventions/patterns/service-patterns.md) — how controllers delegate to services
