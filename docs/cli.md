# CLI Tool

OneJs includes a command-line interface (CLI) to help you scaffold new applications and maintain the project structure.

## Scaffolding a New Application

To create a new application within the `apps/` directory:

```bash
bun create-app my-new-api
```

This will create a new directory with the following structure:
- `application/`: For use cases and services.
- `domain/`: For entities, value objects, and repository interfaces.
- `infrastructure/`: For controllers and repository implementations.

## Utility Commands

The root `package.json` contains several scripts that utilize the framework's internal tools:

### Database & Prisma
- `bun run prisma:merge`: Merges all `.model.prisma` files from `packages/` into `prisma/schema.prisma`.
- `bun run prisma:generate:dev`: Generates the Prisma client based on the merged schema.
- `bun run prisma:migrate:dev`: Runs database migrations.

### Development
- `bun start:api:dev`: The main command to start the API in development mode with all necessary pre-steps (DB start, Prisma build, etc.).

## Extending the CLI

The CLI is located in `packages/create-app/cli.ts`. You can modify it to add more scaffolding templates or custom commands.

