import { OneJsError, ValueObject, ValueObjectBase } from '@OneJs/core'

@ValueObject()
export class TaskTitle extends ValueObjectBase<string> {
  static readonly MAX_LENGTH = 100

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): TaskTitle {
    if (!value?.trim()) {
      throw new OneJsError(
        'TaskTitle cannot be empty',
        400,
        'Invalid task title',
      )
    }
    if (value.trim().length > TaskTitle.MAX_LENGTH) {
      throw new OneJsError(
        `TaskTitle cannot exceed ${TaskTitle.MAX_LENGTH} characters`,
        400,
        'Invalid task title',
      )
    }
    return new TaskTitle(value.trim())
  }
}
