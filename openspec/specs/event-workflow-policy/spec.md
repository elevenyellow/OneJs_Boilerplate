# event-workflow-policy Specification

## Purpose
TBD - created by archiving change clean-event-workflows. Update Purpose after archive.
## Requirements
### Requirement: Required workflow work is direct and awaited

The system SHALL perform any workflow step required for correctness, access control, invariants, transactionality, or response truth through direct application-service calls or hexagonal ports. Required workflow work SHALL NOT depend on domain-event handlers.

#### Scenario: Required cross-context write succeeds before response
- **GIVEN** a use-case needs another bounded context to persist state before the caller can receive success
- **WHEN** the use-case runs
- **THEN** it invokes the other bounded context through an application service or port and awaits the result
- **AND** a failure propagates before a success response is returned

#### Scenario: Event handler absence cannot skip required work
- **GIVEN** an event handler is not registered in the API module
- **WHEN** a required workflow step runs
- **THEN** the required state transition still happens through direct application orchestration

### Requirement: Domain events are non-critical notifications or integration signals

The system SHALL use domain events only for non-critical notification, observability, or integration side effects that do not need to complete for the publisher's workflow to be correct. Publishers of non-critical events SHALL make best-effort behavior explicit and SHALL log failures with enough context to diagnose the missed side effect.

#### Scenario: Notification failure does not fail committed workflow
- **GIVEN** a workflow has completed all required persisted state changes
- **WHEN** a following notification event publish or handler fails
- **THEN** the original workflow still returns its successful outcome
- **AND** the event failure is logged with the event name and workflow context

#### Scenario: Required work is not moved into notification handler
- **GIVEN** a notification event has a handler
- **WHEN** that handler is disabled or fails
- **THEN** no required invariant, access-control decision, response field, or transactional state change is lost

### Requirement: Dead event contracts are removed or backed by runtime behavior

The system SHALL NOT keep domain or integration event classes as implied contracts when they have no runtime publisher, no handler, and no current specification-backed behavior. Such events SHALL be removed or explicitly wired as non-critical notifications with tests.

#### Scenario: Unused event class is found
- **GIVEN** an event class has no production publisher and no production handler
- **WHEN** event workflow cleanup runs
- **THEN** the event is deleted or a specification-backed runtime use is added
- **AND** exports and tests are updated to match the chosen behavior

### Requirement: Framework diagnostics are not cross-process domain events

Framework diagnostics events that carry process objects, functions, or other non-serializable values SHALL NOT be treated as Redis/integration events. If retained, they SHALL remain in-process diagnostics only and SHALL NOT be required for application correctness.

#### Scenario: Worker lifecycle event carries non-serializable payload
- **GIVEN** a worker diagnostic event includes a `Worker` instance or job processor function
- **WHEN** the event bus is configured with a Redis bridge
- **THEN** application correctness does not depend on that event being serialized or consumed cross-process

