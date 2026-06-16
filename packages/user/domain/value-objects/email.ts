import { OneJsError, ValueObject, ValueObjectBase } from '@OneJs/core'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

@ValueObject()
export class Email extends ValueObjectBase<string> {
  static readonly MAX_LENGTH = 254

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Email {
    if (!value?.trim())
      throw new OneJsError(
        'Email cannot be empty',
        400,
        'Invalid email address',
      )

    const normalized = value.trim().toLowerCase()

    if (normalized.length > Email.MAX_LENGTH)
      throw new OneJsError(
        `Email cannot exceed ${Email.MAX_LENGTH} characters`,
        400,
        'Invalid email address',
      )

    if (!EMAIL_REGEX.test(normalized))
      throw new OneJsError(
        `"${normalized}" is not a valid email address`,
        400,
        'Invalid email address',
      )

    return new Email(normalized)
  }
}
