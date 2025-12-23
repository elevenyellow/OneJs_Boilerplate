# Migration Guide: DI Architecture Refactor

This guide helps you migrate existing OneJs applications to the new plugin-based architecture.

## TL;DR - Breaking Changes

**Good news:** 🎉 **NO BREAKING CHANGES** for most users!

The refactor is **100% backward compatible** for standard usage. Your existing code should work without modifications.

However, if you were doing any of the following advanced patterns, read the relevant sections below:

- Directly accessing the `container` singleton
- Extending `BootstrapBase` and calling `bootstrap()`
- Manually calling `Server.start()` with controller discovery
- Custom auto-loading logic

## What Changed Internally

### Architecture Changes

#### Before:
```typescript
OneJs.start()
  ├─> AutoLoader imports files
  ├─> Check if service extends BootstrapBase
  ├─> Register all services
  └─> Call bootstrap() on BootstrapBase classes
```

#### After:
```typescript
OneJs.start()
  ├─> Set ContainerProvider
  ├─> AutoLoader imports files
  ├─> Register all services
  └─> Execute plugins (in priority order)
       ├─> BootstrapLoader (handles BootstrapBase)
       ├─> EventBusLoader (handles @EventHandler)
       ├─> JobsLoader (handles @WorkerJob)
       └─> ServerLoader (handles @Controller)
```

### Container Access

#### Before:
```typescript
import { container } from '@OneJs/core'

const service = container.get(MyService)
```

#### After (Recommended):
```typescript
import { ContainerProvider } from '@OneJs/core'

const container = ContainerProvider.getContainer()
const service = container.get(MyService)
```

**Note:** The old way still works! But using `ContainerProvider` is recommended for better testability.

## Migration Scenarios

### Scenario 1: Standard Usage (No Changes Needed)

If your code looks like this, **no changes required**:

```typescript
// ✅ Still works perfectly
@Injectable()
export class UserService {
  constructor(
    @Inject(Logger) private logger: Logger
  ) {}
}

@Controller('/users')
export class UserController {
  @Get('/')
  getUsers() {
    return { users: [] }
  }
}

@Injectable()
export class UserEventHandler {
  @EventHandler(UserCreatedEvent)
  async handle(event: UserCreatedEvent) {
    // Handle event
  }
}
```

### Scenario 2: Using `container.get()` Directly

#### Before:
```typescript
import { container, Injectable } from '@OneJs/core'

@Injectable()
export class MyService {
  constructor() {
    // ⚠️ Direct container access
    const logger = container.get(Logger)
  }
}
```

#### After (Option 1 - Recommended):
Use proper dependency injection:
```typescript
import { Injectable, Inject, Logger } from '@OneJs/core'

@Injectable()
export class MyService {
  constructor(
    @Inject(Logger) private logger: Logger
  ) {}
}
```

#### After (Option 2):
Use ContainerProvider for better testability:
```typescript
import { Injectable, ContainerProvider, Logger } from '@OneJs/core'

@Injectable()
export class MyService {
  constructor() {
    const container = ContainerProvider.getContainer()
    const logger = container.get(Logger)
  }
}
```

### Scenario 3: Custom Bootstrap Classes

#### Before:
```typescript
import { BootstrapBase, Injectable } from '@OneJs/core'

@Injectable()
export class DatabaseBootstrap extends BootstrapBase {
  async bootstrap() {
    // Initialize database
  }
}
```

#### After:
**No changes needed!** This still works exactly the same way. The `BootstrapLoader` plugin now handles these classes.

### Scenario 4: Manual Event Handler Registration

#### Before:
If you were manually registering event handlers:
```typescript
import { container, EventBus } from '@OneJs/core'

const eventBus = container.get(EventBus)
eventBus.subscribe('UserCreated', handler)
```

#### After:
**No changes needed!** But consider using the `@EventHandler` decorator instead:
```typescript
@Injectable()
export class MyHandler {
  @EventHandler(UserCreatedEvent)
  async handle(event: UserCreatedEvent) {
    // Handle event
  }
}
```

### Scenario 5: Custom Server Configuration

#### Before:
```typescript
import { container, Server } from '@OneJs/core'

const server = container.get(Server)
server.setPrefix('/api/v1')
server.start(3000)
```

#### After:
**Still works!** But note that controllers are now loaded by the `ServerLoader` plugin before `server.start()` is called. If you need to add controllers manually:

```typescript
import { ContainerProvider, Server } from '@OneJs/core'

const container = ContainerProvider.getContainer()
const server = container.get(Server)
server.setPrefix('/api/v1')
// Controllers already loaded by ServerLoader
server.start(3000)
```

### Scenario 6: Testing with Container

