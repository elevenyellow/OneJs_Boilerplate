# ContainerV2 Prisma Package

A powerful and flexible Prisma integration package for TypeScript projects, providing a robust foundation for database operations with Prisma ORM.

## Table of Contents
- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
  - [Basic Setup](#basic-setup)
  - [Using Decorators](#using-decorators)
  - [Working with Repositories](#working-with-repositories)
  - [Services Integration](#services-integration)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Contributing](#contributing)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Bun runtime
- TypeScript (^5.0.0)
- A project using Prisma ORM

### Installation Steps

1. Install the package in your project:
```bash
bun add containerv2
```

2. Make sure you have the required peer dependencies:
```bash
bun add typescript@^5
```

3. Install Prisma client if not already installed:
```bash
bun add @prisma/client
```

## Features

- 🔄 Seamless Prisma integration
- 🏗️ Base repository pattern implementation
- 🎯 Type-safe database operations
- 🛠️ Custom decorators for Prisma models
- 📦 Service layer abstraction
- 🚀 Built-in TypeScript support

## Usage

### Basic Setup

1. Import the necessary components:
```typescript
import { PrismaClient } from 'containerv2';
```

2. Initialize the Prisma client:
```typescript
const prisma = new PrismaClient();
```

### Using Decorators

The package provides custom decorators for Prisma models:

```typescript
import { PrismaModel } from 'containerv2';

@PrismaModel()
class User {
  // Your model definition
}
```

### Working with Repositories

The package includes a base repository pattern for common database operations:

```typescript
import { BaseRepository } from 'containerv2';

class UserRepository extends BaseRepository {
  // Custom repository methods
}
```

### Services Integration

Use the provided service layer for business logic:

```typescript
import { PrismaService } from 'containerv2';

class UserService extends PrismaService {
  // Service methods
}
```

## API Reference

### Core Exports

- `PrismaClient`: The main Prisma client instance
- `BaseRepository`: Base class for repository pattern implementation
- `PrismaService`: Base service class for business logic
- `PrismaModel`: Decorator for Prisma models

### Repository Methods

The `BaseRepository` class provides the following methods:

- `findAll()`: Retrieve all records
- `findById(id)`: Find record by ID
- `create(data)`: Create new record
- `update(id, data)`: Update existing record
- `delete(id)`: Delete record
- `findOne(where)`: Find single record by conditions

## Best Practices

1. **Repository Pattern**
   - Use repositories for data access
   - Keep business logic in services
   - Use decorators for model definitions

2. **Type Safety**
   - Always use TypeScript types
   - Leverage Prisma's generated types
   - Use proper type annotations

3. **Error Handling**
   - Implement proper error handling
   - Use try-catch blocks
   - Handle Prisma-specific errors

4. **Performance**
   - Use proper indexing
   - Implement pagination
   - Optimize queries

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is private and proprietary. All rights reserved. 