# domain-model-encapsulation Specification

## Purpose
Enforce value-object boundaries for identities across domain and application signatures.
## Requirements
### Requirement: Entities encapsulate state in private readonly fields

Every domain entity SHALL hold its state in `private readonly` fields. Entities SHALL NOT expose public
fields or setters, and SHALL NOT declare mutable fields. Getters that return a value object or child
entity are permitted (they cannot mutate the entity); what is forbidden is a public field, a setter, or
exposing mutable internal state.

#### Scenario: Entity fields are private and readonly

- **WHEN** a domain entity is defined
- **THEN** all of its state-bearing fields are declared `private readonly`, and no public field or
  setter is present

#### Scenario: No mutable entity state

- **WHEN** an entity is reviewed for mutability
- **THEN** it has no field that can be reassigned after construction (no `private _x` without
  `readonly`), so the instance is immutable

### Requirement: Entity state transitions return new instances

An entity SHALL express every state change as a `with*()` method that returns a new instance, leaving
the original unchanged.

#### Scenario: A transition does not mutate the original

- **WHEN** a `with*()` transition is applied to an entity
- **THEN** a new entity instance is returned reflecting the change, and the original instance is
  unchanged

### Requirement: Entity state is read through toDto, behavior, or VO-returning getters

An entity SHALL expose its state outward through its `toDto()` serialization boundary, named behavior
methods, or getters that return value objects / child entities — never through direct public-field
access. Raw primitives cross only at the `toDto()`/persistence boundary.

#### Scenario: External code reads via an approved accessor

- **WHEN** code outside the aggregate needs an entity's values (e.g. to persist or respond)
- **THEN** it obtains them through `toDto()`, a named behavior method, or a getter returning a value
  object, never by reading a public field directly

### Requirement: Value Objects instantiate only via a private constructor

Every value object SHALL declare a `private constructor` and be instantiated only through a static
factory (`create()` / `fromString()` / named factories), which validates input and throws `OneJsError`
on failure.

#### Scenario: VO cannot be constructed directly

- **WHEN** a value object is defined
- **THEN** its constructor is `private` and the only construction path is a static factory that
  validates the input

### Requirement: Composite Value Object fields are private readonly

A composite value object SHALL store its component values in `private readonly` fields and SHALL NOT
expose them as public fields. A composite value object is one holding more than the single value
carried by the value-object base class.

#### Scenario: Composite VO keeps components private

- **WHEN** a composite value object holds multiple component values
- **THEN** each component is a `private readonly` field, and the VO exposes only behavior, equality, and
  its value via inherited methods

### Requirement: Domain identity and values are expressed as value objects
Domain concepts SHALL be expressed as Value Objects or Entities, not raw primitives, magic strings, string unions, DTO imports, or mutable JavaScript objects. Identifiers (`athleteId`, `coachId`, `mesocycleId`, `templateId`, position indices), domain dates, domain text, feedback values, status/readiness/lifecycle states, protocol versions, provider names, capacity scores, numeric quantities, and domain event payload values SHALL be typed as their corresponding VO in domain and application signatures. Primitives SHALL appear only at DTO, HTTP, and persistence boundaries or inside the private implementation of a Value Object.

#### Scenario: Identifiers are typed value objects

- **WHEN** a domain service, use-case, or repository interface references an
  identifier
- **THEN** its parameter type is the identifier's value object (e.g.
  `AthleteId`, `CoachId`, `MesocycleId`), not `string`
- **AND** raw string identifiers appear only in DTOs and adapter conversions

#### Scenario: Validation lives in the value object

- **WHEN** an entity is constructed via `create()`
- **THEN** it accepts already-validated value objects and does not re-run inline
  `.trim()` / `Number.isInteger()` / `instanceof Date` checks
- **AND** each value object rejects invalid input at its own `create()`

