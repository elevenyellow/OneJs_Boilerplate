# MATO Project Structure — Reference Skill

> Authoritative guide on where to create files, how to organize new features, and when to use each domain construct (entity, VO, DTO, interface, etc.).

---

## 1. Monorepo — Root structure

```
apps/          # Executable applications (independent processes)
packages/      # Domain and framework shared packages
prisma/        # Prisma schema split into *.model.prisma files
scripts/       # Bun automation scripts
```

**Bun Workspaces** (root `package.json`):
```json
{ "workspaces": ["packages/*", "packages/*/*", "apps/*"] }
```

Always use `workspace:*` for internal cross-package references.

---

## 2. When to create in `apps/` vs `packages/`

### `apps/` → standalone executable process

Create a new app when you need an **independent running process**: HTTP server, queue worker, cron, CLI, frontend.

| Existing app | Purpose |
|---|---|
| `apps/api` | Elysia REST API (port 4000) |
| `apps/scheduler` | BullMQ workers + cron jobs |
| `apps/admin` | Vite + React admin dashboard (port 3000) |
| `apps/next` | Next.js 16 public web app |
| `apps/mobile` | Expo / React Native |
| `apps/cli` | Command-line tools |

**New app — minimal structure:**
```
apps/my-app/
├── index.ts          # Entry point
├── package.json
└── src/
    └── ...
```

Backend app `package.json`:
```json
{
  "name": "mato-my-app",
  "type": "module",
  "scripts": {
    "start:dev": "bun --watch index.ts --env-file=../../.env",
    "start:prod": "bun index --env-file=../../.env-prod"
  },
  "dependencies": {
    "@EyJs/Core": "workspace:*"
  }
}
```

Backend app `index.ts` (no HTTP server):
```typescript
import { BootstrapService } from '@EyJs/Core'
await BootstrapService.init(import.meta.url)
```

App with HTTP server `index.ts`:
```typescript
import { BootstrapService, Server, ConfigService } from '@EyJs/Core'
const container = await BootstrapService.init(import.meta.url)
const server = container.get(Server)
server.setPrefix('/v1').start(Number(container.get(ConfigService).get('PORT') || 4000))
```

### `packages/` → reusable domain logic

Create a new package when the business domain is **cohesive and independent** and can be consumed by more than one app or by other packages.

Domain package `package.json`:
```json
{
  "name": "@my-domain",
  "type": "module",
  "main": "./index.ts",
  "exports": { ".": "./index.ts" },
  "dependencies": {
    "@EyJs/Core": "workspace:*"
  }
}
```

Add the alias in root `tsconfig.json`:
```json
{ "paths": { "@my-domain": ["packages/my-domain/index.ts"] } }
```

---

## 3. Internal structure of a domain package

Every package follows **Clean Architecture / DDD** with three layers:

```
packages/my-domain/
├── index.ts                          # Public re-exports of the package
├── package.json
├── domain/                           # Core — no external dependencies
│   ├── entities/                     # Identity-bearing objects
│   ├── value-objects/                # Immutable identity-less objects
│   ├── dtos/                         # Data transfer contracts
│   ├── services/                     # Pure domain services
│   └── events/                       # Domain events (if local to this package)
│
├── application/                      # Use cases — orchestrates the domain
│   ├── use-cases/
│   ├── services/                     # Application services
│   └── handlers/                     # Domain event handlers
│
└── infrastructure/                   # External adapters
    ├── persistance/
    │   └── prisma/                   # Concrete Prisma repositories
    │       └── models/               # Prisma mappers/types
    └── scrapers/ | clients/ | ...    # HTTP clients, scrapers, external APIs
```

**Dependency rule:** `domain` ← `application` ← `infrastructure`. The domain layer never imports from application or infrastructure.

---

## 4. Structure of `apps/api`

The API splits its routes into two sections under `src/`:

```
apps/api/src/
├── admin/         # /v1/admin/*  — protected with @UseAdminRole()
│   ├── events/
│   ├── venues/
│   ├── cities/
│   ├── instagram-profiles/
│   └── ...
└── public/        # /v1/public/* — open endpoints
    ├── events/
    ├── venue/
    ├── cities/
    └── ...
```

Each section under admin/public mirrors the DDD structure:
```
admin/events/
├── application/
│   ├── use-cases/        # Use cases specific to this API view
│   └── dtos/             # HTTP request/response DTOs
├── domain/
│   └── factories/        # Factories to build entities from HTTP input
└── infrastructure/
    ├── controllers/       # Elysia controllers
    └── repositories/     # Additional repositories specific to this view
```

**When to put use cases in `apps/api` vs `packages/`:**
- `packages/` → reusable logic consumed by scheduler, CLI, or other apps
- `apps/api/src/admin|public/*/application/use-cases/` → logic exclusive to the HTTP view (e.g. `CreateEventAdminUseCase` validating form fields, `UpdateEventAdminUseCase`)