#### Before:
```typescript
import { container } from '@OneJs/core'

describe('MyService', () => {
  beforeEach(() => {
    container.clear()
    // Set up test container
  })
})
```

#### After:
```typescript
import { ContainerProvider, Container } from '@OneJs/core'

describe('MyService', () => {
  let testContainer: Container

  beforeEach(() => {
    testContainer = new Container()
    ContainerProvider.setContainer(testContainer)
    // Register test services
  })

  afterEach(() => {
    ContainerProvider.clear()
  })
})
```

## New Features You Can Use

### 1. Create Custom Loaders

You can now easily extend OneJs with custom features:

```typescript
import type { BootstrapPlugin } from '@OneJs/core'

export class MyFeatureLoader implements BootstrapPlugin {
  name = 'my-feature-loader'
  priority = 80

  async load(container: Container): Promise<void> {
    // Initialize your feature
  }
}

// In your index.ts
import { PluginRegistry } from '@OneJs/core'
PluginRegistry.register(new MyFeatureLoader())
```

### 2. Access Container Safely

```typescript
import { ContainerProvider } from '@OneJs/core'

if (ContainerProvider.hasContainer()) {
  const container = ContainerProvider.getContainer()
  // Use container
}
```

### 3. Plugin Priority System

Control when your features load:

```typescript
export class MyLoader implements BootstrapPlugin {
  name = 'my-loader'
  priority = 45 // Lower = earlier
  
  async load(container: Container) {
    // Loads between bootstrap (10) and event-bus (50)
  }
}
```

## Verification Steps

After migrating, verify everything works:

### 1. Check Application Starts
```bash
bun run dev
```

Look for successful plugin loading messages:
```
🔌 Loading plugins...
⚡ Loading plugin: bootstrap-loader
⚡ Loading plugin: event-bus-loader
⚡ Loading plugin: jobs-loader
⚡ Loading plugin: server-loader
✅ OneJs initialization complete
```

### 2. Run Tests
```bash
bun test
```

All existing tests should pass without modification.

### 3. Test Features
- ✅ HTTP endpoints respond
- ✅ Event handlers execute
- ✅ Worker jobs process
- ✅ Database connections work
- ✅ Logging works

## Common Issues and Solutions

### Issue 1: "Container not initialized"

**Error:**
```
Error: Container not initialized. Call ContainerProvider.setContainer() first.
```

**Cause:** Trying to access container before `OneJs.start()` completes.

**Solution:** Ensure your code runs after bootstrap:
```typescript
const app = new OneJs(import.meta.url)
await app.start() // Wait for this

// Now safe to use ContainerProvider
const container = ContainerProvider.getContainer()
```

### Issue 2: Services Not Found

**Error:**
```
Error: No service registered for type: MyService
```

**Cause:** Service not decorated with `@Injectable()` or not imported.

**Solution:**
1. Add `@Injectable()` decorator
2. Ensure the file is imported somewhere so AutoLoader can find it

### Issue 3: Event Handlers Not Firing

**Symptom:** Events published but handlers don't execute.

**Cause:** Event type name mismatch.

**Solution:** Ensure event class name matches registration:
```typescript
// Event class name
class UserCreatedEvent extends DomainEvent { }

// Handler registration - use class constructor
@EventHandler(UserCreatedEvent) // ✅ Correct
```

### Issue 4: Controllers Not Loading

**Symptom:** 404 on all routes.

**Cause:** Controllers not registered before server starts.

**Solution:** The `ServerLoader` plugin automatically handles this. Ensure:
1. Controllers have `@Controller()` decorator
2. Routes have method decorators (`@Get()`, `@Post()`, etc.)
3. `OneJs.start()` is called before `server.start()`

## Rollback Plan

If you encounter issues, you can temporarily rollback to the old behavior:

### Option 1: Use Previous Git Commit
```bash
git checkout <previous-commit>
```

### Option 2: Vendor the Old Code
Keep a copy of the old `.oneJs` folder and swap if needed.

### Option 3: Report Issue
Open an issue with:
- Error message
- Minimal reproduction
- Expected vs actual behavior

## Getting Help

- **Documentation:** Check `REFACTOR_SUMMARY.md` for architecture details
- **Examples:** See `EXTENSION_EXAMPLE.md` for creating custom loaders
- **Testing:** Review `TESTING_GUIDE.md` for verification steps
- **Issues:** Open a GitHub issue with details

## Summary

For 99% of users: **No migration needed!** ✅

The refactor is internally significant but externally transparent. Your existing decorators, services, and patterns all work as before.

The main benefit is that you can now easily extend OneJs with custom features using the plugin system, following the same patterns we use internally for event handlers, controllers, and worker jobs.

Happy coding! 🚀

