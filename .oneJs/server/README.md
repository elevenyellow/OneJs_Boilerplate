# @OneJs/server

HTTP server plugin for OneJs framework with Elysia integration.

## Installation

```bash
npm install @OneJs/server
```

## Features

- **Elysia Integration**: Fast HTTP server built on Elysia
- **Controller Decorators**: `@Controller`, `@Get`, `@Post`, etc.
- **Middleware Support**: Built-in error handling and response middleware
- **Type Safety**: Full TypeScript support with request/response types

## Usage

### Basic Setup

```typescript
import { OneJs, PluginRegistry } from '@OneJs/core'
import { ServerPlugin } from '@OneJs/server'

PluginRegistry.register(new ServerPlugin())

const oneJs = new OneJs(import.meta.url)
await oneJs.start()
```

### Creating Controllers

```typescript
import { Controller, Get, Post, Inject } from '@OneJs/server'
import { Injectable } from '@OneJs/core'

@Controller('/users')
@Injectable()
export class UserController {
  constructor(@Inject(UserService) private userService: UserService) {}

  @Get('/')
  async getUsers(request: Request, response: Response) {
    const users = await this.userService.findAll()
    return response.json(users)
  }

  @Post('/')
  async createUser(request: Request, response: Response) {
    const user = await this.userService.create(request.body)
    return response.status(201).json(user)
  }
}
```

### Server Configuration

```typescript
import { Server } from '@OneJs/server'
import { ContainerProvider } from '@OneJs/core'

const container = ContainerProvider.getContainer()
const server = container.get(Server)

server
  .use(cors())
  .setPrefix('/api')
  .start(3000)
```

## Decorators

- `@Controller(path)` - Define controller base path
- `@Get(path)` - HTTP GET endpoint
- `@Post(path)` - HTTP POST endpoint
- `@Put(path)` - HTTP PUT endpoint
- `@Patch(path)` - HTTP PATCH endpoint
- `@Delete(path)` - HTTP DELETE endpoint

## Middleware

Built-in middleware for error handling and response formatting.
