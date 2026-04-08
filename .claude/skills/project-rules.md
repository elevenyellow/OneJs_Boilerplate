# MATO Project Rules — Permanent Skill

> This skill defines the authoritative rules for working in the MATO monorepo. These rules supersede generic industry defaults. Always apply them automatically.

---

## 1. Internal Framework Rules (`ey-js`) — Source of Truth

`packages/ey-js` is the project's internal framework. It is the **mandatory abstraction layer** for DI, routing, event-handling, logging, auth, and persistence. Never reach for an external alternative when `ey-js` already provides the tool.

### 1.1 Dependency Injection

Use the `ey-js` DI system for **all** service wiring. Never instantiate services manually or use a third-party IoC container.

```typescript
// ✅ Correct
import { Injectable, Inject } from '@EyJs/Core'
import { Logger } from '@EyJs/Core'

@Injectable()
class MyService {
  constructor(@Inject(Logger) private logger: Logger) {}
}

// ❌ Wrong — manual instantiation, bypasses DI
const myService = new MyService(new Logger())
```

**Scopes:**
- Default to `singleton` (framework default). Use `transient` only when a new instance per call is explicitly required.
- Mark classes that need async initialization with `extends BootstrapBase` and implement `bootstrap(): Promise<void>`.
- For non-blocking initialization (cron jobs, background workers), extend `BackgroundBootstrap` instead.

**Registration:** `BootstrapService.init(import.meta.url)` auto-discovers all `@Injectable` classes. Never manually call `container.register()` in application code.

**Optional Dependencies:** Use `@Optional(fallback?)` for dependencies that may not be registered.

### 1.2 HTTP Controllers & Routing

All API endpoints must be defined using `ey-js` controller decorators.

```typescript
// ✅ Correct
import { Controller, Get, Post } from '@EyJs/Core'

@Controller('/venues')
class VenueController {
  @Get('/:id')
  async getVenue(ctx: Context) { ... }

  @Post('/')
  async createVenue(ctx: Context) { ... }
}
```

**Rules:**
- One controller per domain route group.
- Use `@Raw()` on a handler only when you must return a raw `Response` (e.g., file streams). Otherwise let the `responseMiddleware` wrap the return value automatically.
- Never use `app.get()` / `app.post()` directly on an Elysia instance in application code.
- Route versioning (second arg to `@Get`, `@Post`, etc.) is optional — align with the existing prefix strategy in `apps/api`.

### 1.3 Middleware

Use class-based middleware implementing `MiddlewareInterface`.

```typescript
// ✅ Correct
import { Injectable } from '@EyJs/Core'
import type { MiddlewareInterface } from '@EyJs/Core'
import type { Context } from 'elysia'

@Injectable()
class MyMiddleware implements MiddlewareInterface {
  async handle(ctx: Context): Promise<void> {
    // mutate ctx or throw EyJsError to abort
  }
}

// Attach per-route:
@Get('/protected')
@UseMiddleware(MyMiddleware)
async handler(ctx: Context) { ... }
```

**Auth shortcuts provided by `@EyJs/Auth`:**
- `@UseAuth()` — requires any valid Clerk JWT.
- `@UseAdminRole()` — requires `admin` or `staff` role.

Never re-implement JWT verification outside these decorators.

### 1.4 Event Bus

Domain events must extend `DomainEvent` and be dispatched through the `EventBus`. Never use Node.js `EventEmitter`, custom pub/sub, or direct function calls for cross-domain communication.

```typescript
// ✅ Define an event
import { DomainEvent } from '@EyJs/EventBus'

class VenueCreatedEvent extends DomainEvent {
  constructor(public readonly venueId: string) { super() }
}

// ✅ Handle an event
import { EventHandler, IEventHandler } from '@EyJs/EventBus'
import { Injectable } from '@EyJs/Core'

@Injectable()
class OnVenueCreated implements IEventHandler<VenueCreatedEvent> {
  @EventHandler(VenueCreatedEvent)
  async handle(event: VenueCreatedEvent): Promise<void> { ... }
}

// ✅ Publish an event (inject EventBus and call publish)
await this.eventBus.publish(new VenueCreatedEvent(venue.id))
```

