export class Seasonality {
  private readonly months: number[]

  private constructor(months: number[]) {
    this.months = months
  }

  static createFrom(months: number[] | null | undefined): Seasonality {
    if (!months) return Seasonality.createEmpty()
    const validMonths = months.filter((m) => m >= 1 && m <= 12)
    return new Seasonality(validMonths)
  }

  static createEmpty(): Seasonality {
    return new Seasonality([])
  }

  getMonths(): number[] {
    return [...this.months]
  }

  hasData(): boolean {
    return this.months.length > 0
  }

  isGoodMonth(month: number): boolean {
    return this.months.includes(month)
  }

  isGoodNow(): boolean {
    const currentMonth = new Date().getMonth() + 1
    return this.isGoodMonth(currentMonth)
  }

  equals(other: Seasonality): boolean {
    return JSON.stringify(this.months.sort()) === JSON.stringify(other.months.sort())
  }

  toString(): string {
    return this.months.join(', ')
  }
}
