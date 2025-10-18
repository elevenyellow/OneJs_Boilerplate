# @onejs/core

Core dependency injection container, bootstrap, and utilities for OneJs framework.

## Installation

```bash
npm install @onejs/core
```

## Features

- **Dependency Injection Container**: Full-featured DI container with decorators
- **Bootstrap System**: Two-phase plugin system for application initialization
- **Configuration Service**: Environment-based configuration management
- **Logger**: Advanced logging with debug support and color themes
- **Error Handling**: Comprehensive error system with custom error codes
- **Authentication**: Built-in auth middleware with Clerk integration
- **Database**: Prisma client integration with repository pattern

## Usage

### Basic Setup

```typescript
import { OneJs, PluginRegistry } from '@onejs/core'

const oneJs = new OneJs(import.meta.url)
await oneJs.start()
```

### Dependency Injection

```typescript
import { Injectable, Inject } from '@onejs/core'

@Injectable()
export class MyService {
  constructor(@Inject(Logger) private logger: Logger) {}
}
```

### Configuration

```typescript
import { ConfigService } from '@onejs/core'

const config = new ConfigService()
const dbUrl = config.get('DATABASE_URL')
```

### Logging

```typescript
import { logger } from '@onejs/core'

logger.info('app:start', 'Application started')
logger.debug('app:debug', 'Debug information')
```

## Core Services

The following services are automatically registered:

- `Logger` - Application logging
- `ConfigService` - Configuration management
- `PrismaClientEy` - Database client
- `AuthMiddleware` - Authentication middleware

## Plugin System

Plugins can register additional services and functionality:

```typescript
import { BootstrapPlugin } from '@onejs/core'

export class MyPlugin implements BootstrapPlugin {
  name = 'my-plugin'
  
  register(container: Container): void {
    // Register services
  }
  
  async load(container: Container): Promise<void> {
    // Initialize plugin
  }
}
```