**Rules:**
- Cross-domain event type definitions belong in `packages/shared-events/` or `packages/shared/domain/events/`.
- Use `priority` in `EventHandlerOptions` when ordering matters between handlers of the same event.
- Add the `LoggingMiddleware` from `@EyJs/EventBus` during bootstrap — do not add custom console logs around `publish()` calls.

### 1.5 Logging

Inject `Logger` from `@EyJs/Core`. Never use `console.log`, `console.error`, or any third-party logger directly in application code.

```typescript
// ✅ Correct
@Injectable()
class MyService {
  constructor(@Inject(Logger) private logger: Logger) {}

  doWork() {
    this.logger.info('MyService', 'Work started', { key: 'value' })
    this.logger.businessError('Payment failed', 'processPayment')
  }
}

// ❌ Wrong
console.log('Work started')
```

Use specialized log methods for context clarity:
- `logger.businessError()`, `logger.databaseError()`, `logger.authenticationError()` — for domain-specific errors.
- `logger.systemInfo()`, `logger.userAction()` — for info-level structured output.
- `logger.debug(key, message, ctx)` — for dev-only diagnostic output keyed to a `DEBUG_KEY`.

### 1.6 Persistence / Repositories

All repositories must extend `PrismaRepository<TModel>` from `@EyJs/Prisma`.

```typescript
// ✅ Correct — Prisma stays inside the repository
import { PrismaRepository, PrismaClientEy } from '@EyJs/Prisma'
import { Injectable, Inject } from '@EyJs/Core'

@Injectable()
class VenuePrismaRepository extends PrismaRepository<'venue'> {
  constructor(@Inject(PrismaClientEy) prisma: PrismaClientEy) {
    super(prisma, 'venue')
  }

  async findActive(): Promise<Venue[]> {
    const rows = await this.prisma.venue.findMany({ where: { isActive: true } })
    return rows.map(Venue.fromDatabase)
  }
}

// ✅ Correct — use case calls the repository, never Prisma directly
@Injectable()
class GetActiveVenuesUseCase {
  constructor(@Inject(VenuePrismaRepository) private repo: VenuePrismaRepository) {}
  async execute() { return this.repo.findActive() }
}

// ❌ Wrong — PrismaClientEy injected into a use case / service / controller
@Injectable()
class GetActiveVenuesUseCase {
  constructor(@Inject(PrismaClientEy) private prisma: PrismaClientEy) {}
  async execute() {
    return this.prisma.venue.findMany({ where: { isActive: true } }) // ← NOT allowed
  }
}
```

**Rules:**
- **`PrismaClientEy` may only be injected into classes that extend `PrismaRepository<TModel>`.** It must never appear in use cases, application services, controllers, event handlers, or domain code.
- All database queries must live inside a named repository method. If a query doesn't fit an existing repository, add a method to the appropriate repository.
- `findWithPagination()` is the standard method for paginated list endpoints.
- Never import `PrismaClient` directly in application or domain code — always use the injected `PrismaClientEy` inside a repository.

### 1.7 Redis Services

Raw `ioredis` `Redis` instances must only be created and used inside dedicated `*RedisService` classes. These are the only classes allowed to `import Redis from 'ioredis'` and construct a client.

```typescript
// ✅ Correct — Redis client lives inside a dedicated service
import Redis from 'ioredis'
import { Injectable, Inject } from '@EyJs/Core'
import { ConfigService } from '@EyJs/Core'

@Injectable()
class ScrapingStatsRedisService {
  private readonly client: Redis

  constructor(@Inject(ConfigService) private config: ConfigService) {
    this.client = new Redis(this.config.get('REDIS_URL')!)
  }

  async incrementDailyStat(metric: 'scraped' | 'failed'): Promise<void> {
    const key = `stats:instagram:daily:${today}:${metric}`
    await this.client.incr(key)
    await this.client.expire(key, 30 * 24 * 60 * 60)
  }
}

// ✅ Correct — use case / handler injects the service, not Redis directly
@Injectable()
class ScrapingStatsRedisSuccessHandler {
  constructor(
    @Inject(ScrapingStatsRedisService)
    private statsService: ScrapingStatsRedisService,
  ) {}

  @EventHandler(InstagramAccountScrapedEvent)
  async handle(_event: InstagramAccountScrapedEvent): Promise<void> {
    await this.statsService.incrementDailyStat('scraped')
  }
}

// ❌ Wrong — Redis injected directly into a use case / handler / controller
@Injectable()
class SomeHandler {
  constructor(@Inject(Redis) private redis: Redis) {} // ← NOT allowed
}
```