---

## 5. File naming conventions

| Type | Name pattern | Example |
|---|---|---|
| Entity | `<name>.ts` | `venue.ts`, `event.ts` |
| Value Object | `<name>.ts` | `venue-name.ts`, `start-date.ts` |
| DTO | `<name>.dto.ts` | `venue.dto.ts` |
| Use Case | `<action>-<name>.use-case.ts` | `add-new-venue.use-case.ts` |
| Repository (Prisma) | `<name>-prisma.repository.ts` | `venue-prisma.repository.ts` |
| Controller | `<name>.controller.ts` | `events.controller.ts` |
| Event Handler | `<name>.handler.ts` | `instagram-post-created.handler.ts` |
| Domain Event | `<name>.event.ts` | `new-post.event.ts` |
| Domain Service | `<name>.service.ts` | `user-time-to-utc-window.service.ts` |
| Factory | `<name>.factory.ts` | `event.factory.ts` |

---

## 6. When to use each domain construct

### 6.1 Value Object (VO)

**Use it when:** the concept has its own validation rules, has no identity, and equality is defined by value (not by ID).

**Characteristics:**
- `private` constructor
- All fields `private readonly`
- No setters — immutable
- Static factory: `static create(value)` or `static createFrom(raw)`
- Always throws if the value is invalid
- Exposes `toString()`, `getValue()`, `equals()`

```typescript
// ✅ Correct VO
export class VenueName {
  private constructor(private readonly value: string) {}

  static create(value: string): VenueName {
    if (!value || value.length > 100) throw new Error('Invalid venue name')
    return new VenueName(value.trim())
  }

  toString(): string { return this.value }
  equals(other: VenueName): boolean { return this.value === other.value }
}
```

**Typical cases:** `Id`, `Username`, `Email`, `Title`, `Slug`, `StartDate`, `Price`, `Latitude`, `Longitude`, `Page`, `Limit`.

---

### 6.2 Entity

**Use it when:** the object has a **unique identity** (ID) and may mutate over its lifecycle.

**Characteristics:**
- `public` or `private` constructor (with static factory)
- Composed of VOs
- Getters to access fields
- Domain-level mutators with logic (e.g. `addVenue(id)`, `deactivate()`)
- Serialization methods: `toDatabase()`, `static fromDatabase()`, `toDto()`

```typescript
export class Venue {
  constructor(
    private readonly id: Id,
    private readonly name: VenueName,
    private readonly username: Username,
    // ... more VOs
  ) {}

  getId(): Id { return this.id }
  getName(): VenueName { return this.name }

  toDatabase() {
    return { id: this.id.toString(), name: this.name.toString(), ... }
  }

  static fromDatabase(doc: VenueDto): Venue {
    return new Venue(Id.createFrom(doc.id), VenueName.create(doc.name), ...)
  }
}
```

**When NOT to use an entity:** for read-only projections with no logic or identity — use a DTO directly.

---

### 6.3 DTO (Data Transfer Object)

**Use it when:** you need to transfer data **between layers or systems** without domain logic.

**Characteristics:**
- Simple class with `public readonly` fields
- Primitive types only (`string`, `number`, `boolean`, `Date`, arrays)
- No VOs, no logic, no validation
- Constructor with all fields

```typescript
export class VenueDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly username: string,
    public readonly followers: number,
    public readonly updatedAt: Date,
  ) {}
}
```

**When to use it:**
- Repository output before mapping to an entity
- HTTP controller input/output
- Cross-package transfer (e.g. `ProfileDto` in event bus payloads)
- Domain event payloads (`NewPostEvent` carries `PostDto`, never an entity)

---

### 6.4 Interfaces

**Use an interface only when a contract will have multiple concrete implementations** — the canonical case is a repository that has a production Prisma implementation and an in-memory implementation for tests. Outside of that, do not reach for an interface.

**When to use:**
- Repository with two real implementations (prod + test/in-memory)
- External service with a real client and a mock (e.g. scraper, AI provider, HTTP client)

**When NOT to use:**
- Data transfer between layers → use DTOs
- Method/function parameters → use VOs or entities
- Use cases → never abstracted, always injected as the concrete class
- When only one implementation exists and a second is not planned → inject the concrete class directly

```typescript
// ✅ Correct — interface justified by two real implementations
// domain/interfaces/venue.repository.interface.ts
export interface IVenueRepository {
  findById(id: Id): Promise<Venue | null>
  save(venue: Venue): Promise<void>
}

// infrastructure/persistance/prisma/venue-prisma.repository.ts  (prod)
@Injectable()
export class VenuePrismaRepository extends PrismaRepository<'venue'>
  implements IVenueRepository { ... }

// infrastructure/persistance/in-memory/venue-in-memory.repository.ts  (tests)
export class VenueInMemoryRepository implements IVenueRepository { ... }

// ✅ Correct — single implementation, no interface needed
@Injectable()
export class AddNewVenueUseCase {
  constructor(
    @Inject(VenuePrismaRepository)
    private readonly venueRepository: VenuePrismaRepository,
  ) {}
}

// ❌ Wrong — interface for data transfer
interface VenueData { id: string; name: string }   // use VenueDto instead

// ❌ Wrong — interface as method parameter type
function process(venue: IVenue): void   // use Venue entity instead
```

