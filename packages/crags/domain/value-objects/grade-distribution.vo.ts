export class GradeDistribution {
  private readonly gbRoutes: number[]

  private constructor(gbRoutes: number[]) {
    this.gbRoutes = gbRoutes
  }

  static createFrom(gbRoutes: number[] | null | undefined): GradeDistribution {
    return new GradeDistribution(gbRoutes || [])
  }

  static createEmpty(): GradeDistribution {
    return new GradeDistribution([])
  }

  getGbRoutes(): number[] {
    return [...this.gbRoutes]
  }

  getRoutesByBand(band: number): number {
    return this.gbRoutes[band] ?? 0
  }

  getTotalRoutes(): number {
    return this.gbRoutes.reduce((sum, count) => sum + count, 0)
  }

  getMostPopularBand(): number | null {
    if (this.gbRoutes.length === 0) return null
    let maxIndex = 0
    let maxValue = this.gbRoutes[0]
    for (let i = 1; i < this.gbRoutes.length; i++) {
      if (this.gbRoutes[i] > maxValue) {
        maxValue = this.gbRoutes[i]
        maxIndex = i
      }
    }
    return maxIndex
  }

  /**
   * Get the minimum grade band index with routes
   * Returns the first index with count > 0
   */
  getMinGradeBand(): number | null {
    for (let i = 0; i < this.gbRoutes.length; i++) {
      if (this.gbRoutes[i] > 0) {
        return i
      }
    }
    return null
  }

  /**
   * Get the maximum grade band index with routes
   * Returns the last index with count > 0
   */
  getMaxGradeBand(): number | null {
    for (let i = this.gbRoutes.length - 1; i >= 0; i--) {
      if (this.gbRoutes[i] > 0) {
        return i
      }
    }
    return null
  }

  hasData(): boolean {
    return this.gbRoutes.length > 0
  }

  equals(other: GradeDistribution): boolean {
    return JSON.stringify(this.gbRoutes) === JSON.stringify(other.gbRoutes)
  }

  toString(): string {
    return `Routes by band: [${this.gbRoutes.join(', ')}]`
  }
}