**Rules:**
- **A raw `Redis` client may only be instantiated inside a `*RedisService` class.** Use cases, controllers, event handlers, and domain services must never import `ioredis` or hold a `Redis` instance directly.
- Each Redis service is responsible for one logical concern (e.g. stats, queue, cache). Keep them focused — do not create a single god "RedisService".
- Redis services must get the connection URL from `ConfigService`, never from `process.env` directly.
- Always set a TTL on keys that represent transient state (counters, locks, cache). Never write unbounded keys.

### 1.9 Error Handling

Throw `EyJsError` from `@EyJs/Core` for all HTTP-layer errors. Use `ErrorCodes` from `@EyJs/SharedErrors` for the `code` field.

```typescript
// ✅ Correct
import { EyJsError } from '@EyJs/Core'
import { ErrorCodes } from '@EyJs/SharedErrors'

throw new EyJsError('Venue not found', 404, undefined, ErrorCodes.RESOURCE_NOT_FOUND)

// ❌ Wrong
throw new Error('Not found')
res.status(404).json({ error: 'Not found' })
```

The global error handler in `Server` catches `EyJsError` and returns a typed `ApiResponse`. Never manually construct error response objects in controllers.

### 1.10 Value Objects

Domain primitives must be wrapped in value objects extending `ValueObject<T>` from `@EyJs/Core`. Use the `static create()` factory pattern.

```typescript
// ✅ Correct
import { ValueObject } from '@EyJs/Core'
import { v4 as uuidv4 } from 'uuid'

class VenueId extends ValueObject<string> {
  private constructor(value: string) { super(value) }

  static create(value: string): VenueId {
    if (!value) throw new Error('VenueId cannot be empty')
    return new VenueId(value)
  }

  static generateUniqueId(): VenueId {
    return new VenueId(uuidv4())
  }
}
```

### 1.11 Configuration

Inject `ConfigService` from `@EyJs/Core` for all environment variable access. Never use `process.env` directly in application code.

```typescript
// ✅ Correct
@Injectable()
class MyService {
  constructor(@Inject(ConfigService) private config: ConfigService) {}

  connect() {
    const url = this.config.get('REDIS_URL')
  }
}

// ❌ Wrong
const url = process.env.REDIS_URL
```

---

## 2. Monorepo Workflow

### 2.1 Cross-Package Imports

- **Always use path aliases** (`@EyJs/Core`, `@instagram`, `@venue`, `@cities`, etc.) for cross-package imports. Never use relative paths like `../../packages/...`.
- **Workspace protocol** (`workspace:*`) must be used in `package.json` `dependencies` when a package depends on another workspace package.
- **Path alias resolution** is defined in the root `tsconfig.json`. When adding a new package, register its alias there and in any relevant app `tsconfig.json`.

```typescript
// ✅ Correct
import { Profile } from '@instagram'
import { Venue } from '@venue'
import { Logger } from '@EyJs/Core'

// ❌ Wrong
import { Profile } from '../../packages/instagram/domain/entities/profile'
```

### 2.2 Where Logic Lives

| Concern | Location |
|---|---|
| Framework abstractions (DI, routing, events, auth) | `packages/ey-js/` |
| Domain entities, value objects, domain services | `packages/{domain}/domain/` |
| Use cases, application orchestration | `packages/{domain}/application/use-cases/` |
| Event handlers (scheduler/app-level) | `apps/scheduler/src/{domain}/application/handlers/` |
| Repositories, scrapers, external integrations | `packages/{domain}/infrastructure/` |
| HTTP controllers | `apps/api/src/{scope}/{domain}/` |
| Shared cross-domain events | `packages/shared-events/` or `packages/shared/domain/events/` |
| Prisma model definitions | `{package}/infrastructure/persistance/prisma/models/*.model.prisma` |