---

### 6.5 Primitives as parameters — never

**Never use primitive types** (`string`, `number`, `boolean`) as parameters between functions, methods, or constructors in domain or application code. Always wrap them in a VO or pass a full entity/DTO.

```typescript
// ✅ Correct — VO parameters
async findByUsername(username: Username): Promise<Venue | null>
async scrape(profile: Profile, city: City): Promise<ScrapedData>
async createEvent(title: Title, date: StartDate, venue: Venue): Promise<Event>

// ❌ Wrong — raw primitives leak domain meaning
async findByUsername(username: string): Promise<Venue | null>
async scrape(profileId: string, cityId: string): Promise<ScrapedData>
async createEvent(title: string, date: Date, venueId: string): Promise<Event>
```

This applies to:
- Use case `execute()` parameters
- Repository method parameters
- Domain service method parameters
- Entity/VO constructors and factory methods
- Event handler `handle()` payloads (use DTOs or entities, not raw fields)

The only places where primitives are acceptable:
- Inside a VO's own `private constructor`
- Inside `toDatabase()` / serialization methods
- HTTP controller layer when parsing raw input from `ctx.query` / `ctx.body` — immediately convert to VOs before passing to use cases

---

### 6.6 Domain Service

**Use it when:** logic belongs to the domain but does not fit naturally inside a single entity or VO.

```typescript
// application/services/user-time-to-utc-window.service.ts
@Injectable()
export class UserTimeToUtcWindowService {
  convert(localTime: LocalTime, timezone: Timezone): UtcWindow { ... }
}
```

**Do not confuse with use case:** a domain service does not orchestrate repositories or produce external side effects. A use case does.

---

### 6.7 Event Handler

**Use it when:** you need to react to a bus event (in-process or Redis) in a decoupled way.

```typescript
@Injectable()
export class InstagramPostCreatedHandler {
  constructor(
    @Inject(ProcessPostsUseCase) private readonly processPostsUseCase: ProcessPostsUseCase,
  ) {}

  @EventHandler(NewPostEvent)
  async handle(event: NewPostEvent): Promise<void> {
    await this.processPostsUseCase.execute(event.post)
  }
}
```

Handlers live in `application/handlers/` of the package or app that consumes the event (not where the event is emitted).

---

## 7. Domain events — where to define them

| Event type | Location |
|---|---|
| Cross-package event (multiple consumers) | `packages/shared-events/` |
| Internal event within a single package | `packages/my-domain/domain/events/` |

Events extend `DomainEvent` from `@EyJs/EventBus` and carry **DTOs** (never entities) as payload.

---

## 8. Prisma Schema

Models are defined in separate files:
```
prisma/
├── venue.model.prisma
├── event.model.prisma
├── instagram.model.prisma
└── ...
```

**Never edit `prisma/schema.prisma` directly** — it is the auto-generated merged file.

After any change to a `.model.prisma` file:
```bash
bun run prisma:build   # merge + validate + generate client
```

To add a new model:
1. Create `prisma/my-entity.model.prisma`
2. Define the Prisma model
3. Run `bun run prisma:build`
4. Run `bun run prisma:migrate:create` or `bun run prisma:sync` (dev only)

---

## 9. Path aliases — cross-package imports

Never use relative paths to import from another package. Always use the alias:

```typescript
// ✅ Correct
import { Injectable, Inject } from '@EyJs/Core'
import { Venue } from '@venue'
import { Event } from '@events'
import { City } from '@cities'

// ❌ Wrong
import { Injectable } from '../../packages/ey-js/core/...'
```

Aliases are defined in the root `tsconfig.json` under `paths`.

---

## 10. Quick reference — decision tree

```
Do I need a new independent running process?
  → New app in apps/

Is it reusable domain logic shared across apps?
  → New package in packages/

Am I inside a package and have a concept with identity and lifecycle?
  → Entity in domain/entities/

Is it a value with validation rules but no identity?
  → Value Object in domain/value-objects/

Do I need to transfer data between layers without logic?
  → DTO in domain/dtos/

Should I use an interface?
  → No. Inject the concrete class directly.

Should I use a primitive (string, number) as a parameter?
  → No. Wrap it in a VO. The only exception is inside toDatabase() or HTTP input parsing.

Do I need to orchestrate business logic with repositories?
  → Use Case in application/use-cases/

Do I need to react to a bus event?
  → Event Handler in application/handlers/

Do I need to expose an HTTP endpoint?
  → Controller in infrastructure/controllers/ (inside apps/api/src/admin|public/)
```
