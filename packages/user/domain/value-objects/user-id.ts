import { OneJsError, ValueObject, ValueObjectBase } from '@OneJs/core'
import { v4 as uuidv4 } from 'uuid'

const UUID_V4_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

@ValueObject()
export class UserId extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static generateUniqueId(): UserId {
    return new UserId(uuidv4())
  }

  static fromString(id: string): UserId {
    if (!id)
      throw new OneJsError('UserId cannot be empty', 400, 'Invalid user identifier')

    if (!this.isValid(id))
      throw new OneJsError(
        `Invalid UserId format: "${id}" is not a valid UUID v4`,
        400,
        'Invalid user identifier',
      )

    return new UserId(id)
  }

  private static isValid(id: string): boolean {
    return UUID_V4_REGEX.test(id)
  }
}