**Hard rule:** Business logic never lives in controllers or event handlers — it belongs in use cases. Controllers and handlers are orchestrators only.

### 2.3 Prisma Schema Management

Prisma schemas are **split** into individual `*.model.prisma` files co-located with their domain package. They are merged by `scripts/merge-schema.ts` into the root `prisma/schema.prisma`.

```
# After any schema change:
bun run prisma:build    # merge + validate + generate client
```

**Never edit** `prisma/schema.prisma` directly — it is generated. Edit the source `*.model.prisma` file.

### 2.4 Adding a New Domain Package

1. Create `packages/{domain}/` with `domain/`, `application/`, `infrastructure/` subdirectories.
2. Add a `package.json` with `"name": "@{domain}"` and any `workspace:*` dependencies.
3. Register a path alias in root `tsconfig.json` paths.
4. Export a public API via an `index.ts` at the package root.
5. Place Prisma model in `infrastructure/persistance/prisma/models/{entity}.model.prisma` and run `prisma:build`.

---

## 3. Detected Tech Stack — Exact Versions

| Technology | Version |
|---|---|
| Runtime | Bun 1.2.x |
| Language | TypeScript 5.9 (strict, ESNext) |
| Web framework | Elysia.js ^1.3 |
| Database | PostgreSQL 17 |
| ORM | Prisma ^6.19.1 |
| Queue | BullMQ ^5.67.2 |
| Cache/Events | Redis 7 + ioredis ^5.9.2 |
| Linter/Formatter | Biome 2.3.8 |
| Public web | Next.js 16 / React 19 |
| Mobile | Expo 54 / React Native 0.81 |
| Admin dashboard | Vite + React (TanStack Router + Query) |
| Auth service | Clerk |
| LLM | OpenAI ^5.23.2, @google/genai (Gemini) |
| Scheduling | node-cron ^4.2.1 |
| HTTP client | got ^14.6.6 |
| Validation | Zod ^3.24.0, @sinclair/typebox ^0.34.47 |
| Date/Time | Luxon ^3.7.2 |
| Test framework | Bun Test (built-in) |

---

## 4. Architecture & Patterns

### 4.1 DDD Layer Rules

Every domain package strictly follows three layers. **Dependencies only flow inward** — outer layers know about inner layers, never the reverse.

```
infrastructure/ → application/ → domain/
       ↑                ↑
  (knows about)   (knows about)
```

#### `domain/` — Pure business logic
- **Allowed:** entities, value objects, DTOs, domain services, repository interfaces, domain events.
- **Forbidden:** framework imports (`@EyJs/*`), Prisma, ioredis, HTTP, BullMQ, or any infrastructure library.
- Domain code must be executable with zero I/O — no async DB calls, no HTTP calls.

#### `application/` — Orchestration
- **Allowed:** use cases, application services, event handlers. Imports from `domain/`. Injects concrete infrastructure classes directly unless an interface with multiple implementations is defined.
- **Forbidden:** Prisma queries, raw Redis operations, HTTP requests, `import Redis from 'ioredis'`, `import { PrismaClient }`.

#### `infrastructure/` — Technical implementation
- **Allowed:** Prisma repositories, Redis services, scrapers, external API clients, BullMQ producers/consumers.
- **Forbidden:** domain business rules, conditional branching based on business state (that belongs in domain/application).

**Violation examples:**

```typescript
// ❌ domain/ importing a framework decorator
import { Injectable } from '@EyJs/Core'  // ← NOT allowed in domain/

// ❌ application/ running a Prisma query directly
import { PrismaClientEy } from '@EyJs/Prisma'
class GetStatsUseCase {
  constructor(@Inject(PrismaClientEy) private prisma: PrismaClientEy) {}
  // ← inject a repository instead
}

// ❌ infrastructure/ containing a business rule
class VenuePrismaRepository {
  async save(venue: Venue) {
    if (venue.getFollowers() > 10_000) { // ← business rule, belongs in domain
      await this.markAsVerified(venue)
    }
  }
}
```

