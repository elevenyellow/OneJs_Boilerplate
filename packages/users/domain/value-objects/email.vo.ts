/**
 * Email value object with validation.
 */
export class Email {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static createFrom(email: string): Email {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`)
    }

    return new Email(email.toLowerCase().trim())
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
