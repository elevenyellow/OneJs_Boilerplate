## ADDED Requirements

### Requirement: Entity constructors receive only Value Objects

Entity constructors SHALL receive Value Objects (or other entities/aggregates) as parameters — never primitive types (`string`, `number`, `boolean`).

#### Scenario: Entity constructor with VOs
- **GIVEN** an entity class extending `EntityBase<TId>`
- **WHEN** the constructor is defined
- **THEN** every parameter SHALL be a VO, entity, or an explicitly allowed type (e.g., `Date`, `null`)
- **AND** no parameter SHALL be `string`, `number`, or `boolean`

#### Scenario: Entity constructor with primitive rejected
- **GIVEN** a code review on an entity file
- **WHEN** the constructor has a `string` or `number` parameter
- **THEN** the reviewer SHALL flag it as a violation

### Requirement: `register()` factory accepts only VOs

The `static register()` factory method on entities SHALL accept only Value Objects as parameters. This is the business-operation entry point for creating new entities.

#### Scenario: register with VOs
- **GIVEN** an entity's `static register()` method
- **WHEN** it is called
- **THEN** all domain parameters SHALL be VOs (e.g., `Email`, `PasswordHash`)
- **AND** no domain parameter SHALL be `string`, `number`, or `boolean`

#### Scenario: register with primitive rejected
- **GIVEN** a code review on an entity file
- **WHEN** `register()` has a `string` parameter for a domain concept
- **THEN** the reviewer SHALL flag it as a violation

### Requirement: `reconstitute()` is the sole primitive exception

The `static reconstitute()` factory method is the ONLY place that MAY receive primitives. It SHALL immediately convert them to VOs using `fromString()` or `create()`.

#### Scenario: reconstitute converts primitives
- **GIVEN** an entity's `static reconstitute()` method receiving `string` parameters
- **WHEN** the method body executes
- **THEN** each primitive SHALL be converted to its corresponding VO via factory methods
- **AND** the constructor SHALL be called with VOs

#### Scenario: Non-reconstitute factory using primitives rejected
- **GIVEN** a code review on an entity file
- **WHEN** a factory method other than `reconstitute()` accepts primitives
- **THEN** the reviewer SHALL flag it as a violation

### Requirement: Single authoritative source in `ddd-principles.md`

The rule "Entities are built from VOs" SHALL have its authoritative documentation in `docs/conventions/architecture/ddd-principles.md`. All other docs and agent prompts SHALL reference this document rather than re-stating the full rule.

#### Scenario: Convention doc has canonical rule
- **GIVEN** the file `docs/conventions/architecture/ddd-principles.md`
- **WHEN** it is read
- **THEN** it SHALL contain the definitive "No Primitives Rule" table
- **AND** it SHALL explicitly cover entity constructors, `register()`, and `reconstitute()`

#### Scenario: Other docs reference canonical source
- **GIVEN** any convention doc or agent prompt that mentions entity construction from VOs
- **WHEN** it is reviewed
- **THEN** it SHALL reference `ddd-principles.md` as the authoritative source
- **AND** it SHALL NOT duplicate the full rule (short summaries or cross-references only)

### Requirement: Architecture and code reviewers verify this rule

The `architecture-reviewer` and `code-reviewer` agents SHALL check entity constructor and factory method signatures for primitive parameters.

#### Scenario: Architecture reviewer checks entity constructors
- **GIVEN** an architecture review on a bounded context
- **WHEN** an entity constructor in the scope receives a primitive parameter
- **THEN** the reviewer SHALL flag it as a violation
