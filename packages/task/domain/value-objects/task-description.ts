import { OneJsError, ValueObject, ValueObjectBase } from '@OneJs/core'

@ValueObject()
export class TaskDescription extends ValueObjectBase<string> {
  static readonly MAX_LENGTH = 500

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): TaskDescription {
    const trimmed = (value ?? '').trim()
    if (trimmed.length > TaskDescription.MAX_LENGTH) {
      throw new OneJsError(
        `TaskDescription cannot exceed ${TaskDescription.MAX_LENGTH} characters`,
        400,
        'Invalid task description',
      )
    }
    return new TaskDescription(trimmed)
  }
}
