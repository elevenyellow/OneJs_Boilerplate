# hexagonal-boundary-enforcement Specification

## Purpose
 Keep domain and application layers isolated from infrastructure via ports, thin controllers, and production-only DI bindings.
## Requirements
### Requirement: Domain layer depends only inward
Every bounded context under `packages/*/domain` SHALL avoid imports from `application/`, `infrastructure/`, `apps/*`, Prisma, Clerk, HTTP controllers, generated clients, and external provider adapters.

#### Scenario: Domain model imports are reviewed
- **WHEN** a domain entity, value object, domain event, domain service, repository interface, or domain port is defined
- **THEN** its imports are limited to domain-owned types, same-layer domain types, shared kernel types, and approved framework domain bases

#### Scenario: Domain contract needs serialized data
- **WHEN** a domain type must cross a persistence or transport boundary
- **THEN** serialization is exposed through a domain-owned `toDto()` or mapping method without importing application DTOs

### Requirement: Application layer depends on ports instead of infrastructure
Every application service or use-case SHALL depend on constructor-injected ports and domain types, not concrete infrastructure adapters, Prisma clients, Clerk clients, generated clients, environment globals, provider SDKs, or database-specific transaction APIs.

#### Scenario: Application service needs persistence
- **WHEN** an application service needs to load, save, query, delete, or mutate data
- **THEN** it uses a repository, query, gateway, or unit-of-work port injected through the constructor
- **AND** Prisma clients, Prisma model APIs, and Prisma transactions remain in infrastructure adapters

#### Scenario: Application service needs admin read models
- **WHEN** an application service returns admin list, dashboard, analytics, or reporting rows
- **THEN** it depends on an application query port that returns application DTOs
- **AND** the persistence adapter maps Prisma rows to those DTOs outside the application service

#### Scenario: Application service needs external identity or provider access
- **WHEN** an application service needs Clerk, LLM, RAG, loader, or provider behavior
- **THEN** it calls a named port owned by the appropriate application/domain boundary
- **AND** the external SDK/client is hidden inside an infrastructure adapter

### Requirement: Query and read-model ports stay out of domain unless domain-rich
Ports that return dashboard, analytics, admin list, reporting, or projection DTOs SHALL live in application query/port modules unless they return domain entities or Value Objects and express domain behavior.

#### Scenario: Analytics projection is added
- **WHEN** a query returns primitive projection rows or response DTOs for API/admin/mobile consumption
- **THEN** the query interface is defined in `application/` and implemented in `infrastructure/`

#### Scenario: Existing projection port is found in domain
- **WHEN** a domain port returns dashboard, analytics, admin list, reporting, or projection DTO rows
- **THEN** it is moved to an application query/port module
- **AND** all infrastructure adapters and controllers import the application port instead of the domain port

#### Scenario: Repository contract is domain-rich
- **WHEN** a repository contract returns aggregate roots, entities, or Value Objects and uses business-language methods
- **THEN** it remains a domain port

### Requirement: Controllers are thin HTTP adapters
REST controllers SHALL translate HTTP input/output and delegate orchestration to application services, use-cases, or application query services. Controllers SHALL NOT own Prisma transactions, direct repository access, direct query-adapter access, domain transitions, business calculations, provider calls, or persistence mapping beyond request/response boundaries.

#### Scenario: Controller receives a command request
- **WHEN** an API endpoint receives auth context, path params, query params, or body data
- **THEN** the controller validates/parses boundary data, calls one application method, and maps the result to an HTTP response

#### Scenario: Controller needs a transaction or multi-step workflow
- **WHEN** an endpoint requires persistence transaction boundaries or multi-step domain orchestration
- **THEN** that workflow is implemented by an application use-case or service and the controller delegates to it

#### Scenario: Controller needs a read model
- **WHEN** an endpoint reads dashboard, analytics, admin list, or projection data
- **THEN** the controller delegates to an application query service or use-case
- **AND** it does not inject a Prisma repository, Prisma query adapter, or domain repository directly

### Requirement: Bounded contexts communicate through services or ports
Bounded contexts SHALL NOT import another context's infrastructure or reach into another context's domain internals for orchestration. Cross-context behavior SHALL use application services, domain/application ports, or shared-kernel concepts explicitly designed for cross-context use.

#### Scenario: Context needs user identity information
- **WHEN** a bounded context needs identity or profile data owned by another context
- **THEN** it depends on a port or application service contract instead of importing the other context's adapters or internal domain model

#### Scenario: Shared concept is required by multiple contexts
- **WHEN** multiple contexts need the same identity/value concept
- **THEN** it is modeled as a shared-kernel VO or mapped between context-local VOs at the boundary

#### Scenario: Context needs another context aggregate
- **WHEN** one bounded context needs information from another context's aggregate root or domain entity
- **THEN** it receives only an identifier, stable DTO, shared-kernel value, or application-port result
- **AND** it does not store or expose the other context's entity as part of its own domain model

### Requirement: Production DI uses production adapters
Dependency injection modules SHALL bind runtime ports to production infrastructure adapters. InMemory repositories SHALL be used only by automated tests and never selected by environment-based production/local-development logic.

#### Scenario: Application module registers repositories
- **WHEN** runtime DI bindings are configured for API, jobs, or app modules
- **THEN** repository ports bind to Prisma or other production adapters
- **AND** InMemory adapters are not referenced by runtime modules

#### Scenario: Automated test needs owned persistence behavior
- **WHEN** a unit/application test needs a repository implementation
- **THEN** it may import an InMemory adapter from an explicit infrastructure or test-support path

### Requirement: Architecture guards cover all package layers
Architecture boundary tests SHALL cover every bounded context under `packages/*`, including domain, application, infrastructure, package index exports, and known external adapter imports.

#### Scenario: Guard scans package layers
- **WHEN** architecture guard tests run
- **THEN** they inspect all relevant files under `packages/*/domain`, `packages/*/application`, and `packages/*/infrastructure`
- **AND** they are not limited to a single package unless the test name and scope are explicitly package-local

#### Scenario: Guard scans package barrels
- **WHEN** a package exposes an `index.ts` barrel
- **THEN** the guard checks that re-exports do not expose infrastructure adapters as default application dependencies

#### Scenario: Guard scans adapter imports
- **WHEN** a domain or application file imports `@OneJs/prisma`, `@prisma/client`, `@OneJs/server`, `elysia`, `@clerk/backend`, or provider SDKs
- **THEN** the architecture guard fails with the offending file and import specifier unless the file is an explicit infrastructure/test adapter

### Requirement: Boundary guards detect imports and re-exports
Architecture boundary tests SHALL detect both import statements and re-export statements that violate layer, package, or adapter boundaries.

#### Scenario: File imports outer layer
- **WHEN** a domain or application file imports from a forbidden outer layer
- **THEN** the architecture guard fails with the offending file and specifier

#### Scenario: Barrel re-exports infrastructure
- **WHEN** a package index uses `export ... from` to expose infrastructure adapters outside test-support intent
- **THEN** the architecture guard fails with the offending file and specifier

### Requirement: Boundary allowlists stay narrow and temporary
Architecture guard exceptions SHALL be specific, named, and removable. Broad package-wide allowlists SHALL NOT hide new violations.

#### Scenario: Existing violation needs staged cleanup
- **WHEN** a boundary violation cannot be fixed in the same task as the guard
- **THEN** the allowlist names the exact file/specifier pair and the reason
- **AND** follow-up tasks remove that exception as the seam is fixed
