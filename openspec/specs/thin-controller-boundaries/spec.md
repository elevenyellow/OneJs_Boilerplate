# thin-controller-boundaries Specification

## Purpose
Keep REST controllers transport-only and delegate workflows to application services.
## Requirements
### Requirement: Controllers delegate business workflows
REST controllers SHALL act as transport adapters that extract auth, path params, query params, and request bodies, then delegate business workflows or read-model retrieval to one application service/use-case/query-service method.

#### Scenario: Endpoint receives a command
- **WHEN** an API endpoint receives a create, update, complete, generate, refine, or submit command
- **THEN** the controller maps HTTP input to an application input DTO
- **AND** delegates orchestration to a single application method or use-case

#### Scenario: Endpoint returns a result
- **WHEN** the application method returns a domain/application result
- **THEN** the controller maps it to the existing HTTP response shape
- **AND** does not perform domain transitions after the application call

#### Scenario: Endpoint returns a read model
- **WHEN** an API endpoint returns dashboard, analytics, ACWR, training-list, or session-list data
- **THEN** the controller delegates to a single application query service/use-case method
- **AND** the controller does not call a repository or Prisma query adapter directly

### Requirement: Controllers do not access persistence or providers directly
REST controllers SHALL NOT import Prisma clients, repositories, concrete query adapters, provider adapters, SDK clients, generated clients, or transaction clients directly.

#### Scenario: Endpoint needs stored data
- **WHEN** a controller endpoint needs data from persistence
- **THEN** it asks an application service/use-case/query service for that data
- **AND** persistence remains behind application/domain ports and infrastructure adapters

#### Scenario: Endpoint needs read-only adapter data
- **WHEN** a controller endpoint needs read-only projection data
- **THEN** it injects an application-owned query token or application query service
- **AND** it does not import or inject a `Prisma*Query` or `Prisma*Repository` class directly

#### Scenario: Endpoint needs generation or external identity behavior
- **WHEN** a controller endpoint needs LLM generation, embeddings, Clerk identity, or another external provider
- **THEN** it delegates to application code that owns the workflow
- **AND** the controller does not instantiate or call the provider client directly

### Requirement: Controllers avoid business calculations and manual structured-data parsing
Business calculations, domain policy decisions, and structured JSON parsing of persisted/domain data SHALL live in application services, value objects, or infrastructure mappers, not controller bodies.

#### Scenario: Controller displays athlete progress
- **WHEN** an endpoint returns progress, dashboard, or analytics data
- **THEN** calculations and structured persistence parsing happen in an application query service or infrastructure query adapter
- **AND** the controller only returns the mapped response

#### Scenario: Controller handles invalid input
- **WHEN** HTTP input is malformed or missing
- **THEN** the controller may reject transport-level invalid input
- **AND** domain/application rules remain enforced by value objects, entities, policies, or use-cases

### Requirement: Controller boundary tests reject direct persistence wiring
Controller architecture tests SHALL fail when a REST controller imports or injects concrete Prisma repositories/query adapters instead of application services or application-owned query ports.

#### Scenario: Controller imports a concrete Prisma adapter
- **WHEN** a controller source file imports a `Prisma*Repository`, `Prisma*Query`, Prisma client, or provider SDK
- **THEN** the architecture guard reports the controller file and offending import

#### Scenario: Controller constructor injects persistence directly
- **WHEN** a controller constructor injects a repository or persistence query adapter class directly
- **THEN** the architecture guard fails unless the dependency is an application service/use-case/query-service abstraction

