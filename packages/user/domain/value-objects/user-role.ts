import { OneJsError, ValueObject, ValueObjectBase } from '@OneJs/core'

const VALID_ROLES = ['user', 'admin', 'staff', 'moderator'] as const
export type UserRoleValue = (typeof VALID_ROLES)[number]

@ValueObject()
export class UserRole extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(value: string): UserRole {
    if (!VALID_ROLES.includes(value as UserRoleValue))
      throw new OneJsError(
        `Invalid role "${value}". Must be one of: ${VALID_ROLES.join(', ')}`,
        400,
        'Invalid user role',
      )

    return new UserRole(value)
  }

  static user(): UserRole {
    return new UserRole('user')
  }

  static admin(): UserRole {
    return new UserRole('admin')
  }

  static staff(): UserRole {
    return new UserRole('staff')
  }
}
