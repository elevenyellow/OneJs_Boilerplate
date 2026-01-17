/**
 * Seasonality Value Object
 *
 * Data Structure from theCrag API
 * ===============================
 *
 * theCrag returns seasonality as an array of 12 scores (one per month):
 *
 * Example: [85, 90, 80, 65, 45, 30, 25, 28, 40, 60, 75, 88]
 * Index:    0   1   2   3   4   5   6   7   8   9  10  11
 * Month:   Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
 *
 * Value: Score indicating climbing quality for that month (higher = better)
 *
 * This value object stores the raw array as-is without filtering.
 * Good months are calculated dynamically based on the data's min/max range.
 */

export class Seasonality {
  private readonly data: number[]

  private constructor(data: number[]) {
    this.data = data
  }

  /**
   * Creates Seasonality from raw array data.
   * Stores the array as-is without filtering to preserve theCrag's format.
   */
  static createFrom(data: number[] | null | undefined): Seasonality {
    if (!data || data.length === 0) return Seasonality.createEmpty()
    return new Seasonality([...data])
  }

  static createEmpty(): Seasonality {
    return new Seasonality([])
  }

  /**
   * Returns the raw seasonality data array.
   * For theCrag data, this is an array of 12 scores indexed by month (0-11).
   */
  getMonths(): number[] {
    return [...this.data]
  }

  hasData(): boolean {
    return this.data.length > 0
  }

  /**
   * Detects if the data is in score format (12 elements with values > 12)
   */
  isScoreFormat(): boolean {
    return this.data.length === 12 && this.data.some((v) => v > 12)
  }

  /**
   * Calculate the threshold for "good" months based on the data range.
   * Uses the midpoint between min and max scores.
   */
  private getGoodThreshold(): number {
    if (this.data.length === 0) return 0
    const min = Math.min(...this.data)
    const max = Math.max(...this.data)
    // Threshold at 50% of the range between min and max
    return min + (max - min) * 0.5
  }

  /**
   * Check if a specific month is good for climbing.
   * Handles both formats:
   * - Score format (12 elements): checks if score >= dynamic threshold (midpoint of min/max)
   * - Month format (legacy): checks if month is in array
   *
   * @param month Month number (1-12)
   */
  isGoodMonth(month: number): boolean {
    if (this.isScoreFormat()) {
      const monthIndex = month - 1
      if (monthIndex < 0 || monthIndex >= 12) return false
      return this.data[monthIndex] >= this.getGoodThreshold()
    }
    // Legacy format: array contains month numbers
    return this.data.includes(month)
  }

  /**
   * Check if current month is good for climbing
   */
  isGoodNow(): boolean {
    const currentMonth = new Date().getMonth() + 1 // 1-12
    return this.isGoodMonth(currentMonth)
  }

  /**
   * Get the score for a specific month (only for score format)
   * @param month Month number (1-12)
   * @returns Score or null if not in score format
   */
  getMonthScore(month: number): number | null {
    if (!this.isScoreFormat()) return null
    const monthIndex = month - 1
    if (monthIndex < 0 || monthIndex >= 12) return null
    return this.data[monthIndex]
  }

  /**
   * Get months with good scores (above threshold) for score format,
   * or the stored months for legacy format.
   * @returns Array of month numbers (1-12)
   */
  getGoodMonths(): number[] {
    if (this.isScoreFormat()) {
      const threshold = this.getGoodThreshold()
      return this.data
        .map((score, index) => (score >= threshold ? index + 1 : null))
        .filter((month): month is number => month !== null)
    }
    // Legacy format: filter valid months
    return this.data.filter((m) => m >= 1 && m <= 12)
  }

  equals(other: Seasonality): boolean {
    if (this.data.length !== other.data.length) return false
    return this.data.every((val, idx) => val === other.data[idx])
  }

  toString(): string {
    if (this.data.length === 0) return ''
    const goodMonths = this.getGoodMonths()
    return goodMonths.join(', ')
  }
}
