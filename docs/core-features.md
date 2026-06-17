# Core Features (`@OneJs/core`)

`@OneJs/core` is the kernel: DI container, bootstrap process, plugin system, domain primitives, errors, and logger. Everything else (`@OneJs/auth`, `@OneJs/server`, `@OneJs/event-bus`, `@OneJs/jobs`, `@OneJs/prisma`, `@OneJs/testing`) depends on it.

## Imports

```typescript
import {
  // DI
  Injectable, Inject, Container, ContainerProvider, container, metadataRegistry,
  // Bootstrap
  OneJs, Module, BootstrapBase, PluginRegistry,
  type Plugin, type BootstrapPlugin, type ModuleOptions,
  // Config
  ConfigService,
  // Domain primitives
  Entity, EntityBase, ValueObject, ValueObjectBase,
  // Errors
  OneJsError, ErrorCodes, type ErrorCode,
  // Logger
  Logger, logger,
  // Markers (advanced)
  type ModuleRole, markAs, hasRole, getRoles, clearMarkers,
  // Types
  type ClassConstructor,
} from '@OneJs/core'
```

Auth, server, event-bus, jobs, and prisma each live in their own package — see their respective docs.

## Dependency Injection

OneJs ships a small, decorator-driven DI container.

### `@Injectable()`

Marks a class so the container can construct it.

```typescript
import { Injectable } from '@OneJs/core'

@Injectable()
export class MyService {
  doSomething() {
    return 'Done!'
  }
}
```

### `@Inject(ConcreteClass)`

Injects a dependency into a constructor parameter. The token is the concrete class — there's no separate token system.

```typescript
import { Inject, Injectable } from '@OneJs/core'
import { MyService } from './my-service'

@Injectable()
export class MyUseCase {
  constructor(@Inject(MyService) private readonly myService: MyService) {}

  execute() {
    return this.myService.doSomething()
  }
}
```

For ports/interfaces, inject the **concrete adapter class** (e.g. `InMemoryUserRepository`) — there's no `@Token` indirection. This is intentional: it keeps the container simple and the wiring explicit.

```typescript
constructor(
  @Inject(InMemoryUserRepository) private readonly repo: IUserRepository,
) {}
```

If you need to swap adapters per environment, do it at the composition root by registering an alias:

```typescript
container.registerAlias(InMemoryUserRepository, PrismaUserRepository)
```

## Bootstrapping

The `OneJs` class wires the container, runs plugins in dependency order, and returns the ready container.

```typescript
// apps/api/index.ts
import { OneJs, logger } from '@OneJs/core'
import { AutoLoaderPlugin, BootstrapLoader } from '@OneJs/core/bootstrap'
import { AuthPlugin, ClerkStrategy } from '@OneJs/auth'
import { ServerPlugin, Server } from '@OneJs/server'
import { EventBusPlugin, RedisBridge } from '@OneJs/event-bus'

const container = await new OneJs()
  .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
  .use(new BootstrapLoader())
  .use(new AuthPlugin(ClerkStrategy))
  .use(new ServerPlugin())
  .use(new EventBusPlugin(new RedisBridge()))
  .start()

container
  .get(Server)
  .setPrefix('/api')
  .start(4000, () => logger.info('api:startup', 'Server up on :4000'))
```

### `OneJs.start()` lifecycle

1. Sets the container as the global default for `ContainerProvider`.
2. Walks `metadataRegistry` and registers every `@Injectable()` class.
3. Initializes `ConfigService` (loads `.env`).
4. Resolves plugin order from `dependsOn` + `priority`.
5. Calls each plugin's `register(container)` (synchronous setup).
6. Calls each plugin's `load(container)` (async setup — can import new files that trigger more `@Injectable` decorators; auto-loader is one of these).
7. Returns the ready container.

### Plugin contract

```typescript
interface Plugin {
  name: string
  priority?: number       // lower runs first; default 100
  dependsOn?: string[]    // names of plugins that must register first
  critical?: boolean      // if true, failure stops bootstrap (default: failFast option)
}

interface BootstrapPlugin extends Plugin {
  register?(container: Container): Promise<void> | void
  load?(container: Container): Promise<void> | void
}
```

Built-in plugins:

| Plugin | Package | Role |
|--------|---------|------|
| `AutoLoaderPlugin` | `@OneJs/core/bootstrap` | Recursively imports source files so decorators run |
| `BootstrapLoader` | `@OneJs/core/bootstrap` | Instantiates `BootstrapBase` subclasses (e.g. seeders) |
| `AuthPlugin` | `@OneJs/auth` | Binds an `AuthStrategy` to `AUTH_STRATEGY_TOKEN` |
| `ServerPlugin` | `@OneJs/server` | Boots the Elysia HTTP server |
| `EventBusPlugin` | `@OneJs/event-bus` | Wires `EventBus` with the chosen publisher |
| `JobsPlugin` | `@OneJs/jobs` | Connects BullMQ workers + queues |
| `PrismaPlugin` | `@OneJs/prisma` | Provides `PrismaClientOneJs` |

