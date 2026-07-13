# application-port-inversion Specification

## Purpose
Keep application services and use-cases depending on ports, not concrete infrastructure adapters.
## Requirements
### Requirement: Application dependencies use ports
Application services and use-cases SHALL depend on constructor-injected domain or application ports instead of concrete infrastructure adapters, Prisma clients, SDK clients, generated clients, environment globals, provider implementation classes, or database-specific APIs.

#### Scenario: Service needs persistence
- **WHEN** an application service needs to load, save, query, delete, or mutate stored data
- **THEN** it receives a repository, query, gateway, or unit-of-work port through constructor injection
- **AND** the Prisma implementation remains in infrastructure

#### Scenario: Service currently uses Prisma directly
- **WHEN** an application service imports `@OneJs/prisma`, `@prisma/client`, or `PrismaClientOneJs`
- **THEN** the persistence calls are extracted behind an application/domain port
- **AND** the service constructor receives that port rather than the Prisma client

#### Scenario: Use-case needs provider behavior
- **WHEN** a use-case needs Clerk, LLM, embedding, chunking, file loading, or another external provider
- **THEN** it calls a named port owned by domain or application
- **AND** the provider SDK/client remains hidden inside an infrastructure adapter

### Requirement: Query ports live in application when they return projections
Ports that return admin, dashboard, analytics, reporting, read-model, or API projection DTOs SHALL live in application unless they return domain-rich aggregate roots, entities, or value objects.

#### Scenario: Dashboard read model is queried
- **WHEN** application code needs a primitive projection for an API, admin, mobile, or dashboard response
- **THEN** the query interface is defined in application
- **AND** infrastructure maps persistence/provider shapes into that application DTO

#### Scenario: Analytics read model is queried from a controller
- **WHEN** a controller endpoint needs analytics rows, ACWR summaries, session lists, or dashboard projections
- **THEN** it depends on an application query service/use-case or an application query port token
- **AND** the concrete Prisma query/repository adapter remains hidden behind DI

#### Scenario: Aggregate repository is queried
- **WHEN** application code needs an aggregate root or value object to execute domain behavior
- **THEN** it uses a domain repository port with business-language methods

### Requirement: Runtime DI binds ports to production adapters
Runtime DI modules SHALL bind application/domain ports to production infrastructure adapters and SHALL NOT choose InMemory adapters through environment-based runtime branching.

#### Scenario: API module wires persistence
- **WHEN** a package module is loaded by the API runtime
- **THEN** repository and query ports bind to Prisma or other production adapters
- **AND** InMemory adapters are absent from runtime module bindings

#### Scenario: Controller depends on a query port
- **WHEN** a controller or application service depends on an application query token
- **THEN** the API module registers an alias from that token to the production Prisma query adapter
- **AND** the controller/application constructor does not mention the Prisma adapter class unless the class is the adapter implementation itself

#### Scenario: Test needs fake persistence
- **WHEN** an automated test needs owned persistence behavior
- **THEN** it imports an explicit InMemory infrastructure adapter or test fake
- **AND** that adapter is used only under `bun test`

### Requirement: Transaction boundaries are application-owned ports
Multi-step persistence workflows SHALL express transaction boundaries through application-owned ports or use-cases, not direct Prisma imports in application or controllers.

#### Scenario: Workflow updates multiple records
- **WHEN** completing a session, refining training, generating a plan, updating progress, or cancelling an admin-managed session requires multiple persisted changes
- **THEN** the application use-case owns the workflow boundary
- **AND** any database-specific transaction mechanism is hidden behind an infrastructure adapter

