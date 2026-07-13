import { OneJsError, ValueObject, ValueObjectBase } from '@OneJs/core'

const UUID_V4_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

@ValueObject()
export class ResetToken extends ValueObjectBase<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ResetToken {
    if (!value?.trim())
      throw new OneJsError(
        'ResetToken cannot be empty',
        400,
        'Invalid reset token',
      )

    if (!UUID_V4_REGEX.test(value))
      throw new OneJsError(
        `"${value}" is not a valid reset token`,
        400,
        'Invalid reset token',
      )

    return new ResetToken(value)
  }
}
