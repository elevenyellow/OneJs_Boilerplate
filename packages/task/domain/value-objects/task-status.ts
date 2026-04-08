import { ValueObject, ValueObjectBase } from '@OneJs/core'

@ValueObject()
export class TaskStatus extends ValueObjectBase<boolean> {
  private constructor(value: boolean) {
    super(value)
  }

  static pending(): TaskStatus {
    return new TaskStatus(false)
  }

  static done(): TaskStatus {
    return new TaskStatus(true)
  }

  static from(value: boolean): TaskStatus {
    return new TaskStatus(value)
  }
}