### Auto-loading

`AutoLoaderPlugin({ rootDir })` recursively imports every `.ts` file under `rootDir` (except `__tests__/` and patterns in its ignore list). The decorator side effects (`@Injectable`, `@Controller`, `@EventHandler`, `@WorkerJob`) self-register into the metadata registry.

In monorepos, point `rootDir` to the workspace root or to specific package roots — the loader follows TS path aliases.

## Domain primitives

### `ValueObjectBase<T>`

```typescript
import { ValueObject, ValueObjectBase, OneJsError, ErrorCodes } from '@OneJs/core'

@ValueObject()
export class Email extends ValueObjectBase<string> {
  private constructor(value: string) { super(value) }

  static create(value: string): Email {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      throw new OneJsError('Validation failed', 400, 'Invalid email', {}, ErrorCodes.VALIDATION_FAILED)
    return new Email(value.toLowerCase())
  }
}
```

- `private constructor` + `static create()` factory
- Validates in `create()`, throws `OneJsError` on bad input
- `getValue()` / `equals()` come from base class

### `EntityBase<TId>`

```typescript
import { Entity, EntityBase } from '@OneJs/core'

@Entity()
export class User extends EntityBase<UserId> {
  constructor(
    id: UserId,
    readonly email: Email,
    readonly role: UserRole,
    readonly createdAt: Date,
  ) {
    super(id)
  }

  static register(email: Email): User {
    return new User(UserId.generateUniqueId(), email, UserRole.user(), new Date())
  }

  static reconstitute(id: string, email: string, role: string, createdAt: Date): User {
    return new User(UserId.fromString(id), Email.create(email), UserRole.create(role), createdAt)
  }

  withRole(role: UserRole): User {
    return new User(this.getId(), this.email, role, this.createdAt)
  }

  toDto(): UserDto {
    return new UserDto(this.getId().getValue(), this.email.getValue(), this.role.getValue(), this.createdAt)
  }
}
```

- Immutable (`readonly` properties + `with*()` for transitions)
- `register()` for creation from VOs, `reconstitute()` for hydration from primitives (DB)
- `toDto()` for the persistence/transport boundary

## Errors

`OneJsError` is the only error class. Five-argument constructor: `(typeLabel, statusCode, message, details, errorCode)`.

```typescript
import { OneJsError, ErrorCodes } from '@OneJs/core'

throw new OneJsError(
  UserErrorTypes.CONFLICT,        // type label (constant, not magic string)
  409,                            // HTTP status
  UserErrorMessages.EMAIL_IN_USE, // user-facing message (constant)
  { email },                      // structured details
  ErrorCodes.USER_ALREADY_EXISTS, // machine-readable code
)
```

Standard `ErrorCodes`: `AUTH_MISSING`, `AUTH_INVALID`, `TOKEN_EXPIRED`, `USER_NOT_FOUND`, `USER_ALREADY_EXISTS`, `VALIDATION_FAILED`, `PAYLOAD_MALFORMED`, `PERMISSION_DENIED`, `RESOURCE_NOT_FOUND`, `SERVER_ERROR`, `UNKNOWN`.

See [Error Handling conventions](conventions/patterns/error-handling.md) for the no-magic-strings rule and constant-per-context pattern.

## Logger

```typescript
import { Logger, logger } from '@OneJs/core'

// Static module-level
logger.info('app:startup', 'Server starting')

// Injected per-class
@Injectable()
class UserService {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  async register(email: Email) {
    this.logger.debug('user:service', `Registering ${email.getValue()}`)
  }
}
```

Levels: `trace`, `debug`, `info`, `warn`, `error`. First arg is the **scope** (constant per bounded context — `'user:service'`, `'task:controller'`, etc.) — see [DDD principles → No magic strings](conventions/architecture/ddd-principles.md).

## Config

```typescript
import { Inject, Injectable, ConfigService } from '@OneJs/core'

@Injectable()
class JwtSigner {
  private readonly secret: string

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.secret = config.get('JWT_SECRET')!
  }
}
```

`ConfigService` loads `.env` at bootstrap. `get(key)` returns `string | undefined`.

## See also

- [Architecture](architecture.md) — layers and dependency direction
- [Routing & Controllers](routing.md) — `@OneJs/server` decorators
- [Auth](auth.md) — `@OneJs/auth` package
- [Events & Jobs](events-jobs.md) — `@OneJs/event-bus` and `@OneJs/jobs`
- [Testing package](testing-package.md) — `@OneJs/testing` fakes
- [Health & Observability](health-and-observability.md) — production-readiness primitives
