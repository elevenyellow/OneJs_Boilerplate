# Create App

A powerful CLI tool for generating hexagonal architecture folder structures for new applications. This tool helps you maintain a consistent and clean architecture across your projects by automatically creating the necessary folder structure and boilerplate files.

## Features

- Generates a complete hexagonal architecture folder structure
- Creates boilerplate files for:
  - Services
  - Repositories
  - Entities
  - Value Objects
  - Controllers
- Follows best practices for clean architecture
- Supports custom base paths
- TypeScript ready

## Installation

### Global Installation

```bash
npm install -g @OneJs/core/create-app
```

### Local Installation

```bash
npm install --save-dev @OneJs/core/create-app
```

## Usage

### Basic Usage

To create a new application with the default structure:

```bash
create-app my-app
```

This will create a new application structure in `src/apps/my-app` with the following structure:

```
src/apps/my-app/
├── application/
│   └── my-app.service.ts
├── domain/
│   ├── dtos/
│   ├── entities/
│   │   └── my-app.ts
│   └── value-objects/
│       └── id.ts
└── infrastructure/
    ├── controllers/
    │   └── my-app.controller.ts
    └── persistance/
        └── my-app-mongo.repository.ts
```

### Custom Base Path

You can specify a custom base path where the application structure will be created:

```bash
create-app my-app --path custom/path
```

This will create the application structure in `custom/path/my-app`.

## Generated Files

### Service (application/my-app.service.ts)

A basic service class with dependency injection support:

```typescript
import { Injectable } from '@OneJs/core'

@Injectable()
export class MyAppService {
  constructor() {
    // Initialize service
  }

  public execute() {
    // Service logic
  }
}
```

### Repository (infrastructure/persistance/my-app-mongo.repository.ts)

A MongoDB repository implementation with basic CRUD operations:

```typescript
import { Injectable, MongoConnector } from '@OneJs/core'
import { Collection } from 'mongodb'
import { MyApp } from '@my-app/domain/entities/my-app'

@Injectable()
export class MyAppMongoRepository {
  private readonly collection: Collection<MyApp>

  constructor(private dbService: MongoConnector) {
    this.collection = this.dbService.collection('my-app')
  }

  public async save(entity: MyApp) {
    await this.collection.updateOne(
      { id: entity.id.toString() },
      { $set: entity.toDatabase() },
      { upsert: true }
    )
  }

  public async findOneById(id: Id) {
    const dto = await this.collection.findOne({ id: id.toString() })
    return dto ? MyApp.fromDatabase(dto) : null
  }
}
```

### Entity (domain/entities/my-app.ts)

A basic entity class with database mapping methods:

```typescript
import { Id } from '@my-app/domain/value-objects/id'

export class MyApp {
  constructor(
    public readonly id: Id,
    // Add other properties here
  ) {}

  public toDatabase() {
    return {
      id: this.id.toString(),
      // Map other properties here
    }
  }

  public static fromDatabase(dto: any): MyApp {
    return new MyApp(Id.createFrom(dto.id) /* map other properties */)
  }
}
```

### Value Object (domain/value-objects/id.ts)

A UUID-based ID value object with validation:

```typescript
import { v4 as uuidv4 } from 'uuid'

export class Id {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static generateUniqueId(): Id {
    return new Id(uuidv4())
  }

  static createFrom(id: string): Id {
    if (!this.isValidIdentifier(id)) {
      throw new Error('Invalid Id format')
    }
    return new Id(id)
  }

  private static isValidIdentifier(id: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    return uuidRegex.test(id)
  }

  equals(other: Id): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

### Controller (infrastructure/controllers/my-app.controller.ts)

A basic controller with dependency injection:

```typescript
import { Controller } from '@OneJs/core'
import { MyAppService } from '@my-app/application/my-app.service'
import { MyAppMongoRepository } from '@my-app/infrastructure/persistance/my-app-mongo.repository'

@Controller('/my-app')
export class MyAppController {
  constructor(
    private readonly service: MyAppService,
    private readonly repository: MyAppMongoRepository,
  ) {}
}
```

## Architecture Overview

The generated structure follows hexagonal architecture principles:

- **Domain Layer**: Contains business logic, entities, and value objects
  - `entities/`: Business objects with their properties and methods
  - `value-objects/`: Immutable objects that represent domain concepts
  - `dtos/`: Data Transfer Objects for the domain layer

- **Application Layer**: Contains use cases and business rules
  - Services that orchestrate the flow of data and implement business rules

- **Infrastructure Layer**: Contains external interfaces and implementations
  - `controllers/`: HTTP endpoints and request handling
  - `persistance/`: Database implementations and data access

## Best Practices

1. Keep business logic in the domain layer
2. Use value objects for immutable concepts
3. Implement repositories in the infrastructure layer
4. Use dependency injection for better testability
5. Keep controllers thin and focused on HTTP concerns

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 