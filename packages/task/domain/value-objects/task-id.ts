import { OneJsError, ValueObject, ValueObjectBase } from '@OneJs/core'
import { v4 as uuidv4 } from 'uuid'

const UUID_V4_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

@ValueObject()
export class TaskId extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static generateUniqueId(): TaskId {
    return new TaskId(uuidv4())
  }

  static fromString(id: string): TaskId {
    if (!id)
      throw new OneJsError(
        'TaskId cannot be empty',
        400,
        'Invalid task identifier',
      )

    if (!this.isValid(id)) {
      throw new OneJsError(
        `Invalid TaskId format: "${id}" is not a valid UUID v4`,
        400,
        'Invalid task identifier',
      )
    }

    return new TaskId(id)
  }

  private static isValid(id: string): boolean {
    return UUID_V4_REGEX.test(id)
  }
}
