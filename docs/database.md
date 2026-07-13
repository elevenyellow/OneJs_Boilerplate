# Database & Persistence

OneJs primarily uses **Prisma** as its ORM, coupled with the **Repository Pattern** to maintain architectural cleaness.

## Prisma Integration

The `PrismaPlugin` manages the connection to your database. It is configured to handle multiple schema parts that are merged into a single `schema.prisma`.

### Schema Merging
OneJs allows you to define your Prisma models within each module (`packages/*/infrastructure/persistence/prisma/*.model.prisma`). To consolidate these into the main schema, run:

```bash
bun run prisma:merge
```

The main schema is located at `prisma/schema.prisma`.

## Repository Pattern

Repositories act as a bridge between the Domain and Infrastructure layers. You should define an interface in the Domain and implement it using Prisma in the Infrastructure.

### Base Repository
OneJs provides a `PrismaRepository` base class that exposes `findAll`, `findOne`, `create`, `update`, `delete`, and `findWithPagination`. Extend it in your Prisma adapter; implement the domain port interface separately.

```typescript
import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { User } from '@user/domain/entities/user'
import { Email } from '@user/domain/value-objects/email'
import type { IUserRepository } from '@user/domain/repositories/user.repository.interface'

@Injectable()
export class UserPrismaRepository
  extends PrismaRepository<'user'>
  implements IUserRepository
{
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'user')
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
    })
    return row ? User.reconstitute(row.id, row.email, row.passwordHash, row.role, row.createdAt, row.updatedAt) : null
  }
}
```

Key conventions:
- Repository interface methods receive **Value Objects**, never primitives (`email: Email`, not `email: string`).
- Hydrate domain entities via **`Entity.reconstitute()`** — never `new Entity(...)` directly.
- `this.model` (exposed by the base class) gives direct access to the Prisma delegate for the model.

## Migrations

Manage your database schema changes using standard Prisma migration commands, wrapped in Bun scripts:

-   `bun run prisma:migrate:dev`: Create and apply migrations in development.
-   `bun run prisma:push`: Push the schema state to the DB (useful for prototyping).
-   `bun run prisma:studio`: Open the Prisma Studio GUI.