### 4.2 Clean Architecture (DDD)

Every domain package strictly follows three layers. Dependencies only flow inward:

```
infrastructure/ → application/ → domain/
```

- **`domain/`** — Pure business logic. No framework imports, no Prisma, no HTTP. Contains: entities, value objects, DTOs, domain services. Interfaces only when multiple implementations exist.
- **`application/`** — Orchestrates domain objects. Contains: use cases, application services, event handlers. Injects the concrete repository/service class directly unless an interface with multiple implementations is defined.
- **`infrastructure/`** — Technical implementation. Contains: Prisma repositories, scrapers, external API clients.

### 4.3 Entities

Entities are **rich objects** (not plain data bags). They encapsulate business rules, expose getter methods that return VOs (never raw primitives), and provide factory methods for construction.

```typescript
class Venue {
  private constructor(
    private readonly id: VenueId,
    private readonly name: VenueName,
  ) {}

  static create(name: VenueName, city: City): Venue { ... }
  static fromDatabase(row: VenueDatabaseDto): Venue { ... }

  getId(): VenueId { return this.id }      // returns VO, not string
  getName(): VenueName { return this.name } // returns VO, not string

  toDatabase(): VenueDatabaseDto { ... }   // primitives only at the persistence boundary
  toDto(): VenueDto { ... }
}
```

### 4.4 Repository Pattern

Repositories extend `PrismaRepository<TModel>` and are injected as the concrete class. Define a `domain/interfaces/` interface only when a second implementation exists (e.g. in-memory for tests).

```typescript
// Default — single implementation, inject the concrete class directly
@Injectable()
class VenuePrismaRepository extends PrismaRepository<'venue'> {
  constructor(@Inject(PrismaClientEy) prisma: PrismaClientEy) {
    super(prisma, 'venue')
  }

  async findByUsername(username: Username): Promise<Venue | null> {
    const row = await this.prisma.venue.findFirst({
      where: { username: username.toString() },
    })
    return row ? Venue.fromDatabase(row) : null
  }
}

// When two implementations exist — define an interface in domain/
interface IVenueRepository {
  findByUsername(username: Username): Promise<Venue | null>
  save(venue: Venue): Promise<void>
}

@Injectable()
class VenuePrismaRepository extends PrismaRepository<'venue'>
  implements IVenueRepository { ... }              // prod

class VenueInMemoryRepository implements IVenueRepository { ... }  // tests
```

### 4.5 Use Case Pattern

Each use case is a single class with one public `execute()` method. Parameters must be VOs or entities — never raw primitives. Events carry DTOs or VOs, never raw strings/numbers.

```typescript
@Injectable()
class CreateVenueUseCase {
  constructor(
    @Inject(VenuePrismaRepository) private repo: VenuePrismaRepository,
    @Inject(Logger) private logger: Logger,
    @Inject(EventBus) private eventBus: EventBus,
  ) {}

  async execute(name: VenueName, city: City): Promise<Venue> {
    const venue = Venue.create(name, city)
    await this.repo.save(venue)
    await this.eventBus.publish(new VenueCreatedEvent(venue.toDto()))  // DTO, not raw string
    return venue
  }
}
```

---

## 5. Coding Standards

