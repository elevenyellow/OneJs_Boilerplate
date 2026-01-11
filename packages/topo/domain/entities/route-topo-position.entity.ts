import { TopoImageId } from '../value-objects/topo-image-id.vo'
import { RouteId } from '@route/domain/value-objects/route-id.vo'

/**
 * RouteTopoPosition Entity - Links a route to its position on a topo image
 */
export class RouteTopoPositionEntity {
  constructor(
    public readonly id: string,
    public readonly routeId: RouteId,
    public readonly topoImageId: TopoImageId,
    public readonly topoNumber: string,
    public readonly points: string,
    public readonly zindex: number = 0,
    public readonly order: number = 0,
    public readonly gradeClass: string | null = null,
    public readonly createdAt: Date = new Date(),
  ) {}

  /**
   * Parse points string into coordinate array
   */
  getPointsArray(): Array<{ x: number; y: number; marker?: string }> {
    const points: Array<{ x: number; y: number; marker?: string }> = []
    const segments = this.points.split(',')

    for (const segment of segments) {
      const parts = segment.trim().split(/\s+/)
      if (parts.length >= 2) {
        const x = parseFloat(parts[0])
        const y = parseFloat(parts[1])

        if (!isNaN(x) && !isNaN(y)) {
          const point: { x: number; y: number; marker?: string } = { x, y }

          if (parts.length >= 3 && isNaN(parseFloat(parts[2]))) {
            point.marker = parts[2]
          }

          points.push(point)
        }
      }
    }

    return points
  }

  /**
   * Get the starting point of the route line
   */
  getStartPoint(): { x: number; y: number } | null {
    const points = this.getPointsArray()
    return points.length > 0 ? points[0] : null
  }

  /**
   * Get the ending point (usually anchor) of the route line
   */
  getEndPoint(): { x: number; y: number; marker?: string } | null {
    const points = this.getPointsArray()
    return points.length > 0 ? points[points.length - 1] : null
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      routeId: this.routeId.toString(),
      topoImageId: this.topoImageId.toString(),
      topoNumber: this.topoNumber,
      points: this.points,
      zindex: this.zindex,
      order: this.order,
      gradeClass: this.gradeClass,
      createdAt: this.createdAt,
    }
  }
}
