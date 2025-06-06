# Auth Package

A lightweight authentication middleware package for Express.js applications that provides JWT-based authentication.

## Installation

```bash
npm install @your-scope/auth
# or
yarn add @your-scope/auth
# or
bun add @your-scope/auth
```

## Features

- JWT-based authentication
- Express middleware integration
- Decorator-based middleware application
- TypeScript support

## Usage

### Basic Setup

1. Set up your JWT secret in your environment variables:

```env
JWT_SECRET=your-secret-key
```

2. Import and use the auth middleware in your application:

```typescript
import { AuthMiddleware, UseMiddleware } from '@your-scope/auth'

// Apply to a class
@UseMiddleware(AuthMiddleware)
class UserController {
  // Your controller methods
}

// Or apply to a specific method
class UserController {
  @UseMiddleware(AuthMiddleware)
  async protectedRoute() {
    // This route is now protected
  }
}
```

### How it Works

The `AuthMiddleware` checks for a valid JWT token in the `Authorization` header of incoming requests. The token should be in the format:

```
Authorization: Bearer your-jwt-token
```

If the token is valid, the decoded user information will be available in `req.user`. If the token is invalid or missing, the middleware will return a 401 Unauthorized response.

### Error Handling

The middleware handles two main error cases:
- Missing or malformed Authorization header
- Invalid JWT token

In both cases, it returns a 401 status code with an appropriate error message.

## TypeScript Support

The package is written in TypeScript and includes type definitions. The decoded user information is automatically typed and available in your request object.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 