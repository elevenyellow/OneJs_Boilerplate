# Routing & Controllers

OneJs provides a declarative way to define your API endpoints using decorators. This approach keeps your controllers clean and highly readable.

## Defining a Controller

Use the `@Controller` decorator to define a new API group.

```typescript
import { Controller, Get, Post } from '@OneJs/server'

@Controller('/users')
export class UserController {
  @Get('/')
  async listUsers(request: Request, response: Response) {
    return response.json([{ name: 'John Doe' }])
  }

  @Post('/')
  async createUser(request: Request, response: Response) {
    const data = request.body
    return response.status(201).json({ success: true, data })
  }
}
```

## HTTP Methods

The following decorators are available for defining routes:
- `@Get(path)`
- `@Post(path)`
- `@Put(path)`
- `@Delete(path)`
- `@Patch(path)`

## Request & Response

Each route handler receives two primary arguments:
1.  **Request**: An object containing the request data (body, params, query, headers).
2.  **Response**: A utility object for sending the response back to the client.

```typescript
@Get('/:id')
async getUser(request: Request, response: Response) {
  const { id } = request.params
  const user = await this.service.findById(id)
  
  if (!user) {
    return response.status(404).json({ error: 'Not Found' })
  }
  
  return response.json(user)
}
```

## Middleware

You can apply middleware to specific routes or entire controllers using the `@Use` decorator.

```typescript
import { Controller, Get, Use } from '@OneJs/server'
import { myMiddleware } from './middleware'

@Controller('/secure')
@Use(myMiddleware) // Applied to all routes in this controller
export class SecureController {
  @Get('/data')
  @Use(anotherMiddleware) // Applied only to this route
  async getData(request: Request, response: Response) {
    return response.json({ secret: 'shhh' })
  }
}
```

## Global Prefix

You can set a global prefix for all your API routes during server initialization:

```typescript
const server = container.get(Server)
server.setPrefix('/api/v1')
```