#### Scenario: Domain event payloads are domain-rich
- **WHEN** a domain event records identifiers, statuses, booleans, text, positions, or quantities
- **THEN** the event stores those concepts as Value Objects or Entities
- **AND** primitive serialization occurs only at the event-bus adapter boundary

#### Scenario: Domain state avoids magic strings
- **WHEN** a domain state, status, provider, band, lifecycle state, or label is modeled
- **THEN** the entity stores a Value Object that owns the vocabulary and behavior
- **AND** raw string comparisons do not appear outside that Value Object

### Requirement: Domain concept interfaces are behavioral value objects

Flat domain interfaces that carry invariants SHALL be class value objects with
validation, and TypeScript `enum` types SHALL be `as const` objects per project
convention.

#### Scenario: Flat interface becomes a class value object

- **WHEN** a domain concept with invariants is modeled (e.g. `SessionCheckIn`,
  `OnboardInput`, `ExerciseDescriptiveMetadata`, `VolumeByQualityEntry`)
- **THEN** it is a class value object whose constructor enforces its invariants
- **AND** any associated factory function's validation is moved into the VO

#### Scenario: Enums use as-const objects

- **WHEN** a fixed set of domain constants is defined (e.g. `MetricType`,
  `GripType`, `Band`, `FingerPos`)
- **THEN** it is an `as const` object with a derived value type
- **AND** no TypeScript `enum` declaration remains for it

### Requirement: Domain models do not import outer-layer DTOs
Domain entities, value objects, domain events, domain services, repositories, and ports SHALL NOT import DTOs from `application/`, `infrastructure/`, or controller modules.

#### Scenario: Entity state mirrors transport shape
- **WHEN** an entity currently needs fields that resemble an application response or persistence record
- **THEN** those fields are modeled as domain-owned Value Objects, Entities, or immutable domain-owned serialization types
- **AND** conversion to application/persistence DTOs occurs outside the entity state

#### Scenario: Repository interface returns data
- **WHEN** a domain repository interface returns data
- **THEN** it returns aggregate roots, entities, Value Objects, or domain-owned serialized values
- **AND** it does not reference application DTOs or read-model DTOs

### Requirement: Domain collections and dates are immutable at the boundary
Domain entities and Value Objects SHALL NOT expose mutable arrays, objects, maps, sets, or `Date` instances from internal state. Collections and dates SHALL be copied or wrapped so callers cannot mutate domain state.

#### Scenario: Entity exposes child entities
- **WHEN** an entity exposes child entities or Value Objects
- **THEN** the returned collection is immutable or a defensive copy
- **AND** mutating the returned value cannot change the entity

#### Scenario: Domain model stores a date
- **WHEN** a domain entity or Value Object stores a date-like concept
- **THEN** it stores a domain date Value Object or defensively copies the `Date` internally and externally

#### Scenario: Domain model stores a map or structured object
- **WHEN** a domain entity or Value Object stores a `Map`, `Set`, array, or structured object
- **THEN** it stores an immutable representation or defensive copy
- **AND** callers receive copies or readonly views that cannot mutate internal state

### Requirement: Domain equality uses behavior
Domain equality and rule checks SHALL use Value Object or Entity behavior instead of comparing raw `.getValue()` primitives outside the owner concept.

#### Scenario: Application checks ownership
- **WHEN** application code verifies that two domain identifiers refer to the same concept
- **THEN** it calls a domain behavior method such as `.equals()` or a named policy method
- **AND** it does not compare raw primitive values directly

#### Scenario: Domain quantity threshold is checked
- **WHEN** a rule depends on a bounded quantity, duration, count, score, or rating
- **THEN** the Value Object exposes named behavior for the comparison
- **AND** the threshold value is not duplicated as a magic number in application or controller code

### Requirement: Aggregate reconstitution enforces persisted invariants
Aggregate and value-object reconstitution paths SHALL enforce the same invariants required by normal creation paths or route legacy invalid data through an explicit compatibility mapper outside the domain model.

