## ADDED Requirements

### Requirement: Unit tests use zero mocks, stubs, or spies

Unit test files (`tests/unit/**/*.test.ts`) SHALL NOT contain mocks, stubs, or spies of any kind — including `mock()`, `spyOn()`, hand-rolled stub objects, or any test double that replaces a real implementation.

#### Scenario: Unit test with InMemoryEventBus
- **GIVEN** a unit test for an application service
- **WHEN** the service depends on `EventBus`
- **THEN** the test SHALL inject `InMemoryEventBus` (from `@OneJs/event-bus`)
- **AND** SHALL NOT create a stub like `{ publish: async () => {} }`

#### Scenario: Unit test with SilentLogger
- **GIVEN** a unit test for an application service
- **WHEN** the service depends on `Logger`
- **THEN** the test SHALL inject `SilentLogger` (from `@OneJs/core`)
- **AND** SHALL NOT create a stub like `{ debug: () => {}, info: () => {} }`

#### Scenario: Unit test with InMemoryRepository
- **GIVEN** a unit test for an application service
- **WHEN** the service depends on a repository
- **THEN** the test SHALL inject the InMemory adapter (e.g., `InMemoryUserRepository`)
- **AND** SHALL NOT use `mock(IUserRepository)`

### Requirement: Tests using mocks are integration tests

Any test file that contains mocks, stubs, or spies SHALL be classified as an integration test. It SHALL be placed in `tests/integration/` and named with the `*.integration.test.ts` suffix.

#### Scenario: Test with mock reclassified
- **GIVEN** a test file in `tests/unit/` that uses `mock()` from `bun:test`
- **WHEN** the test is reviewed
- **THEN** the reviewer SHALL flag it for reclassification to `tests/integration/`
- **AND** the file SHALL be renamed to `*.integration.test.ts`

#### Scenario: Test with external API mock is integration
- **GIVEN** a test that mocks an external HTTP API or third-party service
- **WHEN** the test is created
- **THEN** it SHALL be placed in `tests/integration/`
- **AND** named with `*.integration.test.ts` suffix

### Requirement: Convention docs updated with new policy

The mocks policy section in `docs/conventions/patterns/testing.md` SHALL be rewritten to reflect: "Unit tests: zero mocks. Mocks → integration tests."

#### Scenario: Testing doc has clear policy
- **GIVEN** the file `docs/conventions/patterns/testing.md`
- **WHEN** a developer reads the "Mocks Policy" section
- **THEN** it SHALL clearly state that unit tests use no mocks/stubs/spies
- **AND** it SHALL state that any test requiring mocks is an integration test
- **AND** it SHALL provide updated examples using `InMemoryEventBus` and `SilentLogger`

### Requirement: Tests-reviewer agent enforces no-mocks rule

The `tests-reviewer` agent SHALL check all unit test files in scope for mock, stub, or spy usage and flag violations.

#### Scenario: Tests reviewer flags stub in unit test
- **GIVEN** a test review on a file in `tests/unit/`
- **WHEN** the file contains a hand-rolled stub object (e.g., `const stubLogger = () => ...`)
- **THEN** the reviewer SHALL flag it as a violation
- **AND** SHALL suggest using `SilentLogger` or `InMemoryEventBus` instead

#### Scenario: Tests reviewer flags mock import in unit test
- **GIVEN** a test review on a file in `tests/unit/`
- **WHEN** the file imports `mock` from `bun:test`
- **THEN** the reviewer SHALL flag the file for reclassification to integration test

### Requirement: Example tests updated in documentation

All example test files in documentation (`service-patterns.md`, `complete-implementation.md`, `testing.md`) SHALL use real implementations (InMemoryEventBus, SilentLogger) instead of stubs.

#### Scenario: Service pattern doc updated
- **GIVEN** the file `docs/conventions/patterns/service-patterns.md`
- **WHEN** the "Testing Patterns" section is read
- **THEN** the test example SHALL use `InMemoryEventBus` and `SilentLogger`
- **AND** SHALL NOT contain `stubEventBus()` or `stubLogger()`

#### Scenario: Complete implementation doc updated
- **GIVEN** the file `docs/conventions/examples/user-management/complete-implementation.md`
- **WHEN** the application service test example is read
- **THEN** the test SHALL use `InMemoryEventBus` and `SilentLogger`
- **AND** SHALL NOT contain `stubEventBus()` or `stubLogger()`
