import { NodeId } from '../value-objects/node-id.vo'
import { ScrapedSector } from './scraped-sector.entity'

/**
 * Entity representing a complete scraped area with all its sub-areas and routes.
 *
 * This is the aggregate root for a complete area scrape, containing:
 * - Root area metadata (id, name, url)
 * - All scraped sectors (flattened list with hierarchy preserved via subSectorIds)
 * - Methods to navigate the hierarchy and aggregate statistics
 *
 * Use this entity when you need to scrape an entire area regardless of its type
 * (crag, sector, zone) and want all routes and topos in a unified structure.
 */
export class ScrapedAreaComplete {
  private constructor(
    private readonly rootId: NodeId,
    private readonly rootName: string,
    private readonly rootUrl: string,
    private readonly sectors: ScrapedSector[],
    private readonly rootSectorIds: NodeId[],
  ) {}

  /**
   * Creates a ScrapedAreaComplete with all its data.
   *
   * @param rootId - The NodeId of the root area
   * @param rootName - The name of the root area
   * @param rootUrl - The URL of the root area
   * @param sectors - All sectors (flattened, hierarchy via subSectorIds in each sector)
   * @param rootSectorIds - IDs of sectors that are direct children of root (optional)
   */
  static create(
    rootId: NodeId,
    rootName: string,
    rootUrl: string,
    sectors: ScrapedSector[],
    rootSectorIds?: NodeId[],
  ): ScrapedAreaComplete {
    // If rootSectorIds not provided, infer from sectors that are not sub-sectors of others
    const inferredRootSectorIds = rootSectorIds ?? inferRootSectorIds(sectors)

    return new ScrapedAreaComplete(
      rootId,
      rootName,
      rootUrl,
      [...sectors],
      inferredRootSectorIds,
    )
  }

  // === Basic Properties ===

  getRootId(): NodeId {
    return this.rootId
  }

  getRootName(): string {
    return this.rootName
  }

  getRootUrl(): string {
    return this.rootUrl
  }

  // === Sector Access ===

  /**
   * Returns all sectors in a flattened list.
   */
  getSectors(): ScrapedSector[] {
    return [...this.sectors]
  }

  /**
   * Returns sectors that are direct children of the root area.
   */
  getRootSectors(): ScrapedSector[] {
    const rootSectorIdValues = new Set(
      this.rootSectorIds.map((id) => id.getValue()),
    )
    return this.sectors.filter((sector) =>
      rootSectorIdValues.has(sector.getId().getValue()),
    )
  }

  /**
   * Finds a sector by its NodeId.
   */
  findSectorById(sectorId: NodeId): ScrapedSector | null {
    return (
      this.sectors.find((sector) => sector.getId().equals(sectorId)) ?? null
    )
  }

  /**
   * Returns children of a specific sector.
   */
  getChildrenOf(sectorId: NodeId): ScrapedSector[] {
    const parentSector = this.findSectorById(sectorId)
    if (!parentSector) {
      return []
    }

    const childIds = new Set(
      parentSector.getSubSectorIds().map((id) => id.getValue()),
    )
    return this.sectors.filter((sector) =>
      childIds.has(sector.getId().getValue()),
    )
  }

  /**
   * Returns sectors at a specific depth in the hierarchy.
   * Depth 1 = root sectors (direct children of root area)
   * Depth 2 = children of root sectors
   * etc.
   */
  getSectorsAtDepth(depth: number): ScrapedSector[] {
    if (depth < 1) {
      return []
    }

    if (depth === 1) {
      return this.getRootSectors()
    }

    // Build map of sector ID -> depth
    const depthMap = this.buildDepthMap()
    return this.sectors.filter(
      (sector) => depthMap.get(sector.getId().getValue()) === depth,
    )
  }

  /**
   * Returns the maximum depth of the hierarchy.
   * 0 = no sectors
   * 1 = only root sectors
   * 2 = root sectors with children
   * etc.
   */
  getHierarchyDepth(): number {
    if (this.sectors.length === 0) {
      return 0
    }

    const depthMap = this.buildDepthMap()
    return Math.max(...depthMap.values())
  }

  // === Statistics ===