#### Scenario: Persisted aggregate has invalid child state
- **WHEN** an aggregate is reconstituted from persistence with duplicate child ids, invalid counters, invalid lifecycle state, or malformed structured data
- **THEN** the domain model rejects the data through a domain error
- **AND** it does not silently create an impossible aggregate

#### Scenario: Legacy data requires tolerance
- **WHEN** existing persisted data cannot yet satisfy a new invariant
- **THEN** infrastructure performs explicit compatibility mapping before domain reconstitution
- **AND** the domain invariant remains strict

### Requirement: Domain factories are side-effect free
Domain entities and value objects SHALL NOT call clock, UUID, random, network, filesystem, database, SDK, or global configuration side effects directly.

#### Scenario: Entity needs an id or timestamp
- **WHEN** a new domain entity or value object requires an identifier or timestamp
- **THEN** application code supplies that value as a value object or validated primitive at the boundary
- **AND** the domain factory validates and stores it without calling side-effect APIs

#### Scenario: Application needs generated values
- **WHEN** a use-case needs current time, UUIDs, randomness, or provider-generated content
- **THEN** it obtains those values through an application-owned port or injected value source
- **AND** passes validated values into domain behavior

### Requirement: Domain collections and structured data are immutable and validated
Domain models SHALL defensively copy or wrap arrays, objects, `Date` instances, maps, sets, vectors, generated content, metrics, feedback, snapshots, and structured payloads so callers cannot mutate internal state and invalid runtime data is rejected.

#### Scenario: Domain model exposes generated content or embeddings
- **WHEN** external code reads generated session content, embedding vectors, metric maps, or snapshot data
- **THEN** it receives immutable domain-owned data or defensive copies
- **AND** mutating the returned value cannot change domain state

#### Scenario: Value object receives numeric or structured input
- **WHEN** a value object receives vector values, counters, scores, ratings, durations, positions, or structured maps
- **THEN** it validates finite numbers, integer/positive constraints, allowed ranges, required keys, and cross-field rules as applicable

#### Scenario: Value object exposes a mutable JavaScript reference
- **WHEN** a value object would otherwise expose a `Date`, `Map`, `Set`, array, or object through `getValue()` or another accessor
- **THEN** the value object returns a defensive copy, readonly representation, or primitive serialization
- **AND** tests prove mutating the returned value does not mutate the value object

### Requirement: Aggregate transitions enforce business state machines
Aggregate behavior methods SHALL reject invalid lifecycle transitions, duplicate submissions, impossible completion states, and child-entity mutations outside the aggregate root.

#### Scenario: Lifecycle transition is invalid
- **WHEN** code attempts to complete, return, resubmit, regenerate, archive, or mutate an aggregate from an invalid state
- **THEN** the aggregate rejects the transition through a domain error
- **AND** no partially updated aggregate is returned

#### Scenario: Child entity changes aggregate state
- **WHEN** a child entity or generated session position needs to change aggregate-owned state
- **THEN** the change is expressed through aggregate-root behavior
- **AND** external code cannot mutate child state independently of aggregate invariants

### Requirement: Domain cross-context values stay explicit
Domain models SHALL NOT store another bounded context's aggregate root or entity as internal state. Cross-context domain concepts SHALL be represented as shared-kernel value objects, context-local value objects, stable DTOs at application boundaries, or identifiers.

#### Scenario: Session needs exercise metric values
- **WHEN** session or training domain logic needs metric values owned by exercise vocabulary
- **THEN** the concept is represented by a shared-kernel value object or mapped into a context-local value object
- **AND** session/training entities do not depend on the full exercise aggregate root

#### Scenario: Integration event references another context
- **WHEN** an integration event crosses bounded contexts
- **THEN** its payload contains stable primitives, value-object DTOs, or identifiers
- **AND** it does not transport another context's domain entity instance

