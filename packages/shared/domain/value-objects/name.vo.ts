/**
 * Name Value Object
 * Represents a validated name for entities (Crag, Area, Sector, Route)
 */
export class Name {
  private static readonly MIN_LENGTH = 1
  private static readonly MAX_LENGTH = 500

  private constructor(private readonly value: string) {}

  static create(name: string | null | undefined): Name {
    if (!name || typeof name !== 'string') {
      throw new Error('Name is required and must be a string')
    }

    const trimmed = name.trim()

    if (trimmed.length < Name.MIN_LENGTH) {
      throw new Error('Name cannot be empty')
    }

    if (trimmed.length > Name.MAX_LENGTH) {
      throw new Error(`Name is too long (max ${Name.MAX_LENGTH} characters)`)
    }

    return new Name(trimmed)
  }

  toString(): string {
    return this.value
  }

  equals(other: Name): boolean {
    return this.value === other.value
  }

  get length(): number {
    return this.value.length
  }
}
