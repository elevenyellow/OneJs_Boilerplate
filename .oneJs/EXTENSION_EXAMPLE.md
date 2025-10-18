# Extension Example: Creating NPM Plugins for OneJs

This example demonstrates how to create and publish npm packages that extend OneJs functionality using the new extensible plugin system.

## Overview

The OneJs plugin system allows you to create independent npm packages that can be installed and used by any OneJs application. This enables a modular ecosystem where features can be developed, versioned, and distributed separately.

## Creating a Cache Plugin Package

Let's create a complete cache plugin that can be published as `@oneJs/cache-plugin`.

### Package Structure

```
@oneJs/cache-plugin/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # Main exports
│   ├── cache.service.ts         # Cache service with @Injectable
│   ├── cache-plugin.ts          # Plugin loader
│   └── types.ts                 # Public types
├── dist/                        # Compiled output
└── README.md
```

### Step 1: Package Configuration

**`package.json`**
```json
{
  "name": "@oneJs/cache-plugin",
  "version": "1.0.0",
  "description": "In-memory cache plugin for OneJs",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "@OneJs": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "files": [
    "dist/**/*",
    "README.md"
  ]
}
```

### Step 2: Cache Service Implementation

**`src/cache.service.ts`**
```typescript
import { Injectable, Logger, Inject } from '@OneJs'

export interface CacheOptions {
  defaultTtl?: number
  maxSize?: number
}

@Injectable()
export class CacheService {
  private store = new Map<string, { value: any; expires?: number }>()
  private maxSize: number
  private defaultTtl: number

  constructor(
    @Inject(Logger) private logger: Logger,
    private options: CacheOptions = {}
  ) {
    this.maxSize = options.maxSize ?? 1000
    this.defaultTtl = options.defaultTtl ?? 3600000 // 1 hour
    this.logger.info('🗄️ CacheService initialized')
  }

  set(key: string, value: any, ttl?: number): void {
    // Remove oldest entries if at capacity
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value
      this.store.delete(firstKey)
    }

    const expires = ttl ? Date.now() + ttl : undefined
    this.store.set(key, { value, expires })
    this.logger.debug(`Cache set: ${key}`)
  }

  get(key: string): any {
    const item = this.store.get(key)
    if (!item) return undefined

    // Check expiration
    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key)
      return undefined
    }

    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
    this.logger.info('Cache cleared')
  }

  size(): number {
    return this.store.size
  }

  keys(): string[] {
    return Array.from(this.store.keys())
  }
}
```

### Step 3: Plugin Loader

**`src/cache-plugin.ts`**
```typescript
import type { BootstrapPlugin, Container } from '@OneJs'
import { metadataRegistry } from '@OneJs'
import { CacheService } from './cache.service'

export interface CachePluginOptions {
  defaultTtl?: number
  maxSize?: number
}

export class CachePlugin implements BootstrapPlugin {
  name = 'cache-plugin'
  priority = 20 // Load early

  constructor(private options: CachePluginOptions = {}) {}

  // PHASE 1: Register services in the container
  register(container: Container): void {
    // Get metadata from @Injectable decorator
    const metadata = metadataRegistry.getMetadata(CacheService)
    if (metadata) {
      container.register(
        CacheService,
        metadata.scope,
        false,
        metadata.params
      )
      console.log('✅ CacheService registered in container')
    } else {
      // Fallback: manual registration
      container.registerClass(CacheService, { scope: 'singleton' })
      console.log('✅ CacheService registered manually')
    }
  }

  // PHASE 2: Initialize the plugin
  load(container: Container): void {
    const cache = container.get(CacheService)
    
    // Plugin initialization logic
    if (this.options.defaultTtl) {
      cache.set('plugin_initialized', true, this.options.defaultTtl)
    }
    
    console.log('✅ CachePlugin loaded and ready')
  }
}
```

### Step 4: Public Types

**`src/types.ts`**
```typescript
export interface CacheOptions {
  defaultTtl?: number
  maxSize?: number
}

export interface CachePluginOptions {
  defaultTtl?: number
  maxSize?: number
}
```

### Step 5: Main Exports

**`src/index.ts`**
```typescript
// Export the plugin class
export { CachePlugin } from './cache-plugin'

// Export the service
export { CacheService } from './cache.service'

// Export types
export type { CacheOptions, CachePluginOptions } from './types'
```

### Step 6: TypeScript Configuration

**`tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Using the Plugin in an Application

### Installation

```bash
npm install @oneJs/cache-plugin
```

### Registration

**`apps/api/index.ts`**
```typescript
import { OneJs, PluginRegistry } from '@OneJs'
import { CachePlugin } from '@oneJs/cache-plugin'

// Register the cache plugin
PluginRegistry.register(new CachePlugin({
  defaultTtl: 300000, // 5 minutes
  maxSize: 500
}))

const oneJs = new OneJs(import.meta.url)
await oneJs.start()
```

### Usage in Services

**`packages/user/user.service.ts`**
```typescript
import { Injectable, Inject, Logger } from '@OneJs'
import { CacheService } from '@oneJs/cache-plugin'

