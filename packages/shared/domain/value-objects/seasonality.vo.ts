/**
 * Seasonality Value Object
 * Represents climbing conditions by month (12 values, higher = better)
 */
export class Seasonality {
  private static readonly MONTHS = 12

  private constructor(private readonly values: number[]) {}

  static create(data: unknown): Seasonality {
    if (!data || !Array.isArray(data)) {
      return new Seasonality([])
    }

    const validated = data
      .slice(0, Seasonality.MONTHS)
      .map((val) => (typeof val === 'number' && !isNaN(val) ? val : 0))

    // Pad to 12 months if needed
    while (validated.length < Seasonality.MONTHS) {
      validated.push(0)
    }

    return new Seasonality(validated)
  }

  static empty(): Seasonality {
    return new Seasonality([])
  }

  /**
   * Get the best months for climbing (top 4)
   */
  getBestMonths(): number[] {
    if (this.values.length < Seasonality.MONTHS) return []

    const monthsWithScore = this.values
      .map((score, index) => ({ month: index + 1, score }))
      .sort((a, b) => b.score - a.score)

    return monthsWithScore.slice(0, 4).map((m) => m.month)
  }

  /**
   * Check if a given month is good for climbing
   */
  isGoodMonth(month: number): boolean {
    if (month < 1 || month > 12) return false
    if (this.values.length < Seasonality.MONTHS) return true

    const score = this.values[month - 1]
    const avgScore = this.values.reduce((a, b) => a + b, 0) / Seasonality.MONTHS

    return score >= avgScore
  }

  /**
   * Get score for a specific month (1-12)
   */
  getScore(month: number): number {
    if (month < 1 || month > 12) return 0
    return this.values[month - 1] ?? 0
  }

  toArray(): number[] {
    return [...this.values]
  }

  isEmpty(): boolean {
    return this.values.length === 0
  }

  equals(other: Seasonality): boolean {
    if (this.values.length !== other.values.length) return false
    return this.values.every((val, i) => val === other.values[i])
  }
}
