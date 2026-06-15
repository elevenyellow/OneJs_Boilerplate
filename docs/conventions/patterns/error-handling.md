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

## No Magic Strings

**Every error type label, error message, and log scope MUST be a named constant — never an inline string literal.**

Each bounded context defines its own constants in `domain/constants/` (see [DDD Principles — No Magic Strings](../architecture/ddd-principles.md#no-magic-strings) for the full pattern).

```typescript
// ✅ Correct — named constants
import { UserErrorTypes, UserErrorMessages } from '../../domain/constants/error-types'
throw new OneJsError(UserErrorTypes.CONFLICT, 409, UserErrorMessages.EMAIL_IN_USE, {}, ErrorCodes.USER_ALREADY_EXISTS)

// ❌ Wrong — magic strings
throw new OneJsError('Conflict', 409, 'Email already in use', {}, ErrorCodes.USER_ALREADY_EXISTS)
```

## Status Code Reference

| Situation | Status | Type label constant | ErrorCode |
|---|---|---|---|
| Invalid input / format | 400 | `UserErrorTypes.VALIDATION_FAILED` | `ErrorCodes.VALIDATION_FAILED` |
| Invalid/expired token | 400 | `UserErrorTypes.BAD_REQUEST` | `ErrorCodes.AUTH_INVALID` |
| Missing/invalid auth | 401 | `UserErrorTypes.UNAUTHORIZED` | `ErrorCodes.AUTH_INVALID` |
| Insufficient permissions | 403 | `UserErrorTypes.FORBIDDEN` | — |
| Resource not found | 404 | `UserErrorTypes.NOT_FOUND` | `ErrorCodes.USER_NOT_FOUND` |
| Duplicate resource | 409 | `UserErrorTypes.CONFLICT` | `ErrorCodes.USER_ALREADY_EXISTS` |

## Usage in Services

```typescript
import { Injectable, Inject, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { UserErrorTypes, UserErrorMessages } from '../../domain/constants/error-types'

@Injectable()
export class UserCreator {
  async run(email: Email, passwordHash: PasswordHash): Promise<User> {
    const existing = await this.repo.findByEmail(email)
    if (existing)
      throw new OneJsError(UserErrorTypes.CONFLICT, 409, UserErrorMessages.EMAIL_IN_USE, {}, ErrorCodes.USER_ALREADY_EXISTS)

    // ...
  }
}
```

## Common Patterns

```typescript
import { UserErrorTypes, UserErrorMessages } from '../../domain/constants/error-types'

// Validation failure
throw new OneJsError(UserErrorTypes.VALIDATION_FAILED, 400, 'Password must be at least 8 characters', {}, ErrorCodes.VALIDATION_FAILED)

// Not found
throw new OneJsError(UserErrorTypes.NOT_FOUND, 404, `User not found: ${userId}`, {}, ErrorCodes.USER_NOT_FOUND)

// Conflict / duplicate
throw new OneJsError(UserErrorTypes.CONFLICT, 409, UserErrorMessages.EMAIL_IN_USE, {}, ErrorCodes.USER_ALREADY_EXISTS)

// Unauthorized
throw new OneJsError(UserErrorTypes.UNAUTHORIZED, 401, 'Invalid credentials', {}, ErrorCodes.AUTH_INVALID)

// Expired token
throw new OneJsError(UserErrorTypes.BAD_REQUEST, 400, 'Invalid or expired reset token', {}, ErrorCodes.AUTH_INVALID)
```

## Errors in Value Objects

VOs also throw `OneJsError` when validation fails in `create()`:

```typescript
import { ValueObject, ValueObjectBase } from '@OneJs/core'
import { UserErrorTypes, UserErrorMessages } from '../../domain/constants/error-types'

@ValueObject()
export class Email extends ValueObjectBase<string> {
  static create(value: string): Email {
    if (!value?.trim())
      throw new OneJsError(UserErrorTypes.VALIDATION_FAILED, 400, UserErrorMessages.EMAIL_REQUIRED, {}, ErrorCodes.VALIDATION_FAILED)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase()))
      throw new OneJsError(UserErrorTypes.VALIDATION_FAILED, 400, `Invalid email format: ${value}`, {}, ErrorCodes.VALIDATION_FAILED)
    return new Email(value.trim().toLowerCase())
  }
}
```

## Rules

- **Always use `OneJsError`** — never `new Error()` or bare `throw`
- **Always include an `ErrorCodes` value** — never omit the fifth argument
- **No magic strings** — every type label, message, and log scope is a named constant per bounded context
- **Never expose infrastructure errors** to callers — catch and rethrow as `OneJsError` if needed
- **Let unexpected errors propagate** — don't catch-and-silence unknown errors
