# Authentication & Security

OneJs provides built-in mechanisms for securing your API endpoints using JWT or external providers like Clerk.

## Authentication Strategies

You can configure different authentication strategies in the `CorePlugin`.

### Local JWT Strategy
The default strategy uses JSON Web Tokens (JWT) for authentication.

```typescript
// .oneJs/core/src/auth/strategies/local-jwt.strategy.ts
```

### Clerk Strategy
OneJs also supports [Clerk](https://clerk.com/) for modern authentication and user management.

## Securing Routes

Use decorators to protect your API endpoints.

### `@AuthMiddleware`
The `@AuthMiddleware` decorator ensures that the request is authenticated.

```typescript
import { Controller, Get } from '@OneJs/server'
import { AuthMiddleware } from '@OneJs/core'

@Controller('/profile')
@AuthMiddleware() // Protects all routes in this controller
export class ProfileController {
  @Get('/')
  async getProfile(request: Request, response: Response) {
    const user = request.user // Populated by the auth middleware
    return response.json(user)
  }
}
```

### `@Roles`
You can further restrict access based on user roles.

```typescript
import { Controller, Post } from '@OneJs/server'
import { AuthMiddleware, Roles } from '@OneJs/core'

@Controller('/admin')
@AuthMiddleware()
export class AdminController {
  @Post('/settings')
  @Roles('admin', 'super-admin')
  async updateSettings(request: Request, response: Response) {
    // Only accessible by admins
  }
}
```

## Security Best Practices

-   **Environment Variables**: Store secrets like `JWT_SECRET` and `CLERK_API_KEY` in your `.env` file. Never commit these secrets.
-   **CORS**: Configure Cross-Origin Resource Sharing in your server setup:
    ```typescript
    server.use(cors({ origin: 'https://your-frontend.com' }))
    ```