### 5.1 Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Files — entities | `{name}.ts` | `venue.ts` |
| Files — value objects | `{name}.ts` | `venue-name.ts`, `start-date.ts` |
| Files — DTOs | `{name}.dto.ts` | `venue-database.dto.ts` |
| Files — services | `{name}.service.ts` | `venue-persister.service.ts` |
| Files — repositories | `{entity}-prisma.repository.ts` | `venue-prisma.repository.ts` |
| Files — use cases | `{action}-{entity}.use-case.ts` | `create-venue.use-case.ts` |
| Files — handlers | `{event-name}.handler.ts` | `venue-created.handler.ts` |
| Files — controllers | `{domain}.controller.ts` | `venue.controller.ts` |
| Files — Prisma models | `{entity}.model.prisma` | `venue.model.prisma` |
| Files — tests | `{name}.test.ts` | `create-venue.use-case.test.ts` |
| Classes | PascalCase | `VenuePrismaRepository` |
| Interfaces | PascalCase + `Interface` suffix | `IVenueRepository` or `VenueRepositoryInterface` |
| Methods (getters) | `get{Property}()` | `getId()`, `getName()` |
| Methods (factories) | `create()`, `from{Source}()`, `generate{X}()` | `Venue.fromDatabase()` |
| Methods (converters) | `to{Format}()` | `toDto()`, `toUpsertDatabaseDto()` |
| Use case entry | `execute()` | always `execute()` |
| Event handlers | `handle()` | always `handle()` |

### 5.2 Types vs Interfaces

- Use `interface` only when a contract has **multiple concrete implementations** (e.g. repository prod vs in-memory for tests, real scraper vs mock). Never for data transfer or method parameters.
- Use `type` for unions, intersections, mapped types, and utility shapes.
- Data transfer between layers → **DTOs** (plain classes). Method/function parameters → **VOs or entities**.
- **No `any`** — Biome enforces `noExplicitAny`. Use `unknown` and narrow with guards.

### 5.3 Export Patterns

- **Named exports only** — no default exports in domain or infrastructure code.
- **Barrel files (`index.ts`)** exist at each layer (`domain/entities/index.ts`, `infrastructure/persistence/index.ts`, etc.). Re-export from them, not from individual files.
- Package public API is exposed through the package-root `index.ts`. Consumers import from the alias (`@venue`), not from sub-paths.

### 5.4 Formatting (Biome enforced)

| Setting | Value |
|---|---|
| Indent | 2 spaces |
| Line width | 80 chars |
| Quotes | Single (JS/TS), double (JSX) |
| Semicolons | As-needed (omitted when optional) |
| Trailing commas | All |
| Arrow parens | Always |
| Line endings | LF |

### 5.5 TypeScript Strictness

All strict flags are enabled in the root `tsconfig.json`. Key constraints:
- `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` — always handle `undefined` from index access.
- `exactOptionalPropertyTypes` — do not assign `undefined` to optional properties; omit them instead.
- `noUnusedLocals`, `noUnusedParameters` — remove dead code.
- `verbatimModuleSyntax` — use `import type {}` for type-only imports.
- `emitDecoratorMetadata` + `experimentalDecorators` — required for the DI system.

---

## 6. Constraints & "Don'ts"

### Framework

- **Do not bypass ey-js abstractions.** Never use raw Elysia `.get()/.post()`, raw `PrismaClient`, or `EventEmitter` in place of ey-js equivalents.
- **Do not add a competing DI container** (InversifyJS, tsyringe, NestJS, etc.).
- **Do not add a competing HTTP framework** (Express, Fastify, Hono) to any app that already uses Elysia via ey-js.
- **Do not add a competing event library** (eventemitter3, mitt, RxJS Subjects) for domain events.
- **Do not use `console.*` in application code** — use the injected `Logger`.
- **Do not use `process.env` in application code** — use `ConfigService`.

### Architecture

- **Do not put business logic in controllers or event handlers.** They call use cases; they do not contain logic.
- **Do not inject `PrismaClientEy` outside of a `PrismaRepository` subclass.** Use cases, services, controllers, and handlers must access the database exclusively through repository methods. If a required query doesn't exist in the repository yet, add a method there — never bypass the repository layer.
- **Do not instantiate or inject a raw `Redis` client outside of a `*RedisService` class.** All Redis operations must go through a dedicated service. Use cases, controllers, and handlers inject the service, never `Redis` directly.
- **Do not add a direct FK from `Venue` to `InstagramProfile`** — this was intentionally removed. Venue is independent.
- **Do not import infrastructure code from domain code.** The dependency arrow never points outward.
- **Do not import from a specific sub-path of another package** (e.g., `@venue/domain/entities/venue`). Import from the package root alias only (`@venue`).

