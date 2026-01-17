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
    cd eyjs-boilerplate
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

## Creating Your First App

OneJs allows you to scaffold new applications or modules within the `apps/` directory using the built-in CLI:

```bash
bun create-app my-new-api
```

Follow the prompts to set up your new application structure.

