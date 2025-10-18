# Testing Guide for DI Refactor

This guide helps verify that the refactored architecture works correctly.

## Quick Verification Checklist

### 1. Container Provider
```typescript
import { ContainerProvider, container } from '@OneJs'

// Should throw before initialization
try {
  ContainerProvider.getContainer()
} catch (error) {
  console.log('✅ Container provider correctly throws before init')
}

// Should work after setting
ContainerProvider.setContainer(container)
const c = ContainerProvider.getContainer()
console.log('✅ Container provider working:', c === container)
```

### 2. Plugin Registry
```typescript
import { PluginRegistry, BootstrapPlugin } from '@OneJs'

// Check registered plugins
const plugins = PluginRegistry.getAll()
console.log('📦 Registered plugins:', plugins.map(p => p.name))

// Should include at minimum:
// - bootstrap-loader
// - event-bus-loader
// - jobs-loader
// - server-loader

console.log('✅ Found', plugins.length, 'plugins')
```

### 3. Bootstrap Flow
```typescript
import { OneJs } from '@OneJs'

const app = new OneJs(import.meta.url)

await app.start({
  rootDir: import.meta.dir,
})

// Check container was set
console.log('✅ Bootstrap completed successfully')
```

### 4. Event Handlers
```typescript
import { Injectable, EventHandler, DomainEvent } from '@OneJs'

class TestEvent extends DomainEvent {
  constructor(public message: string) {
    super()
  }
}

@Injectable()
class TestEventHandler {
  @EventHandler(TestEvent)
  async handle(event: TestEvent) {
    console.log('✅ Event handler working:', event.message)
  }
}

// After bootstrap, publish an event
const eventBus = container.get(EventBus)
await eventBus.publish(new TestEvent('Hello from refactored system!'))
```

### 5. Controllers
```typescript
import { Controller, Get } from '@OneJs'

@Controller('/test')
class TestController {
  @Get('/')
  getTest() {
    return { message: 'Controller working!' }
  }
}

// After bootstrap, controllers should be registered
const server = container.get(Server)
// Check server has controllers loaded
console.log('✅ Controllers registered')
```

### 6. Worker Jobs
```typescript
import { Injectable, WorkerJob } from '@OneJs'

@Injectable()
class TestWorker {
  @WorkerJob('test-queue', 1)
  async processTestJob(job: Job) {
    console.log('✅ Worker job working:', job.data)
  }
}

// After bootstrap, workers should be registered
const workerService = container.get(WorkerService)
// Workers automatically started
console.log('✅ Workers registered and started')
```

## Integration Test Example

Create a complete test that verifies all features work together:

```typescript
// test/integration/bootstrap.test.ts
import { describe, it, expect, beforeAll } from 'bun:test'
import {
  OneJs,
  ContainerProvider,
  PluginRegistry,
  container,
} from '@OneJs'

describe('DI Refactor Integration', () => {
  beforeAll(async () => {
    const app = new OneJs(import.meta.url)
    await app.start({
      rootDir: import.meta.dir,
    })
  })

  it('should set container in provider', () => {
    expect(ContainerProvider.hasContainer()).toBe(true)
    expect(ContainerProvider.getContainer()).toBe(container)
  })

  it('should register all core plugins', () => {
    const plugins = PluginRegistry.getAll()
    const pluginNames = plugins.map(p => p.name)

    expect(pluginNames).toContain('bootstrap-loader')
    expect(pluginNames).toContain('event-bus-loader')
    expect(pluginNames).toContain('jobs-loader')
    expect(pluginNames).toContain('server-loader')
  })

  it('should load plugins in priority order', () => {
    const plugins = PluginRegistry.getAll()
    
    // Check priorities are ascending
    for (let i = 1; i < plugins.length; i++) {
      const prev = plugins[i - 1].priority ?? 100
      const curr = plugins[i].priority ?? 100
      expect(curr).toBeGreaterThanOrEqual(prev)
    }
  })

  it('should resolve services from container', () => {
    const logger = container.get(Logger)
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
  })

  it('should register event handlers', async () => {
    const eventBus = container.get(EventBus)
    expect(eventBus).toBeDefined()
    
    // Event handlers should be registered during bootstrap
    // Test by publishing an event
    let handlerCalled = false
    
    class TestEvent extends DomainEvent {
      constructor(public data: string) {
        super()
      }
    }
    
    eventBus.subscribe('TestEvent', {
      handle: async (event) => {
        handlerCalled = true
      }
    })
    
    await eventBus.publish(new TestEvent('test'))
    expect(handlerCalled).toBe(true)
  })

  it('should register controllers', () => {
    const server = container.get(Server)
    expect(server).toBeDefined()
    // Controllers loaded by ServerLoader plugin
  })
})
```

## Unit Test Examples

### Testing Container Provider

