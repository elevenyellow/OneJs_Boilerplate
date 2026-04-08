import { OneJsError, ValueObject, ValueObjectBase } from '@OneJs/core'

@ValueObject()
export class PasswordHash extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(hash: string): PasswordHash {
    if (!hash?.trim())
      throw new OneJsError('PasswordHash cannot be empty', 400, 'Invalid password hash')

    return new PasswordHash(hash)
  }
}
