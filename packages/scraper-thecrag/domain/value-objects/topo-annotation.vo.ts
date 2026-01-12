import { RouteGrade } from './route-grade.vo'
import { TopoPath } from './topo-path.vo'

/**
 * Raw annotation data from TheCrag's data-topodata attribute.
 */
interface RawTopoAnnotation {
  id: number
  type: 'route' | 'area' | 'anchor' | 'belay' | 'annotation'
  num: string
  grade: string
  class: string
  zindex: string
  name: string
  stars: string
  style: string
  order: number
  url: string
  points: string
}

/**
 * Value Object representing an annotation on a topo image.
 * Annotations can be:
 * - Routes: Lines showing the climbing path with grade, stars, style
 * - Areas: Polygons showing sector boundaries with labels
 * - Other: Anchors, belays, general annotations
 */
export class TopoAnnotation {
  private constructor(
    private readonly id: number,
    private readonly type: 'route' | 'area' | 'anchor' | 'belay' | 'annotation',
    private readonly num: string,
    private readonly name: string,
    private readonly url: string,
    private readonly order: number,
    private readonly path: TopoPath | null,
    private readonly grade: RouteGrade | null,
    private readonly stars: string,
    private readonly style: string,
    private readonly zindex: string,
  ) {}

  /**
   * Parses multiple TopoAnnotations from a JSON string (data-topodata attribute value).
   */
  static parseFromTopoDataJson(jsonString: string): TopoAnnotation[] {
    const data: RawTopoAnnotation[] = JSON.parse(jsonString)

    return data.map((item) => TopoAnnotation.fromRawData(item))
  }

  /**
   * Creates a TopoAnnotation from raw data.
   */
  private static fromRawData(data: RawTopoAnnotation): TopoAnnotation {
    // Parse path if points exist
    let path: TopoPath | null = null
    if (data.points && data.points.trim().length > 0) {
      try {
        path = TopoPath.parseFromPointsString(data.points)
      } catch {
        // If parsing fails, keep path as null
        path = null
      }
    }

    // Parse grade for route types
    let grade: RouteGrade | null = null
    if (data.type === 'route' && data.grade && data.class) {
      grade = RouteGrade.create(data.grade, data.class)
    }

    return new TopoAnnotation(
      data.id,
      data.type,
      data.num,
      data.name,
      data.url,
      data.order,
      path,
      grade,
      data.stars,
      data.style,
      data.zindex,
    )
  }

  getId(): number {
    return this.id
  }

  getType(): 'route' | 'area' | 'anchor' | 'belay' | 'annotation' {
    return this.type
  }

  getNum(): string {
    return this.num
  }

  getName(): string {
    return this.name
  }

  getUrl(): string {
    return this.url
  }

  getOrder(): number {
    return this.order
  }

  getPath(): TopoPath | null {
    return this.path
  }

  getGrade(): RouteGrade | null {
    return this.grade
  }

  getStars(): string {
    return this.stars
  }

  getStyle(): string {
    return this.style
  }

  getZindex(): string {
    return this.zindex
  }

  /**
   * Returns true if this annotation represents a climbing route.
   */
  isRoute(): boolean {
    return this.type === 'route'
  }

  /**
   * Returns true if this annotation represents an area/sector.
   */
  isArea(): boolean {
    return this.type === 'area'
  }

  /**
   * Returns true if this annotation represents an anchor point.
   */
  isAnchor(): boolean {
    return this.type === 'anchor'
  }

  /**
   * Returns true if this annotation represents a belay station.
   */
  isBelay(): boolean {
    return this.type === 'belay'
  }

  /**
   * Returns the SVG path data string for this annotation.
   * Use for route annotations (lines).
   */
  toSvgPathData(): string {
    if (!this.path) {
      return ''
    }
    return this.path.toSvgPathData()
  }

  /**
   * Returns the polygon points string for this annotation.
   * Use for area annotations (polygons).
   */
  toPolygonPoints(): string {
    if (!this.path) {
      return ''
    }
    return this.path.toPolygonPoints()
  }

  /**
   * Returns the color for this annotation based on grade.
   * Returns a default color for area annotations or routes without grade.
   */
  getColor(): string {
    if (this.grade) {
      return this.grade.getColor()
    }
    // Default colors by type
    if (this.isArea()) {
      return 'rgba(0, 0, 0, 0.3)' // Semi-transparent black for areas
    }
    return '#FF0000' // Red for unknown route types
  }

  /**
   * Returns the star rating as a number (0 if no stars).
   */
  getStarsCount(): number {
    const parsed = Number.parseInt(this.stars, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  equals(other: TopoAnnotation): boolean {
    return this.id === other.id && this.type === other.type
  }

  toString(): string {
    if (this.isRoute()) {
      return `Route ${this.num}: ${this.name} (${this.grade?.getGrade() ?? 'no grade'})`
    }
    return `Area: ${this.name}`
  }
}
