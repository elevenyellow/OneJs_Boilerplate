/**
 * Value Object representing the description of a climbing area.
 * Supports null values for areas without descriptions.
 */
export class AreaDescription {
  private constructor(private readonly value: string | null) {}

  /**
   * Creates an AreaDescription from user input.
   * Accepts null or empty strings, trimming whitespace.
   */
  static create(value: string | null): AreaDescription {
    if (value === null) {
      return new AreaDescription(null)
    }

    const trimmed = value.trim()

    if (trimmed.length === 0) {
      return new AreaDescription(null)
    }

    return new AreaDescription(trimmed)
  }

  /**
   * Creates an AreaDescription from trusted source (e.g., database or API response).
   * Same behavior as create since descriptions are optional.
   */
  static createFrom(value: string | null): AreaDescription {
    return AreaDescription.create(value)
  }

  getValue(): string | null {
    return this.value
  }

  /**
   * Checks if this description is empty (null or empty string).
   */
  isEmpty(): boolean {
    return this.value === null || this.value.length === 0
  }

  toString(): string {
    return this.value ?? ''
  }

  equals(other: AreaDescription): boolean {
    return this.value === other.value
  }

  toDto(): string | null {
    return this.value
  }
}
