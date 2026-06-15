# Error Handling

This document describes the error system used across the monorepo with the **OneJs framework**.

## Overview

All domain errors use `OneJsError` from `@OneJs/core`. It carries a type label, HTTP status code, message, optional details, and an `ErrorCodes` enum value.

## Import

```typescript
import { OneJsError, ErrorCodes } from '@OneJs/core'
```

## OneJsError Signature

```typescript
new OneJsError(
  type: string,        // Human-readable type label
  statusCode: number,  // HTTP status code
  message: string,     // Human-readable message
  details: object,     // Extra context (empty object if none)
  errorCode: ErrorCodes
)
```

## Status Code Reference

| Situation | Status | Type label | ErrorCode |
|---|---|---|---|
| Invalid input / format | 400 | `'Validation failed'` | `ErrorCodes.VALIDATION_FAILED` |
| Invalid/expired token | 400 | `'Bad Request'` | `ErrorCodes.AUTH_INVALID` |
| Missing/invalid auth | 401 | `'Unauthorized'` | `ErrorCodes.AUTH_INVALID` |
| Insufficient permissions | 403 | `'Forbidden'` | — |
| Resource not found | 404 | `'Not Found'` | `ErrorCodes.USER_NOT_FOUND` |
| Duplicate resource | 409 | `'Conflict'` | `ErrorCodes.USER_ALREADY_EXISTS` |

## Usage in Services

```typescript
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'

@Injectable()
export class UserCreator {
  async run(email: Email, passwordHash: PasswordHash): Promise<User> {
    const existing = await this.repo.findByEmail(email)
    if (existing)
      throw new OneJsError('Conflict', 409, 'Email already in use', {}, ErrorCodes.USER_ALREADY_EXISTS)

    // ...
  }
}
```

## Common Patterns

```typescript
// Validation failure
throw new OneJsError('Validation failed', 400, 'Password must be at least 8 characters', {}, ErrorCodes.VALIDATION_FAILED)

// Not found
throw new OneJsError('Not Found', 404, `User not found: ${userId}`, {}, ErrorCodes.USER_NOT_FOUND)

// Conflict / duplicate
throw new OneJsError('Conflict', 409, 'Email already in use', {}, ErrorCodes.USER_ALREADY_EXISTS)

// Unauthorized
throw new OneJsError('Unauthorized', 401, 'Invalid credentials', {}, ErrorCodes.AUTH_INVALID)

// Expired token
throw new OneJsError('Bad Request', 400, 'Invalid or expired reset token', {}, ErrorCodes.AUTH_INVALID)
```

## Errors in Value Objects

VOs also throw `OneJsError` when validation fails in `create()`:

```typescript
@ValueObject()
export class Email extends ValueObjectBase<string> {
  static create(value: string): Email {
    if (!value?.trim())
      throw new OneJsError('Validation failed', 400, 'Email is required', {}, ErrorCodes.VALIDATION_FAILED)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase()))
      throw new OneJsError('Validation failed', 400, `Invalid email format: ${value}`, {}, ErrorCodes.VALIDATION_FAILED)
    return new Email(value.trim().toLowerCase())
  }
}
```

## Rules

- **Always use `OneJsError`** — never `new Error()` or bare `throw`
- **Always include an `ErrorCodes` value** — never omit the fifth argument
- **Never expose infrastructure errors** to callers — catch and rethrow as `OneJsError` if needed
- **Let unexpected errors propagate** — don't catch-and-silence unknown errors
