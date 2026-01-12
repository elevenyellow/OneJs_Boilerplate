import { TopoAnnotation } from '../value-objects/topo-annotation.vo'
import { TopoDimensions } from '../value-objects/topo-dimensions.vo'
import { TopoId } from '../value-objects/topo-id.vo'
import { TopoImageUrl } from '../value-objects/topo-image-url.vo'

/**
 * Options for SVG generation.
 */
interface SvgGenerationOptions {
  /** Whether to show route numbers at the start of each route. Default: true */
  showNumbers?: boolean
  /** Whether to show grade labels along routes. Default: false */
  showGrades?: boolean
  /** Line width for route paths. Default: 2 */
  lineWidth?: number
  /** Font size for route numbers. Default: 14 */
  numberFontSize?: number
}

/**
 * DTO for TopoImage entity.
 */
export interface TopoImageDto {
  id: string
  thumbnailUrl: string
  fullImageUrl: string
  displayWidth: number
  displayHeight: number
  originalWidth: number
  originalHeight: number
  routeCount: number
  areaCount: number
}

/**
 * Entity representing a complete topo image with all its annotations.
 * This is an aggregate that combines dimensions, image URLs, and annotations
 * to provide a complete representation of a climbing topo photo.
 *
 * TopoImage is an Entity (not a Value Object) because:
 * - It has a unique identity (topoId from TheCrag)
 * - It can change over time (annotations may be updated)
 * - It is referenced by its ID in other contexts
 *
 * It can generate SVG overlays for the topo image showing route lines,
 * area polygons, and route numbers.
 */
export class TopoImage {
  private constructor(
    private readonly id: TopoId,
    private readonly dimensions: TopoDimensions,
    private readonly thumbnailUrl: TopoImageUrl,
    private readonly fullImageUrl: TopoImageUrl,
    private readonly annotations: TopoAnnotation[],
  ) {}

  /**
   * Creates a TopoImage entity with all its components.
   */
  static create(
    id: TopoId,
    dimensions: TopoDimensions,
    thumbnailUrl: TopoImageUrl,
    fullImageUrl: TopoImageUrl,
    annotations: TopoAnnotation[],
  ): TopoImage {
    return new TopoImage(id, dimensions, thumbnailUrl, fullImageUrl, [
      ...annotations,
    ])
  }

  getId(): TopoId {
    return this.id
  }

  /**
   * @deprecated Use getId().getValue() instead for raw string value
   */
  getTopoId(): string {
    return this.id.getValue()
  }

  getDimensions(): TopoDimensions {
    return this.dimensions
  }

  getThumbnailUrl(): TopoImageUrl {
    return this.thumbnailUrl
  }

  getFullImageUrl(): TopoImageUrl {
    return this.fullImageUrl
  }

  /**
   * Returns a copy of the annotations array.
   */
  getAnnotations(): TopoAnnotation[] {
    return [...this.annotations]
  }

  /**
   * Returns only route annotations.
   */
  getRouteAnnotations(): TopoAnnotation[] {
    return this.annotations.filter((a) => a.isRoute())
  }

  /**
   * Returns only area annotations.
   */
  getAreaAnnotations(): TopoAnnotation[] {
    return this.annotations.filter((a) => a.isArea())
  }

  /**
   * Returns the number of route annotations.
   */
  getRouteCount(): number {
    return this.getRouteAnnotations().length
  }

  /**
   * Returns the number of area annotations.
   */
  getAreaCount(): number {
    return this.getAreaAnnotations().length
  }

  /**
   * Generates an SVG element with route lines, area polygons, and optional labels.
   * The SVG is sized to match the original image dimensions.
   */
  generateSvg(options: SvgGenerationOptions = {}): string {
    const {
      showNumbers = true,
      showGrades = false,
      lineWidth = 2,
      numberFontSize = 14,
    } = options

    const originalWidth = this.dimensions.getOriginalWidth()
    const originalHeight = this.dimensions.getOriginalHeight()

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${originalWidth} ${originalHeight}" width="${originalWidth}" height="${originalHeight}">\n`

    // Draw area polygons first (they should be behind routes)
    for (const annotation of this.getAreaAnnotations()) {
      const polygonPoints = annotation.toPolygonPoints()
      if (polygonPoints) {
        svg += `  <polygon points="${polygonPoints}" fill="${annotation.getColor()}" stroke="none" />\n`
      }
    }

    // Draw route lines
    for (const annotation of this.getRouteAnnotations()) {
      const pathData = annotation.toSvgPathData()
      if (!pathData) continue

      const color = annotation.getColor()

      // Draw the route line
      svg += `  <path d="${pathData}" stroke="${color}" stroke-width="${lineWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />\n`

      // Draw markers at anchor points (lower marker)
      const path = annotation.getPath()
      if (path) {
        const lowerPoint = path.getLowerMarkerPoint()
        if (lowerPoint) {
          svg += `  <circle cx="${lowerPoint.getX()}" cy="${lowerPoint.getY()}" r="6" fill="${color}" />\n`
        }
      }

      // Draw route number at the start
      if (showNumbers && path) {
        const startPoint = path.getStartPoint()
        const num = annotation.getNum()
        if (num) {
          svg += `  <circle cx="${startPoint.getX()}" cy="${startPoint.getY()}" r="${numberFontSize * 0.8}" fill="${color}" />\n`
          svg += `  <text x="${startPoint.getX()}" y="${startPoint.getY() + numberFontSize * 0.35}" text-anchor="middle" font-size="${numberFontSize}" font-weight="bold" fill="white">${num}</text>\n`
        }
      }

      // Draw grade if requested
      if (showGrades && path) {
        const points = path.getPoints()
        if (points.length > 1) {
          const midIndex = Math.floor(points.length / 2)
          const midPoint = points[midIndex]
          const grade = annotation.getGrade()
          if (grade) {
            svg += `  <text x="${midPoint.getX() + 10}" y="${midPoint.getY()}" font-size="${numberFontSize - 2}" fill="${color}" font-weight="bold">${grade.getGrade()}</text>\n`
          }
        }
      }
    }

    svg += '</svg>'
    return svg
  }

  /**
   * Returns true if this topo has any annotations.
   */
  hasAnnotations(): boolean {
    return this.annotations.length > 0
  }

  /**
   * Returns true if this topo has any route annotations.
   */
  hasRoutes(): boolean {
    return this.getRouteAnnotations().length > 0
  }

  /**
   * Returns true if this topo has any area annotations.
   */
  hasAreas(): boolean {
    return this.getAreaAnnotations().length > 0
  }

  /**
   * Entity equality is based on identity (ID), not value.
   */
  equals(other: TopoImage): boolean {
    return this.id.equals(other.id)
  }

  toString(): string {
    return `TopoImage(${this.id.toString()}, routes: ${this.getRouteCount()}, areas: ${this.getAreaCount()})`
  }

  toDto(): TopoImageDto {
    return {
      id: this.id.getValue(),
      thumbnailUrl: this.thumbnailUrl.getValue(),
      fullImageUrl: this.fullImageUrl.getValue(),
      displayWidth: this.dimensions.getDisplayWidth(),
      displayHeight: this.dimensions.getDisplayHeight(),
      originalWidth: this.dimensions.getOriginalWidth(),
      originalHeight: this.dimensions.getOriginalHeight(),
      routeCount: this.getRouteCount(),
      areaCount: this.getAreaCount(),
    }
  }
}
