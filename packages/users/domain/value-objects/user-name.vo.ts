/**
 * User name value object.
 */
export class UserName {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(name: string | null | undefined): UserName {
    if (name === null || name === undefined) {
      return new UserName(null)
    }

    const trimmed = name.trim()
    if (trimmed.length === 0) {
      return new UserName(null)
    }

    if (trimmed.length > 255) {
      throw new Error('User name cannot exceed 255 characters')
    }

    return new UserName(trimmed)
  }

  getValue(): string | null {
    return this.value
  }

  equals(other: UserName): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value ?? ''
  }

  isEmpty(): boolean {
    return this.value === null || this.value.length === 0
  }
}
