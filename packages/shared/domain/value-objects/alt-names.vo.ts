/**
 * AltNames Value Object
 * Represents alternative names for a climbing location
 */
export class AltNames {
  private constructor(private readonly names: string[]) {}

  static create(altNames: unknown): AltNames {
    if (!altNames) {
      return new AltNames([])
    }

    let parsed: string[] = []

    if (Array.isArray(altNames)) {
      parsed = altNames
        .filter((n): n is string => typeof n === 'string')
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
    } else if (typeof altNames === 'string') {
      parsed = altNames
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
    }

    // Remove duplicates
    const unique = [...new Set(parsed)]

    return new AltNames(unique)
  }

  static empty(): AltNames {
    return new AltNames([])
  }

  toArray(): string[] {
    return [...this.names]
  }

  toJSON(): string[] {
    return this.names
  }

  has(name: string): boolean {
    return this.names.some(
      (n) => n.toLowerCase() === name.toLowerCase(),
    )
  }

  isEmpty(): boolean {
    return this.names.length === 0
  }

  get count(): number {
    return this.names.length
  }

  equals(other: AltNames): boolean {
    if (this.names.length !== other.names.length) return false
    return this.names.every((n) => other.has(n))
  }

  toString(): string {
    return this.names.join(', ')
  }
}
