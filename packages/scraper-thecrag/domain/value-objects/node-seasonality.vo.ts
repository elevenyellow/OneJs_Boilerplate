/**
 * Value Object representing the seasonality of a climbing area.
 * Contains monthly scores indicating how suitable each month is for climbing.
 * Higher scores indicate better climbing conditions.
 */
export class NodeSeasonality {
  private static readonly MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  private static readonly RECOMMENDED_THRESHOLD_PERCENTILE = 0.7

  private constructor(private readonly monthlyScores: number[]) {}

  /**
   * Creates NodeSeasonality from an array of 12 monthly scores.
   */
  static create(monthlyScores: number[]): NodeSeasonality {
    if (monthlyScores.length !== 12) {
      throw new Error('Monthly scores must contain exactly 12 values')
    }
    return new NodeSeasonality([...monthlyScores])
  }

  /**
   * Returns a copy of the monthly scores array.
   */
  getMonthlyScores(): number[] {
    return [...this.monthlyScores]
  }

  /**
   * Returns the score for a specific month by index (0-11).
   */
  getScoreForMonth(monthIndex: number): number {
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error('Month index must be between 0 and 11')
    }
    return this.monthlyScores[monthIndex]
  }

  /**
   * Returns the score for a specific month by name.
   */
  getScoreForMonthName(monthName: string): number {
    const index = NodeSeasonality.MONTH_NAMES.findIndex(
      (m) => m.toLowerCase() === monthName.toLowerCase(),
    )
    if (index === -1) {
      throw new Error(`Invalid month name: ${monthName}`)
    }
    return this.monthlyScores[index]
  }

  /**
   * Returns the names of the best months for climbing (highest scores).
   * Returns top 3 months by default.
   */
  getBestMonths(count = 3): string[] {
    const indexedScores = this.monthlyScores.map((score, index) => ({
      score,
      index,
    }))
    indexedScores.sort((a, b) => b.score - a.score)

    return indexedScores
      .slice(0, count)
      .map((item) => NodeSeasonality.MONTH_NAMES[item.index])
  }

  /**
   * Returns the names of the worst months for climbing (lowest scores).
   * Returns bottom 3 months by default.
   */
  getWorstMonths(count = 3): string[] {
    const indexedScores = this.monthlyScores.map((score, index) => ({
      score,
      index,
    }))
    indexedScores.sort((a, b) => a.score - b.score)

    return indexedScores
      .slice(0, count)
      .map((item) => NodeSeasonality.MONTH_NAMES[item.index])
  }

  /**
   * Returns true if the given month is recommended for climbing.
   * A month is recommended if its score is above the threshold percentile.
   */
  isRecommendedMonth(monthIndex: number): boolean {
    const maxScore = Math.max(...this.monthlyScores)
    const threshold =
      maxScore * NodeSeasonality.RECOMMENDED_THRESHOLD_PERCENTILE
    return this.monthlyScores[monthIndex] >= threshold
  }

  /**
   * Returns the best month index (0-11).
   */
  getBestMonthIndex(): number {
    let maxIndex = 0
    let maxScore = this.monthlyScores[0]

    for (let i = 1; i < this.monthlyScores.length; i++) {
      if (this.monthlyScores[i] > maxScore) {
        maxScore = this.monthlyScores[i]
        maxIndex = i
      }
    }

    return maxIndex
  }

  /**
   * Returns the best month name.
   */
  getBestMonth(): string {
    return NodeSeasonality.MONTH_NAMES[this.getBestMonthIndex()]
  }

  /**
   * Returns the average score across all months.
   */
  getAverageScore(): number {
    const sum = this.monthlyScores.reduce((acc, score) => acc + score, 0)
    return sum / 12
  }

  equals(other: NodeSeasonality): boolean {
    return this.monthlyScores.every(
      (score, index) => score === other.monthlyScores[index],
    )
  }

  toString(): string {
    return `Seasonality(best: ${this.getBestMonth()}, avg: ${this.getAverageScore().toFixed(1)})`
  }
}
