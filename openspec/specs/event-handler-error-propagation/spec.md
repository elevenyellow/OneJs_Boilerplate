# event-handler-error-propagation Specification

## Purpose
Ensure domain event handler failures are visible to publishers in every environment, while keeping required in-band workflows on direct application services or domain/application ports instead of event handlers.
## Requirements
### Requirement: Handler failures are surfaced in every environment

The event bus SHALL NOT silently swallow errors thrown by event handlers when publishers call `EventBus.publish()` directly. When a handler throws, the error SHALL propagate so that `publish()` rejects and the publisher can handle the failure explicitly. Error visibility SHALL NOT depend on `NODE_ENV` (or any environment flag) — a handler failure is observable in development and production alike. Workflows that intentionally publish non-critical notification events SHALL make best-effort behavior explicit at the publisher boundary rather than changing the event bus to hide failures globally.

#### Scenario: A throwing handler rejects the publish

- **GIVEN** an event with a registered handler that throws
- **WHEN** the event is published with direct `EventBus.publish()`
- **THEN** `publish()` rejects with (or wrapping) the handler's error
- **AND** the error is not merely logged-and-dropped

#### Scenario: Environment does not change failure visibility

- **GIVEN** the same throwing handler
- **WHEN** the event is published with `NODE_ENV=development` and again with `NODE_ENV=production`
- **THEN** both surface the failure identically (no environment hides it)

#### Scenario: One handler's failure is surfaced among several

- **GIVEN** an event with multiple registered handlers where one throws
- **WHEN** the event is published
- **THEN** the failure is surfaced (not hidden by the other handlers succeeding)
- **AND** the outcome distinguishes which handler failed

#### Scenario: Best-effort publish is explicit

- **GIVEN** a publisher declares an event as non-critical notification work
- **WHEN** a handler or transport fails during the publish
- **THEN** the publisher handles the rejection explicitly and logs the failure
- **AND** the event bus implementation still preserves direct `publish()` rejection semantics

