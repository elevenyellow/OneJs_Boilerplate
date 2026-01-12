import { ScrapedRoute } from '../entities/scraped-route.entity'
import { NodeId } from './node-id.vo'
import { TopoAnnotation } from './topo-annotation.vo'
import { TopoImage } from '../entities/topo-image.entity'

/**
 * Value Object that links a ScrapedRoute with its corresponding TopoAnnotation
 * and optionally the TopoImage containing the annotation.
 *
 * This enables accessing both the complete route data and its visual representation
 * (SVG path on a topo image) in a single object.
 */
export class RouteWithTopo {
  private constructor(
    private readonly route: ScrapedRoute,
    private readonly topoAnnotation: TopoAnnotation | null,
    private readonly topoImage: TopoImage | null,
  ) {}

  /**
   * Creates a RouteWithTopo linking a route with its topo annotation.
   */
  static create(
    route: ScrapedRoute,
    topoAnnotation: TopoAnnotation | null,
    topoImage: TopoImage | null,
  ): RouteWithTopo {
    return new RouteWithTopo(route, topoAnnotation, topoImage)
  }

  /**
   * Links multiple routes with their corresponding annotations by matching IDs.
   * Routes without matching annotations will have null topoAnnotation.
   */
  static linkRoutesWithAnnotations(
    routes: ScrapedRoute[],
    annotations: TopoAnnotation[],
    topoImage: TopoImage | null,
  ): RouteWithTopo[] {
    // Create a map of annotations by ID for efficient lookup
    const annotationMap = new Map<number, TopoAnnotation>()
    for (const annotation of annotations) {
      annotationMap.set(annotation.getId(), annotation)
    }

    // Link each route with its annotation (if found)
    return routes.map((route) => {
      const routeId = route.getId().getValue()
      const matchingAnnotation = annotationMap.get(routeId) ?? null
      return RouteWithTopo.create(route, matchingAnnotation, topoImage)
    })
  }

  // === Getters ===

  getRoute(): ScrapedRoute {
    return this.route
  }

  getTopoAnnotation(): TopoAnnotation | null {
    return this.topoAnnotation
  }

  getTopoImage(): TopoImage | null {
    return this.topoImage
  }

  // === Convenience Getters for Route ===

  getRouteId(): NodeId {
    return this.route.getId()
  }

  getRouteName(): string {
    return this.route.getName()
  }

  getRouteGrade(): string | null {
    return this.route.getGradeString()
  }

  getRouteUrl(): string {
    return this.route.getUrl()
  }

  // === State Checks ===

  hasTopoAnnotation(): boolean {
    return this.topoAnnotation !== null
  }

  hasTopoImage(): boolean {
    return this.topoImage !== null
  }

  // === SVG Methods ===

  /**
   * Returns the SVG path data for this route's topo annotation.
   * Returns empty string if no annotation exists.
   */
  getSvgPathData(): string {
    if (!this.topoAnnotation) {
      return ''
    }
    return this.topoAnnotation.toSvgPathData()
  }

  /**
   * Returns the color for this route's path based on its grade.
   */
  getRouteColor(): string {
    if (this.topoAnnotation) {
      return this.topoAnnotation.getColor()
    }
    return this.route.getGradeColor()
  }

  // === Comparison ===

  equals(other: RouteWithTopo): boolean {
    return this.route.equals(other.route)
  }

  toString(): string {
    const hasAnnotation = this.hasTopoAnnotation() ? 'with topo' : 'no topo'
    return `RouteWithTopo(${this.route.getName()} - ${hasAnnotation})`
  }
}
