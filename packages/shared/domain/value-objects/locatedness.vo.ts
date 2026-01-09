/**
 * Locatedness Value Object
 * Represents how accurately located a climbing area is (0-100)
 * 0 = No location data, 100 = Highly accurate GPS coordinates
 */
export class Locatedness {
  private constructor(private readonly value: number) {}

  static create(locatedness: unknown): Locatedness | null {
    if (locatedness === null || locatedness === undefined) {
      return null
    }

    const parsed = Number(locatedness)
    
    if (isNaN(parsed)) {
      return null
    }

    // Clamp between 0 and 100
    const clamped = Math.max(0, Math.min(100, Math.round(parsed)))

    return new Locatedness(clamped)
  }

  toNumber(): number {
    return this.value
  }

  toJSON(): number {
    return this.value
  }

  toString(): string {
    return this.value.toString()
  }

  equals(other: Locatedness): boolean {
    return this.value === other.value
  }

  /**
   * Returns true if location is highly accurate (>=80)
   */
  isHighlyAccurate(): boolean {
    return this.value >= 80
  }

  /**
   * Returns true if location is reasonably accurate (>=50)
   */
  isReasonablyAccurate(): boolean {
    return this.value >= 50
  }

  /**
   * Returns true if location data is poor (<50)
   */
  isPoorQuality(): boolean {
    return this.value < 50
  }

  /**
   * Returns accuracy level as a string
   */
  getAccuracyLevel(): 'High' | 'Medium' | 'Low' | 'None' {
    if (this.value >= 80) return 'High'
    if (this.value >= 50) return 'Medium'
    if (this.value > 0) return 'Low'
    return 'None'
  }
}
