## ADDED Requirements

### Requirement: Error type labels as named constants

Every `OneJsError` type label (first argument) SHALL be a named constant from a per-context constants file, NOT an inline string literal.

#### Scenario: Service throws conflict error with constant
- **GIVEN** a service that checks for duplicate email
- **WHEN** the service constructs a `OneJsError` with a conflict type label
- **THEN** the type label SHALL reference `UserErrorTypes.CONFLICT` (or equivalent) instead of the literal `'Conflict'`

#### Scenario: VO validation uses constant
- **GIVEN** a value object's `create()` method validates input
- **WHEN** validation fails and constructs a `OneJsError`
- **THEN** the type label SHALL reference `UserErrorTypes.VALIDATION_FAILED` (or equivalent) instead of the literal `'Validation failed'`

### Requirement: Error messages as named constants

Every `OneJsError` message (third argument) SHALL be a named constant from a per-context constants file, NOT an inline string literal.

#### Scenario: Conflict message uses constant
- **GIVEN** a service that detects a duplicate email
- **WHEN** the service constructs a `OneJsError`
- **THEN** the message SHALL reference `UserErrorMessages.EMAIL_IN_USE` (or equivalent) instead of the literal `'Email already in use'`

#### Scenario: Not found message uses constant
- **GIVEN** a service that does not find a user
- **WHEN** the service constructs a `OneJsError`
- **THEN** the message SHALL reference `UserErrorMessages.USER_NOT_FOUND` (or equivalent) instead of the literal `'User not found'`

### Requirement: Log scopes as named constants

Every log scope string (first argument to `logger.debug/info/error`) SHALL be a named constant from a per-context constants file, NOT an inline string literal.

#### Scenario: Service debug uses constant
- **GIVEN** a service that logs a debug message
- **WHEN** the service calls `this.logger.debug(scope, message)`
- **THEN** the scope argument SHALL reference `UserLogScopes.SERVICE` (or equivalent) instead of the literal `'user:service'`

### Requirement: Constants file location per bounded context

Each bounded context SHALL define its error and log constants in `domain/constants/` with separate files for error types, error messages, and log scopes.

#### Scenario: Convention doc validates constants path
- **GIVEN** a bounded context `packages/<context>`
- **WHEN** a developer or agent adds constants
- **THEN** they SHALL be in `packages/<context>/domain/constants/`
- **AND** the file structure SHALL follow `domain/constants/error-types.ts`, `domain/constants/error-messages.ts`, `domain/constants/log-scopes.ts` (exact naming may vary by context but location is fixed)

### Requirement: Reviewer agents flag magic string violations

The `code-reviewer` and `architecture-reviewer` agents SHALL check for inline magic strings in error construction and log calls, flagging them as violations.

#### Scenario: Code reviewer detects magic string
- **GIVEN** a code review on a service file
- **WHEN** the file contains `throw new OneJsError('Conflict', ...)`
- **THEN** the reviewer SHALL flag the `'Conflict'` literal as a magic string violation

#### Scenario: Architecture reviewer detects magic string
- **GIVEN** an architecture review on a bounded context
- **WHEN** the context's entity/VO files contain inline error type literals
- **THEN** the reviewer SHALL flag the literal and reference the requirement for named constants
