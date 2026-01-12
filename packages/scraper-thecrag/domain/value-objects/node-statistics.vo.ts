/**
 * Value Object representing statistics for a TheCrag node (area, crag, sector).
 * Contains counts for routes, ascents, photos, favorites, and kudos.
 */
export class NodeStatistics {
  private constructor(
    private readonly routes: number,
    private readonly ascents: number,
    private readonly photos: number,
    private readonly favorites: number,
    private readonly kudos: number,
  ) {}

  /**
   * Creates NodeStatistics with all counts.
   */
  static create(
    routes: number,
    ascents: number,
    photos: number,
    favorites: number,
    kudos: number,
  ): NodeStatistics {
    return new NodeStatistics(routes, ascents, photos, favorites, kudos)
  }

  getRoutes(): number {
    return this.routes
  }

  getAscents(): number {
    return this.ascents
  }

  getPhotos(): number {
    return this.photos
  }

  getFavorites(): number {
    return this.favorites
  }

  getKudos(): number {
    return this.kudos
  }

  /**
   * Calculates a popularity score based on combined metrics.
   * Higher scores indicate more popular areas.
   */
  getPopularityScore(): number {
    // Weight different metrics to calculate an overall popularity score
    const routeWeight = 1
    const ascentWeight = 0.1
    const photoWeight = 5
    const favoriteWeight = 10
    const kudosWeight = 0.5

    return (
      this.routes * routeWeight +
      this.ascents * ascentWeight +
      this.photos * photoWeight +
      this.favorites * favoriteWeight +
      this.kudos * kudosWeight
    )
  }

  /**
   * Returns the average ascents per route.
   */
  getAverageAscentsPerRoute(): number {
    if (this.routes === 0) return 0
    return this.ascents / this.routes
  }

  /**
   * Returns true if this node has any routes.
   */
  hasRoutes(): boolean {
    return this.routes > 0
  }

  /**
   * Returns true if this node has any photos.
   */
  hasPhotos(): boolean {
    return this.photos > 0
  }

  equals(other: NodeStatistics): boolean {
    return (
      this.routes === other.routes &&
      this.ascents === other.ascents &&
      this.photos === other.photos &&
      this.favorites === other.favorites &&
      this.kudos === other.kudos
    )
  }

  toString(): string {
    return `Stats(routes: ${this.routes}, ascents: ${this.ascents}, kudos: ${this.kudos})`
  }
}
