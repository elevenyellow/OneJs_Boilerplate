/**
 * Warnings Value Object
 * Represents route warnings/hazards
 */
export class Warnings {
  private constructor(private readonly values: string[]) {}

  static create(warnings: unknown): Warnings {
    if (!warnings) {
      return new Warnings([])
    }

    if (Array.isArray(warnings)) {
      const validated = warnings
        .filter((w): w is string => typeof w === 'string')
        .map((w) => w.trim())
        .filter((w) => w.length > 0)

      return new Warnings(validated)
    }

    if (typeof warnings === 'string') {
      const parsed = warnings
        .split(',')
        .map((w) => w.trim())
        .filter((w) => w.length > 0)

      return new Warnings(parsed)
    }

    return new Warnings([])
  }

  static empty(): Warnings {
    return new Warnings([])
  }

  toArray(): string[] {
    return [...this.values]
  }

  toJSON(): string[] {
    return this.values
  }

  hasWarnings(): boolean {
    return this.values.length > 0
  }

  has(warning: string): boolean {
    const lower = warning.toLowerCase()
    return this.values.some((w) => w.toLowerCase().includes(lower))
  }

  get count(): number {
    return this.values.length
  }

  equals(other: Warnings): boolean {
    if (this.values.length !== other.values.length) return false
    return this.values.every((v) => other.values.includes(v))
  }
}
