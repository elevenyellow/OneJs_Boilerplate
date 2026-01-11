/**
 * TopoNumber Value Object
 * Represents the number/label of a route on a topo image
 * Examples: "1", "17", "18a", "2bis"
 */
export class TopoNumber {
  private constructor(private readonly value: string) {}

  static create(value: string | number | null | undefined): TopoNumber | null {
    if (value === null || value === undefined || value === '') {
      return null
    }

    const strValue = String(value).trim()
    if (strValue === '') {
      return null
    }

    return new TopoNumber(strValue)
  }

  /**
   * Get the numeric part of the topo number for sorting
   * "17" -> 17, "18a" -> 18, "2bis" -> 2
   */
  getNumericValue(): number {
    const match = this.value.match(/^(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  /**
   * Get the suffix part if any
   * "18a" -> "a", "2bis" -> "bis", "17" -> null
   */
  getSuffix(): string | null {
    const match = this.value.match(/^\d+(.+)$/)
    return match ? match[1] : null
  }

  toString(): string {
    return this.value
  }

  equals(other: TopoNumber | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}
