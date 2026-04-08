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
OneJs provides a `PrismaRepository` base class that simplifies common CRUD operations.

```typescript
import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { UserEntity } from '@user/domain/entities/user.entity'

@Injectable()
export class UserPrismaRepository extends PrismaRepository<'user'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'user')
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    return user ? this.toEntity(user) : null
  }

  // Mapper to Domain Entity
  private toEntity(doc: any): UserEntity {
    return new UserEntity(doc.id, doc.name, doc.email)
  }
}
```

## Migrations

Manage your database schema changes using standard Prisma migration commands, wrapped in Bun scripts:

-   `bun run prisma:migrate:dev`: Create and apply migrations in development.
-   `bun run prisma:push`: Push the schema state to the DB (useful for prototyping).
-   `bun run prisma:studio`: Open the Prisma Studio GUI.