@Injectable()
export class UserService {
  constructor(
    @Inject(CacheService) private cache: CacheService,
    @Inject(Logger) private logger: Logger
  ) {}

  async getUser(id: string) {
    const cacheKey = `user:${id}`
    
    // Try cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      this.logger.debug(`User ${id} found in cache`)
      return cached
    }

    // Fetch from database
    this.logger.debug(`Fetching user ${id} from database`)
    const user = await this.fetchUserFromDatabase(id)
    
    // Cache the result
    this.cache.set(cacheKey, user, 300000) // 5 minutes
    
    return user
  }

  async updateUser(id: string, data: any) {
    const user = await this.updateUserInDatabase(id, data)
    
    // Update cache
    this.cache.set(`user:${id}`, user, 300000)
    
    return user
  }

  async deleteUser(id: string) {
    await this.deleteUserFromDatabase(id)
    
    // Remove from cache
    this.cache.delete(`user:${id}`)
  }

  private async fetchUserFromDatabase(id: string) {
    // Database logic here
    return { id, name: `User ${id}`, email: `user${id}@example.com` }
  }

  private async updateUserInDatabase(id: string, data: any) {
    // Database update logic here
    return { id, ...data }
  }

  private async deleteUserFromDatabase(id: string) {
    // Database delete logic here
  }
}
```

## Advanced Plugin Example: Database Plugin

Here's a more complex example showing how to create a database plugin with multiple services:

**`src/database-plugin.ts`**
```typescript
import type { BootstrapPlugin, Container } from '@OneJs'
import { metadataRegistry } from '@OneJs'
import { DatabaseService } from './database.service'
import { MigrationService } from './migration.service'
import { QueryBuilder } from './query-builder.service'

export class DatabasePlugin implements BootstrapPlugin {
  name = 'database-plugin'
  priority = 10 // Load very early

  constructor(private config: DatabaseConfig) {}

  register(container: Container): void {
    // Register all database-related services
    const services = [DatabaseService, MigrationService, QueryBuilder]
    
    for (const ServiceClass of services) {
      const metadata = metadataRegistry.getMetadata(ServiceClass)
      if (metadata) {
        container.register(
          ServiceClass,
          metadata.scope,
          false,
          metadata.params
        )
      }
    }
  }

  async load(container: Container): Promise<void> {
    const database = container.get(DatabaseService)
    const migrations = container.get(MigrationService)
    
    // Initialize database connection
    await database.connect(this.config)
    
    // Run migrations
    await migrations.run()
    
    console.log('✅ Database plugin loaded')
  }
}
```

## Plugin Ecosystem Ideas

With this architecture, you can create plugins for:

- **`@oneJs/cache-plugin`** - In-memory/Redis caching
- **`@oneJs/auth-plugin`** - JWT, OAuth, session management
- **`@oneJs/mailer-plugin`** - Email templates and sending
- **`@oneJs/graphql-plugin`** - GraphQL schema and resolvers
- **`@oneJs/websocket-plugin`** - WebSocket rooms and real-time features
- **`@oneJs/monitoring-plugin`** - Prometheus metrics and health checks
- **`@oneJs/storage-plugin`** - File storage abstraction (S3, local, etc.)
- **`@oneJs/queue-plugin`** - Background job processing
- **`@oneJs/validation-plugin`** - Request validation and sanitization
- **`@oneJs/rate-limit-plugin`** - API rate limiting

## Publishing Your Plugin

1. **Build the plugin:**
   ```bash
   npm run build
   ```

2. **Test locally:**
   ```bash
   npm pack
   # Install in a test project
   npm install ./oneJs-cache-plugin-1.0.0.tgz
   ```

3. **Publish to npm:**
   ```bash
   npm publish
   ```

## Benefits of This Architecture

### For Plugin Developers
- **Independent Development**: Develop and test plugins in isolation
- **Version Control**: Each plugin can evolve independently
- **Reusability**: Plugins can be used across multiple projects
- **Type Safety**: Full TypeScript support with proper types

### For Application Developers
- **Modularity**: Choose only the features you need
- **Easy Integration**: Simple registration and automatic DI
- **Community Ecosystem**: Access to plugins from the community
- **Maintainability**: Clear separation of concerns

### For the OneJs Framework
- **Ecosystem Growth**: Community-driven feature development
- **Core Focus**: Framework can focus on core functionality
- **Extensibility**: Framework becomes a platform for innovation
- **Adoption**: Rich ecosystem attracts more users

## Best Practices

1. **Use Semantic Versioning**: Follow semver for plugin versions
2. **Document Dependencies**: Clearly specify OneJs version requirements
3. **Provide Types**: Always include TypeScript definitions
4. **Handle Errors Gracefully**: Plugins should not crash the application
5. **Test Thoroughly**: Include unit tests and integration tests
6. **Follow Naming Conventions**: Use `@oneJs/` prefix for official plugins

This extensible plugin system transforms OneJs into a platform where the community can contribute features, creating a rich ecosystem of reusable components.