### Schema

- **Do not edit `prisma/schema.prisma` directly.** Edit the `.model.prisma` file and run `bun run prisma:build`.
- **Do not use `prisma db push` in production** — always use migrations (`prisma:migrate:create` + `prisma:migrate:deploy`).

### Primitive Obsession — No Magic Values

- **Never pass raw primitives as domain identifiers or domain concepts.** Wrap them in a Value Object extending `ValueObject<T>`.
- **Never use magic strings for status, type, or outcome fields.** Define a `const` object or VO — not inline string literals.

```typescript
// ❌ Wrong — magic strings and raw primitives
await repo.findByStatus('active')
await repo.countPending('2024-01-01')
log('scraped')

// ✅ Correct — VOs / typed constants
const ScrapeOutcome = { Scraped: 'scraped', Failed: 'failed' } as const
type ScrapeOutcome = typeof ScrapeOutcome[keyof typeof ScrapeOutcome]

await repo.findByStatus(ProfileStatus.Active)
await repo.countPending(since: Date)
await logRepo.log(ScrapeOutcome.Scraped)
```

- **Domain entity constructors accept Value Objects, not raw strings/numbers.** If a class accepts `string` where a VO exists, replace it.
- **Exception:** Infrastructure/persistence layer methods may accept primitives at the Prisma boundary (inside the repository). The VO unwrapping happens there via `.getValue()` / `.toString()`.

### Code Quality

- **Do not exceed ~150 lines per class/file.** If a class grows beyond this, extract a collaborator.
- **Do not create barrel files at the app level** (`apps/api/index.ts` etc.) that re-export everything — only domain packages need barrel files.
- **Do not use `@ts-ignore` or `@ts-expect-error`** without a code comment explaining why.
- **Do not commit `.env` files or API keys.**

---

## 7. Testing

### 7.1 Framework

Use **Bun Test** exclusively. Never add Jest, Vitest, or Mocha.

```typescript
import { describe, expect, mock, test } from 'bun:test'
```

### 7.2 File Location & Naming

- Unit tests: co-located in `__tests__/` next to the file under test, named `{unit}.test.ts`.
- Integration tests: same structure but named `{feature}.integration.test.ts` or matching the `run-integration-tests.ts` filter.

### 7.3 Running Tests

```bash
bun test                    # All tests
bun run test:unit           # Unit only
bun run test:integration    # Integration only (needs TEST_DATABASE_URL)
bun run test:unit:watch     # Watch mode
```

Integration tests use a separate database: `postgresql://admin:admin123@localhost:5432/mato_test` (override via `TEST_DATABASE_URL`).

### 7.4 Mocking

Use `mock()` from `bun:test`. Mock collaborators at the constructor boundary — inject mocks via constructor args in tests (no need for a test-specific IoC container).

```typescript
const mockRepo = {
  findById: mock(async () => null),
  save: mock(async () => {}),
}
const useCase = new CreateVenueUseCase(mockRepo, mockLogger, mockEventBus)
```

### 7.5 Test Logger

Set `TEST_LOGGER=1` to enable logging output during test runs.

---

## 8. Import Alias Quick Reference

| Alias | Resolves to |
|---|---|
| `@EyJs/Core` | `packages/ey-js/core` |
| `@EyJs/Auth` | `packages/ey-js/auth` |
| `@EyJs/EventBus` | `packages/ey-js/event-bus` |
| `@EyJs/Prisma` | `packages/ey-js/prisma` |
| `@EyJs/SharedErrors` | `packages/ey-js/shared-errors` |
| `@instagram` | `packages/instagram` |
| `@venue` | `packages/venue` |
| `@events` | `packages/events` |
| `@cities` | `packages/cities` |
| `@ai` | `packages/ai` |
| `@geolocation` | `packages/geolocation` |
| `@corner-maps` | `packages/corner-maps` |
| `@proxy-manager` | `packages/proxy-manager` |
| `@user` | `packages/user` |
| `@shared` | `packages/shared` |
| `@api:*` | `apps/api/src/*` |
| `@scheduler:*` | `apps/scheduler/src/*` |
