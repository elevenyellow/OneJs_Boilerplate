# Getting Started

This guide will help you get up and running with the OneJs boilerplate.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Bun**: The primary runtime and package manager. Install it from [bun.sh](https://bun.sh/).
- **Docker** or **Podman**: Required for running the database and background services.
- **Node.js**: (v18 or later) Sometimes required for specific tooling dependencies.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd one-js-boilerplate
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

## Running the Application

OneJs comes with pre-configured scripts to manage your development environment.

### Development Mode

To start the full development environment (Database + Prisma Generate + Migrations + API):

```bash
bun start:api:dev
```

This command will:
1.  Start the Postgres database using Docker/Podman.
2.  Generate the Prisma client.
3.  Run database migrations.
4.  Start the Elysia.js server with hot-reloading.

### Database Only

If you only want to start the database container:

```bash
bun start:db
```

### Production Mode

To build and start the application for production:

```bash
bun start:api:prod
```

## What's in the box

This boilerplate ships these workspace packages:

| Package | Purpose |
|---------|---------|
| `@OneJs/core` | DI container, bootstrap, plugins, domain primitives, errors, logger |
| `@OneJs/server` | Elysia HTTP server, controller decorators, health checks, request-id |
| `@OneJs/auth` | Authentication (Local JWT, Clerk), `@UseAuth`, `@Roles` |
| `@OneJs/event-bus` | In-process + Redis-bridged event bus, `@EventHandler` decorator |
| `@OneJs/jobs` | BullMQ-backed durable job queues, `@WorkerJob` decorator |
| `@OneJs/prisma` | Prisma integration, repository base classes |
| `@OneJs/testing` | InMemory fakes for tests (EventBus, Logger, helpers) |

Example bounded contexts in `packages/`: `user/`, `task/`, `shared/`. Example apps in `apps/`: `api/`, `notifications/`.

## Next steps

- [Architecture](architecture.md) — Hexagonal layers and dependency rules
- [Core Features](core-features.md) — DI, bootstrap, domain primitives
- [Feature walkthrough](feature-walkthrough.md) — build a new bounded context end-to-end

