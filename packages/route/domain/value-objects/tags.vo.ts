/**
 * Tags Value Object
 * Represents route tags/labels
 */
export class Tags {
  private constructor(private readonly values: string[]) {}

  static create(tags: unknown): Tags {
    if (!tags) {
      return new Tags([])
    }

    if (Array.isArray(tags)) {
      const validated = tags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      return new Tags(validated)
    }

    if (typeof tags === 'string') {
      const parsed = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      return new Tags(parsed)
    }

    return new Tags([])
  }

  static empty(): Tags {
    return new Tags([])
  }

  toArray(): string[] {
    return [...this.values]
  }

  toJSON(): string[] {
    return this.values
  }

  has(tag: string): boolean {
    return this.values.includes(tag.toLowerCase())
  }

  isEmpty(): boolean {
    return this.values.length === 0
  }

  get count(): number {
    return this.values.length
  }

  equals(other: Tags): boolean {
    if (this.values.length !== other.values.length) return false
    return this.values.every((v) => other.values.includes(v))
  }
}
