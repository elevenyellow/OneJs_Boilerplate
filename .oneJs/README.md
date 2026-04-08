# Core Package

A powerful and flexible core package that provides essential functionality for building robust Node.js applications. This package includes dependency injection, auto-loading, event bus, logging, and server management capabilities.

## Features

- 🎯 **Dependency Injection Container**: Manage dependencies and services efficiently
- 🔄 **Auto-loader**: Automatically load and register components
- 📡 **Event Bus**: Publish and subscribe to events across your application
- 📝 **Logging**: Advanced logging capabilities with Pino
- 🌐 **Server Management**: Express-based server with built-in middleware
- ⚙️ **Configuration Management**: Flexible configuration system

## Installation

```bash
# Using npm
npm install core

# Using yarn
yarn add core

# Using pnpm
pnpm add core
```

## Prerequisites

This package requires TypeScript and the following peer dependencies:
- TypeScript ^5.0.0
- Express ^4.19.2
- CORS ^2.8.5
- Body-parser ^1.20.2

## Usage

### Basic Setup

```typescript
import { Container, AutoLoader, Server, Logger, EventBus } from 'core';

// Initialize the container
const container = new Container();

// Set up auto-loader
const autoLoader = new AutoLoader({
  container,
  patterns: ['**/*.service.ts', '**/*.controller.ts']
});

// Initialize the server
const server = new Server({
  port: 3000,
  container
});

// Start the application
async function bootstrap() {
  await autoLoader.load();
  await server.start();
}

bootstrap();
```

### Dependency Injection

```typescript
import { Injectable } from 'core';

@Injectable()
class UserService {
  constructor(private readonly logger: Logger) {}

  async findUser(id: string) {
    this.logger.info(`Finding user with id: ${id}`);
    // Implementation
  }
}
```

### Event Bus

```typescript
import { EventBus } from 'core';

// Subscribe to events
eventBus.subscribe('user.created', (data) => {
  console.log('User created:', data);
});

// Publish events
eventBus.publish('user.created', { id: 1, name: 'John' });
```

### Logging

```typescript
import { Logger } from 'core';

const logger = new Logger({
  level: 'info',
  pretty: true
});

logger.info('Application started');
logger.error('An error occurred', { error: new Error('Something went wrong') });
```

### Server Configuration

```typescript
import { Server } from 'core';

const server = new Server({
  port: 3000,
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  bodyParser: {
    json: { limit: '1mb' },
    urlencoded: { extended: true }
  }
});
```

## Configuration

The package can be configured through environment variables or a configuration file:

```typescript
// config/default.ts
export default {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production'
  }
};
```

## Advanced Usage

### Custom Middleware

```typescript
import { Server } from 'core';

const server = new Server({
  port: 3000,
  middleware: [
    (req, res, next) => {
      // Custom middleware
      next();
    }
  ]
});
```

### Error Handling

```typescript
import { Server } from 'core';

const server = new Server({
  port: 3000,
  errorHandler: (error, req, res, next) => {
    // Custom error handling
    res.status(500).json({ error: error.message });
  }
});
```

## Best Practices

1. **Container Usage**
   - Register all services and controllers through the container
   - Use dependency injection for better testability
   - Avoid circular dependencies

2. **Auto-loader**
   - Use consistent naming conventions for files
   - Group related components in directories
   - Use appropriate file patterns for loading

3. **Event Bus**
   - Use typed events for better type safety
   - Handle errors in event subscribers
   - Avoid long-running operations in event handlers

4. **Logging**
   - Use appropriate log levels
   - Include relevant context in log messages
   - Configure log rotation in production

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.