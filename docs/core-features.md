# Core Features

OneJs provides a set of powerful features to simplify application development and maintain a clean codebase.

## Dependency Injection (DI)

OneJs includes a built-in DI container that manages the lifecycle and dependencies of your classes.

### `@Injectable`
Mark any class as injectable into the container.

```typescript
import { Injectable } from '@OneJs/core'

@Injectable()
export class MyService {
  doSomething() {
    return 'Done!'
  }
}
```

### `@Inject`
Inject dependencies into your class constructors.

```typescript
import { Inject, Injectable } from '@OneJs/core'
import { MyService } from './my-service'

@Injectable()
export class MyUseCase {
  constructor(
    @Inject(MyService) private readonly myService: MyService
  ) {}

  execute() {
    return this.myService.doSomething()
  }
}
```

## Bootstrapping

The `OneJs` class is responsible for initializing the framework, loading modules, and starting the dependency container.

```typescript
import { OneJs, PluginRegistry } from '@OneJs'
import { ServerPlugin } from '@OneJs/server'

// 1. Register Plugins
PluginRegistry.register(new ServerPlugin())

// 2. Initialize OneJs
const oneJs = new OneJs(import.meta.url)

// 3. Start the engine
await oneJs.start()
```

### Auto-Loading
OneJs automatically scans your project directories (specified in `OneJs` options) and registers any class decorated with `@Injectable` or `@Controller`.

## Plugin System

The framework is highly extensible through its plugin system. Plugins can hook into the bootstrap process to register services or modify the server behavior.

Core plugins include:
- `ServerPlugin`: Handles HTTP server setup with Elysia.
- `PrismaPlugin`: Manages Prisma database connections.
- `EventBusPlugin`: Enables event-driven communication.
- `JobsPlugin`: Integrates BullMQ for background tasks.

