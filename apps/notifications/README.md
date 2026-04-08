# Notifications App (Event Consumer)

This app demonstrates cross-app communication via the event bus.

## Event Flow

1. `@task` publishes `TaskCreatedEvent` (internal to task package).
2. `@task` also publishes `TaskCreatedIntegrationEvent` (shared integration contract).
3. This app subscribes to `TaskCreatedIntegrationEvent` and logs a message.

## Run

```bash
bun run --cwd apps/notifications start:dev
```
