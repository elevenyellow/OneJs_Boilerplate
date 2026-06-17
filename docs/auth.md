# Authentication & Authorization (`@OneJs/auth`)

OneJs provides authentication via the `@OneJs/auth` package. It's a thin layer over pluggable strategies (Local JWT, Clerk) wired through the DI container.

## Package

```typescript
import {
  AuthPlugin,         // bootstrap plugin
  AuthMiddleware,     // injected service (not a decorator)
  LocalJwtStrategy,   // default strategy
  ClerkStrategy,      // Clerk integration
  UseAuth,            // method decorator
  Roles,              // method decorator
  UserRoles,          // role constants
  type AuthStrategy,  // port to implement custom strategies
  type AuthUser,      // shape of authenticated user
} from '@OneJs/auth'
```

## Bootstrap

Register `AuthPlugin` in your app entry point. Choose a strategy by passing its class as constructor argument.

```typescript
// apps/api/index.ts
import { OneJs, logger } from '@OneJs/core'
import { AuthPlugin, ClerkStrategy } from '@OneJs/auth'
import { ServerPlugin } from '@OneJs/server'

const container = await new OneJs()
  .use(new AuthPlugin(ClerkStrategy))    // ← inject strategy class
  .use(new ServerPlugin())
  .start()
```

If you omit the strategy, `LocalJwtStrategy` is used as default:

```typescript
.use(new AuthPlugin())   // defaults to LocalJwtStrategy
```

## Securing routes

`UseAuth()` and `Roles()` are **method decorators** applied per-route (or per-class).

### Authenticated route

```typescript
import { UseAuth } from '@OneJs/auth'
import { Controller, Get } from '@OneJs/server'
import type { Context } from 'elysia'

@Controller('/profile')
export class ProfileController {
  @Get('/')
  @UseAuth()
  async getProfile(ctx: Context) {
    const user = (ctx.store as any).user    // populated by AuthMiddleware
    return user
  }
}
```

### Role-gated route

```typescript
import { Roles, UseAuth } from '@OneJs/auth'
import { AppRoles } from '@shared/auth'

@Controller('/admin')
export class AdminController {
  @Patch('/settings')
  @UseAuth()
  @Roles(AppRoles.ADMIN)
  async updateSettings(ctx: Context) {
    // only `admin` role can reach here
  }

  @Delete('/users/:id')
  @UseAuth()
  @Roles(AppRoles.STAFF, AppRoles.ADMIN)
  async deleteUser(ctx: Context) {
    // `staff` OR `admin` allowed
  }
}
```

Decorator order: `@UseAuth()` first, then `@Roles()`. Reversed order works but reads worse.

## Built-in strategies

### `LocalJwtStrategy`

Verifies a Bearer JWT against `JWT_SECRET` env var. Returns `{ userId, email, role, payload }`.

```bash
# .env
JWT_SECRET=<32+ char secret>
```

> **Warning**: never deploy without `JWT_SECRET` set. Current code falls back to `'default_secret'` if missing — track this as a Phase 2/3 item to fix.

### `ClerkStrategy`

Verifies a Clerk-issued token using `@clerk/backend`. Role is read from `payload.publicMetadata.role`.

```bash
# .env
CLERK_FRONTEND_API_KEY=<frontend api key>
CLERK_SECRET_KEY=<secret key>
```

## Custom strategy

Implement `AuthStrategy` and register your class with `AuthPlugin`:

```typescript
// packages/my-context/infrastructure/auth/auth0.strategy.ts
import { Inject, Injectable, ConfigService } from '@OneJs/core'
import type { AuthStrategy, AuthUser } from '@OneJs/auth'

@Injectable()
export class Auth0Strategy implements AuthStrategy {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async validate(token: string): Promise<AuthUser> {
    // verify token, return AuthUser shape
    return { userId, email, role, payload }
  }
}
```

```typescript
// apps/api/index.ts
import { Auth0Strategy } from '@my-context/infrastructure/auth/auth0.strategy'

.use(new AuthPlugin(Auth0Strategy))
```

## Roles

Default roles ship in `@OneJs/auth`:

```typescript
export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin',
  STAFF: 'staff',
} as const
```

Extend them per-app in shared kernel:

```typescript
// packages/shared/auth/roles.ts
import { UserRoles } from '@OneJs/auth'

export const AppRoles = {
  ...UserRoles,
  MODERATOR: 'moderator',
} as const

export type AppRole = (typeof AppRoles)[keyof typeof AppRoles]
```

## How it works (internals)

`AuthMiddleware` is an `@Injectable()` service (not a decorator).

1. `@UseAuth()` decorator marks the route → adds `AuthMiddleware` to its middleware chain.
2. On request, `AuthMiddleware.handle()` reads `Authorization: Bearer <token>` header.
3. Calls `strategy.validate(token)` → returns `AuthUser` or throws `OneJsError(401)`.
4. `@Roles(...roles)` decorator stores allowed roles on the route metadata; middleware enforces.
5. Authenticated user attached to `ctx.store.user`.

## Errors

All auth failures throw `OneJsError` with standardized codes:

| Code | Status | When |
|------|--------|------|
| `AUTH_MISSING` | 401 | No `Authorization` header |
| `AUTH_INVALID` | 401 | Token verification failed |
| `PERMISSION_DENIED` | 403 | User role not in required list |

## Security checklist

- Set `JWT_SECRET` (32+ chars) in `.env` — never commit
- Set `CLERK_SECRET_KEY` in `.env` if using Clerk
- Configure CORS on the server: `server.use(cors({ origin: 'https://your.app' }))`
- Never log raw tokens (current `AuthMiddleware` leaks token in error details — Phase 2/3 fix)
- Use HTTPS in production
- Rotate secrets on a schedule
