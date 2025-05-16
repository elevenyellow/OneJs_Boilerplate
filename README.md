# MongoDB Package

A powerful and flexible MongoDB integration package for TypeScript applications, providing decorators, repositories, and utilities for seamless MongoDB operations.

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Basic Usage](#basic-usage)
- [Decorators](#decorators)
- [Repositories](#repositories)
- [Advanced Features](#advanced-features)
- [Development](#development)

## Installation

1. Install the package using your preferred package manager:

```bash
# Using npm
npm install containerv2

# Using yarn
yarn add containerv2

# Using bun
bun add containerv2
```

2. Make sure you have the required peer dependencies:
   - TypeScript (^5.0.0)
   - MongoDB (^6.16.0)

## Configuration

The package provides a `MongoConnector` class that handles the database connection. You can configure it in your application:

```typescript
import { MongoConnector } from 'containerv2';

// Create an instance of MongoConnector
const mongoConnector = new MongoConnector(logger);

// Connect to MongoDB
await mongoConnector.connect('mongodb://localhost:27017/your_database');
```

## Basic Usage

### 1. Define Your Entity

Use the `@Entity()` decorator to define your MongoDB document structure:

```typescript
import { Entity, ObjectId } from 'containerv2';

@Entity()
class User {
  @ObjectId()
  _id: string;

  name: string;
  email: string;
  age: number;
}
```

### 2. Create a Repository

Extend the `MongoRepository` class to create a repository for your entity:

```typescript
import { MongoRepository } from 'containerv2';

class UserRepository extends MongoRepository<User> {
  constructor(mongoConnector: MongoConnector) {
    super(mongoConnector, 'users');
  }
}
```

### 3. Use the Repository

```typescript
// Create a new user
const user = await userRepository.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Find users
const users = await userRepository.find({ age: { $gt: 25 } });

// Update a user
await userRepository.updateOne(
  { _id: user._id },
  { $set: { age: 31 } }
);

// Delete a user
await userRepository.deleteOne({ _id: user._id });
```

## Decorators

The package provides several decorators to enhance your MongoDB entities:

### @Entity()
Marks a class as a MongoDB entity.

### @Collection()
Specifies the collection name for an entity.

### @Ref()
Defines a reference to another document.

### @Populate()
Specifies fields to populate when querying documents.

## Repositories

The `MongoRepository` class provides a comprehensive set of methods for database operations:

- `create()`: Create a new document
- `find()`: Find multiple documents
- `findOne()`: Find a single document
- `updateOne()`: Update a single document
- `updateMany()`: Update multiple documents
- `deleteOne()`: Delete a single document
- `deleteMany()`: Delete multiple documents
- `aggregate()`: Perform aggregation operations

## Advanced Features

### Population
Use the `@Populate()` decorator to automatically populate referenced documents:

```typescript
@Entity()
class Post {
  @ObjectId()
  _id: string;

  @Ref('User')
  @Populate()
  author: User;

  title: string;
  content: string;
}
```

### References
Create relationships between documents using the `@Ref()` decorator:

```typescript
@Entity()
class Comment {
  @ObjectId()
  _id: string;

  @Ref('User')
  author: string;

  @Ref('Post')
  post: string;

  content: string;
}
```

## Development

### Running the Database
The package includes a Docker Compose configuration for local development:

```bash
# Start the MongoDB container
bun start:db
```

### Development Mode
Run the package in development mode with hot reloading:

```bash
bun start:dev
```

### Testing
Run the test suite:

```bash
bun test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This package is private and proprietary. All rights reserved. 