```typescript
// test/unit/container-provider.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { ContainerProvider, Container } from '@OneJs'

describe('ContainerProvider', () => {
  afterEach(() => {
    ContainerProvider.clear()
  })

  it('should throw when getting container before setting', () => {
    expect(() => ContainerProvider.getContainer()).toThrow()
  })

  it('should return container after setting', () => {
    const container = new Container()
    ContainerProvider.setContainer(container)
    expect(ContainerProvider.getContainer()).toBe(container)
  })

  it('should check if container exists', () => {
    expect(ContainerProvider.hasContainer()).toBe(false)
    ContainerProvider.setContainer(new Container())
    expect(ContainerProvider.hasContainer()).toBe(true)
  })

  it('should clear container', () => {
    ContainerProvider.setContainer(new Container())
    ContainerProvider.clear()
    expect(ContainerProvider.hasContainer()).toBe(false)
  })
})
```

### Testing Plugin Registry

```typescript
// test/unit/plugin-registry.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { PluginRegistry, type BootstrapPlugin } from '@OneJs'

describe('PluginRegistry', () => {
  beforeEach(() => {
    PluginRegistry.clear()
  })

  it('should register plugins', () => {
    const plugin: BootstrapPlugin = {
      name: 'test-plugin',
      load: async () => {},
    }

    PluginRegistry.register(plugin)
    expect(PluginRegistry.has('test-plugin')).toBe(true)
  })

  it('should prevent duplicate registration', () => {
    const plugin: BootstrapPlugin = {
      name: 'test-plugin',
      load: async () => {},
    }

    PluginRegistry.register(plugin)
    PluginRegistry.register(plugin) // Should warn, not add

    const plugins = PluginRegistry.getAll()
    expect(plugins.length).toBe(1)
  })

  it('should sort plugins by priority', () => {
    const plugin1: BootstrapPlugin = {
      name: 'low-priority',
      priority: 100,
      load: async () => {},
    }

    const plugin2: BootstrapPlugin = {
      name: 'high-priority',
      priority: 10,
      load: async () => {},
    }

    PluginRegistry.register(plugin1)
    PluginRegistry.register(plugin2)

    const plugins = PluginRegistry.getAll()
    expect(plugins[0].name).toBe('high-priority')
    expect(plugins[1].name).toBe('low-priority')
  })

  it('should get plugin by name', () => {
    const plugin: BootstrapPlugin = {
      name: 'test-plugin',
      load: async () => {},
    }

    PluginRegistry.register(plugin)
    const retrieved = PluginRegistry.get('test-plugin')
    expect(retrieved).toBe(plugin)
  })
})
```

### Testing Loaders

```typescript
// test/unit/event-bus-loader.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { Container } from '@OneJs'
import { EventBusLoader } from '@OneJs/event-bus/loader'

describe('EventBusLoader', () => {
  let container: Container
  let loader: EventBusLoader

  beforeEach(() => {
    container = new Container()
    loader = new EventBusLoader()
  })

  it('should have correct name and priority', () => {
    expect(loader.name).toBe('event-bus-loader')
    expect(loader.priority).toBe(50)
  })

  it('should load without errors when no handlers', async () => {
    await expect(loader.load(container)).resolves.toBeUndefined()
  })

  // Add more specific tests based on your needs
})
```

## Manual Testing Steps

1. **Start a clean app:**
   ```bash
   cd apps/your-app
   bun run dev
   ```

2. **Check logs for plugin loading:**
   ```
   ✅ Look for: "📦 Auto-loading files..."
   ✅ Look for: "🔌 Loading plugins..."
   ✅ Look for: "⚡ Loading plugin: bootstrap-loader"
   ✅ Look for: "⚡ Loading plugin: event-bus-loader"
   ✅ Look for: "⚡ Loading plugin: jobs-loader"
   ✅ Look for: "⚡ Loading plugin: server-loader"
   ✅ Look for: "✅ OneJs initialization complete"
   ```

3. **Test event handlers:**
   - Create an event
   - Publish it
   - Verify handler executes

4. **Test controllers:**
   - Make HTTP request to your controller
   - Verify response

5. **Test worker jobs:**
   - Add a job to queue
   - Verify worker processes it

## Troubleshooting

### Container not found error
```
Error: Container not initialized
```
**Solution:** Ensure `OneJs.start()` is called before accessing any services.

### Plugin not loading
```
Plugin "my-plugin" not found
```
**Solution:** Verify the plugin is registered in the module's index file:
```typescript
import { PluginRegistry } from '../bootstrap'
import { MyLoader } from './loader'
PluginRegistry.register(new MyLoader())
```

### Service not found in container
```
Error: No service registered for type: MyService
```
**Solution:** Ensure the service has `@Injectable()` decorator and is imported somewhere (so AutoLoader can find it).

### Circular dependency
```
Error: Cyclic dependency detected
```
**Solution:** Review your service dependencies. Use `@Optional()` or refactor to break the cycle.

## Performance Testing

Verify the plugin architecture doesn't significantly impact startup time:

```typescript
const startTime = performance.now()

const app = new OneJs(import.meta.url)
await app.start({ rootDir: import.meta.dir })

const endTime = performance.now()
console.log(`Bootstrap took ${endTime - startTime}ms`)

// Should be similar to before refactor (within 10-20ms difference)
```

## Success Criteria

✅ All existing tests pass
✅ No new linter errors introduced
✅ Bootstrap completes successfully
✅ All plugins load in correct order
✅ Event handlers work
✅ Controllers work
✅ Worker jobs work
✅ Services can access container through provider
✅ New custom loaders can be created easily

If all these pass, the refactor is successful! 🎉

