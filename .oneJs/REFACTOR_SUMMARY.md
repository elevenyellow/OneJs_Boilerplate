# OneJs DI Architecture Refactor Summary

## Overview
Successfully refactored the `.oneJs` framework to support a plugin-based architecture with dependency injection through a container provider pattern. This allows for extensible service registration where new features can easily add their own bootstrap loaders without modifying core code.

## Key Changes

### 1. Container Provider System
**New file:** `.oneJs/container/container-provider.ts`
- Provides global access to the DI container using a provider pattern
- Eliminates hardcoded container singleton dependencies
- Supports testing through `clear()` method

### 2. Plugin Registry System
**New file:** `.oneJs/bootstrap/plugin-registry.ts`
- `BootstrapPlugin` interface for extensibility
- `PluginRegistry` class to register and retrieve plugins
- Plugins are sorted by priority (lower numbers load first)
- Each plugin receives the container and processes decorated classes

### 3. Feature Loaders (Plugins)

#### Bootstrap Loader
**File:** `.oneJs/bootstrap/bootstrap-loader.ts`
- Handles classes extending `BootstrapBase`
- Priority: 10 (loads first)

#### Event Bus Loader
**File:** `.oneJs/event-bus/loader.ts`
- Registers `@EventHandler` decorated methods
- Priority: 50

#### Jobs Loader
**File:** `.oneJs/jobs/loader.ts`
- Registers `@WorkerJob` decorated methods
- Priority: 60

#### Server Loader
**File:** `.oneJs/server/loader.ts`
- Registers `@Controller` decorated classes
- Priority: 70

### 4. Refactored Services

#### EventBus
- Removed `BootstrapBase` extension
- Removed `bootstrap()` method (logic moved to loader)
- Cleaner separation of concerns

#### WorkerService
- Removed `BootstrapBase` extension
- Removed `bootstrap()` and `registerWorkersFromMetadata()` methods
- Logic moved to `JobsLoader`

#### QueueService
- Updated to use proper dependency injection
- Now injects `RedisService` instead of using `container.get()`

#### Server
- Updated to use `ContainerProvider` instead of hardcoded `container`
- Removed automatic controller loading from `start()` method
- Controllers now registered by `ServerLoader` plugin

### 5. Bootstrap Flow (oneJs.ts)
The new bootstrap sequence:
1. Set container in `ContainerProvider`
2. Load files with `AutoLoader`
3. Register all injectable services in container
4. Execute all registered plugins in priority order

### 6. Auto-Registration
Plugins are automatically registered when their modules are imported:
- `.oneJs/bootstrap/index.ts` - registers `BootstrapLoader`
- `.oneJs/event-bus/index.ts` - registers `EventBusLoader`
- `.oneJs/jobs/index.ts` - registers `JobsLoader`
- `.oneJs/server/index.ts` - registers `ServerLoader`

### 7. Exports
Updated `.oneJs/index.ts` to export:
- `ContainerProvider` - for accessing container
- `BootstrapPlugin` interface - for creating custom loaders
- All existing exports maintained for backward compatibility

## Benefits

### Extensibility
- New features can add their own loaders without modifying core code
- Simply implement `BootstrapPlugin` interface and register in module index

### Separation of Concerns
- Services focus on their domain logic
- Loading/registration logic isolated in plugins
- Bootstrap process is generic and extensible

### Testability
- `ContainerProvider` can be cleared and reset for tests
- Plugins can be tested independently
- Services no longer depend on global singleton

### Maintainability
- Clear plugin priority system
- Each feature module is self-contained
- Easy to add, remove, or modify loaders

## Creating Custom Loaders

To create a custom loader for a new feature:

```typescript
// 1. Create the loader
import type { Container } from '../container'
import { logger } from '../logger'
import type { BootstrapPlugin } from '../bootstrap'

export class MyFeatureLoader implements BootstrapPlugin {
  name = 'my-feature-loader'
  priority = 80 // Set loading order

  async load(container: Container): Promise<void> {
    // Get decorated classes from your store
    const handlers = getAllMyHandlers()
    
    // Process each handler
    for (const handler of handlers) {
      const instance = container.get(handler.target)
      // Register or configure the handler
    }
    
    logger.debug('oneJs:my-feature', '✅ My feature loaded')
  }
}

// 2. Auto-register in your module's index.ts
import { PluginRegistry } from '../bootstrap'
import { MyFeatureLoader } from './loader'

PluginRegistry.register(new MyFeatureLoader())

export * from './my-feature'
```

## Migration Guide

For existing code:
- No changes required - backward compatible
- Services extending `BootstrapBase` still work
- Decorators work exactly as before
- The only difference is internal architecture

For new features:
- Create a loader plugin implementing `BootstrapPlugin`
- Register it in your module's index file
- Define priority based on dependencies

## Architecture Diagram

```
OneJs.start()
  ├─> Set ContainerProvider
  ├─> AutoLoader (import all files)
  ├─> Register services in Container
  └─> Execute plugins (by priority)
       ├─> BootstrapLoader (10)
       ├─> EventBusLoader (50)
       ├─> JobsLoader (60)
       └─> ServerLoader (70)
```

