import { ErrorCodes, OneJsError } from '@OneJs/core'
import { TopoPoint } from './topo-point.vo'

/**
 * Value Object representing a path in a topo image.
 * A path is a collection of TopoPoints that form a line (for routes)
 * or a polygon (for area annotations).
 *
 * Paths are parsed from comma-separated point segments like:
 * "136.3 334.8,139 268,164.1 159.9 lower"
 */
export class TopoPath {
  private constructor(private readonly points: TopoPoint[]) {}

  /**
   * Parses a TopoPath from a comma-separated points string.
   * Example: "136.3 334.8,139 268,164.1 159.9 lower"
   */
  static parseFromPointsString(pointsString: string): TopoPath {
    if (!pointsString || pointsString.trim().length === 0) {
      throw new OneJsError(
        'Invalid path',
        400,
        'Path string cannot be empty',
        { pointsString },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const segments = pointsString.split(',')
    const points: TopoPoint[] = []

    for (const segment of segments) {
      const trimmedSegment = segment.trim()
      if (trimmedSegment.length > 0) {
        points.push(TopoPoint.parseFromSegment(trimmedSegment))
      }
    }

    if (points.length === 0) {
      throw new OneJsError(
        'Invalid path',
        400,
        'Path must contain at least one point',
        { pointsString },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new TopoPath(points)
  }

  /**
   * Creates a TopoPath from an array of TopoPoints.
   */
  static createFrom(points: TopoPoint[]): TopoPath {
    if (!points || points.length === 0) {
      throw new OneJsError(
        'Invalid path',
        400,
        'Path must contain at least one point',
        {},
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new TopoPath([...points])
  }

  /**
   * Returns a copy of the points array.
   */
  getPoints(): TopoPoint[] {
    return [...this.points]
  }

  /**
   * Returns the first point in the path.
   */
  getStartPoint(): TopoPoint {
    return this.points[0]
  }

  /**
   * Returns the last point in the path.
   */
  getEndPoint(): TopoPoint {
    return this.points[this.points.length - 1]
  }

  /**
   * Returns the point at the specified index.
   */
  getPointAt(index: number): TopoPoint {
    if (index < 0 || index >= this.points.length) {
      throw new OneJsError(
        'Index out of bounds',
        400,
        `Index ${index} is out of bounds for path with ${this.points.length} points`,
        { index, length: this.points.length },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return this.points[index]
  }

  /**
   * Returns the number of points in the path.
   */
  getLength(): number {
    return this.points.length
  }

  /**
   * Converts the path to SVG path data format.
   * Example: "M 100 200 L 150 250 L 200 300"
   */
  toSvgPathData(): string {
    if (this.points.length === 0) {
      return ''
    }

    const first = this.points[0]
    let pathData = `M ${first.getX()} ${first.getY()}`

    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i]
      pathData += ` L ${point.getX()} ${point.getY()}`
    }

    return pathData
  }

  /**
   * Converts the path to polygon points format.
   * Example: "100,200 150,250 200,300"
   */
  toPolygonPoints(): string {
    return this.points.map((p) => `${p.getX()},${p.getY()}`).join(' ')
  }

  /**
   * Finds the point with a "lower" marker in the path.
   * Returns null if no lower marker exists.
   */
  getLowerMarkerPoint(): TopoPoint | null {
    return this.points.find((p) => p.isLowerMarker()) ?? null
  }

  /**
   * Finds the point with a "label" marker in the path.
   * Returns null if no label marker exists.
   */
  getLabelMarkerPoint(): TopoPoint | null {
    return this.points.find((p) => p.isLabelMarker()) ?? null
  }

  /**
   * Returns all points with markers.
   */
  getMarkerPoints(): TopoPoint[] {
    return this.points.filter((p) => p.hasMarker())
  }

  /**
   * Compares two paths for equality.
   */
  equals(other: TopoPath): boolean {
    if (this.points.length !== other.points.length) {
      return false
    }

    for (let i = 0; i < this.points.length; i++) {
      if (!this.points[i].equals(other.points[i])) {
        return false
      }
    }

    return true
  }

  /**
   * Returns the original points string representation.
   */
  toString(): string {
    return this.points.map((p) => p.toString()).join(',')
  }
}