  /**
   * Returns total route count across all sectors.
   */
  getTotalRouteCount(): number {
    return this.sectors.reduce((sum, sector) => sum + sector.getRouteCount(), 0)
  }

  /**
   * Returns total topo count across all sectors.
   */
  getTotalTopoCount(): number {
    return this.sectors.reduce((sum, sector) => sum + sector.getTopoCount(), 0)
  }

  /**
   * Returns total number of routes with topo annotations.
   */
  getTotalRoutesWithAnnotations(): number {
    return this.sectors.reduce(
      (sum, sector) => sum + sector.getRoutesWithAnnotationsCount(),
      0,
    )
  }

  /**
   * Returns average topo annotation coverage across all sectors.
   */
  getAverageAnnotationCoverage(): number {
    if (this.sectors.length === 0) {
      return 0
    }

    const totalCoverage = this.sectors.reduce(
      (sum, sector) => sum + sector.getTopoAnnotationCoverage(),
      0,
    )
    return totalCoverage / this.sectors.length
  }

  // === State Checks ===

  hasSectors(): boolean {
    return this.sectors.length > 0
  }

  hasRoutes(): boolean {
    return this.sectors.some((sector) => sector.hasRoutes())
  }

  hasTopos(): boolean {
    return this.sectors.some((sector) => sector.hasTopos())
  }

  // === Counts ===

  getSectorCount(): number {
    return this.sectors.length
  }

  // === Comparison ===

  equals(other: ScrapedAreaComplete): boolean {
    return this.rootId.equals(other.rootId)
  }

  toString(): string {
    return `ScrapedAreaComplete(${this.rootId.toString()}: ${this.rootName}, ${this.sectors.length} sectors, ${this.getTotalRouteCount()} routes)`
  }

  toDto() {
    return {
      rootId: this.rootId.toString(),
      rootName: this.rootName,
      rootUrl: this.rootUrl,
      sectors: this.sectors.map((s) => s.toDto()),
      rootSectorIds: this.rootSectorIds.map((id) => id.toString()),
      stats: {
        sectorCount: this.sectors.length,
        totalRoutes: this.getTotalRouteCount(),
        totalTopos: this.getTotalTopoCount(),
        routesWithAnnotations: this.getTotalRoutesWithAnnotations(),
        averageAnnotationCoverage: this.getAverageAnnotationCoverage(),
        hierarchyDepth: this.getHierarchyDepth(),
      },
    }
  }

  // === Private Helpers ===

  /**
   * Builds a map of sector ID -> depth for hierarchy navigation.
   */
  private buildDepthMap(): Map<number, number> {
    const depthMap = new Map<number, number>()
    const rootSectorIdValues = new Set(
      this.rootSectorIds.map((id) => id.getValue()),
    )

    // Initialize root sectors at depth 1
    for (const sector of this.sectors) {
      if (rootSectorIdValues.has(sector.getId().getValue())) {
        depthMap.set(sector.getId().getValue(), 1)
      }
    }

    // BFS to assign depths
    let changed = true
    while (changed) {
      changed = false
      for (const sector of this.sectors) {
        const sectorIdValue = sector.getId().getValue()
        const currentDepth = depthMap.get(sectorIdValue)

        if (currentDepth !== undefined) {
          // Assign depth to children
          for (const childId of sector.getSubSectorIds()) {
            if (!depthMap.has(childId.getValue())) {
              depthMap.set(childId.getValue(), currentDepth + 1)
              changed = true
            }
          }
        }
      }
    }

    return depthMap
  }
}

/**
 * Infers which sectors are root-level by finding sectors that are not
 * referenced as sub-sectors by any other sector.
 */
function inferRootSectorIds(sectors: ScrapedSector[]): NodeId[] {
  // Collect all sub-sector IDs referenced by any sector
  const allSubSectorIds = new Set<number>()
  for (const sector of sectors) {
    for (const subId of sector.getSubSectorIds()) {
      allSubSectorIds.add(subId.getValue())
    }
  }

  // Sectors not in allSubSectorIds are root sectors
  return sectors
    .filter((sector) => !allSubSectorIds.has(sector.getId().getValue()))
    .map((sector) => sector.getId())
}
