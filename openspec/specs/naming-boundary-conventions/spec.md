# naming-boundary-conventions Specification

## Purpose
Standardize casing boundaries for internal TypeScript, persisted data, and shared wire values.
## Requirements
### Requirement: Internal TypeScript uses camelCase identifiers
The codebase SHALL use `camelCase` for internal TypeScript property names, local variables, method names, function names, DTO fields, component props, hook state, and application/domain union discriminants that do not cross an external, persistence, or HTTP boundary.

#### Scenario: Internal application result uses project casing
- **WHEN** an application service returns a result union consumed only inside TypeScript code
- **THEN** the union discriminator and properties use camelCase names rather than lower snake_case names

#### Scenario: Raw SQL result maps at the query boundary
- **WHEN** an infrastructure query reads raw SQL aliases such as `max_weight` or `updated_at`
- **THEN** the adapter maps those values to camelCase DTO fields before returning application-facing data

### Requirement: External and persistence names keep native casing at boundaries
The codebase SHALL preserve native casing for database storage names, raw SQL table and column names, Prisma generated meta fields, environment variables, error codes, DI token constants, and third-party provider payloads at the boundary where those systems are used.

#### Scenario: Provider payload uses required external casing
- **WHEN** infrastructure sends a request to a provider that expects fields such as `max_tokens`, `tool_choice`, or `input_schema`
- **THEN** the provider payload uses those exact names inside the infrastructure adapter

#### Scenario: Environment and token constants keep uppercase convention
- **WHEN** code references configuration keys, error codes, or DI token constants
- **THEN** values such as `DATABASE_URL`, `VALIDATION_FAILED`, and `AUTH_STRATEGY_TOKEN` keep `SCREAMING_SNAKE_CASE`

### Requirement: Wire vocabularies are explicit and shared
The codebase SHALL allow lower snake_case string values in TypeScript only when they represent documented API, AI-tool, persisted, or shared wire vocabulary. Such vocabulary SHALL be centralized in a shared contract, a bounded-context value object, or a required client mirror rather than duplicated as unrelated string literals.

#### Scenario: Client and backend share a status value
- **WHEN** a backend endpoint returns a status value consumed by a frontend app
- **THEN** the value is defined by a shared contract or documented mirror and not invented independently in the component

#### Scenario: Internal-only value is not wire vocabulary
- **WHEN** a lower snake_case string is used only to branch inside application/domain code and is not persisted or sent over HTTP
- **THEN** it is renamed to camelCase or replaced with a typed internal constant following project conventions

### Requirement: Boundary exceptions are documented near their source
The codebase SHALL document intentional lower snake_case TypeScript keys when those keys are a stable contract rather than an implementation detail.

#### Scenario: Dynamic metric keys remain snake_case by contract
- **WHEN** `metricValues` exposes keys such as `edge_size`, `wall_angle`, `grip_type`, `finger_pos`, or `intensity_pct`
- **THEN** the contract identifies them as versioned wire vocabulary shared by generator schemas, parsers, persistence snapshots, and clients

### Requirement: Package barrels preserve architectural boundaries
Package `index.ts` barrels SHALL expose stable public domain/application contracts and SHALL NOT make infrastructure adapters, Prisma repositories, provider adapters, controller classes, or InMemory test adapters look like normal runtime dependencies.

#### Scenario: Consumer imports package API
- **WHEN** another package or app imports from a package barrel
- **THEN** it receives stable domain/application contracts intended for cross-package consumption
- **AND** it does not receive infrastructure adapter classes by default

#### Scenario: Runtime module needs an adapter
- **WHEN** a DI/module wiring file needs a concrete Prisma, Clerk, LLM, or provider adapter
- **THEN** it imports the adapter from an explicit infrastructure path
- **AND** that import remains localized to infrastructure or runtime wiring

### Requirement: Test-only adapter exports are explicit
InMemory repositories and test fakes SHALL be exported through explicit test-support or infrastructure paths that make their test-only purpose clear.

#### Scenario: Automated test needs an InMemory adapter
- **WHEN** a test imports an InMemory repository or fake
- **THEN** the import path clearly identifies it as infrastructure or test-support
- **AND** production modules do not import that symbol through a generic package barrel
