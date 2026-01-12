import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing a point in a topo image.
 * Points are parsed from segment strings like "136.3 334.8" or "164.1 159.9 lower".
 *
 * Supported markers:
 * - "lower": Marks the lower anchor point of a route
 * - "label" (lbvyd format): Marks a label point with associated text
 */
export class TopoPoint {
  private static readonly LABEL_MARKER_PATTERN = /^lbv[a-z]*$/

  private constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly marker: string | null,
    private readonly markerLabel: string | null,
  ) {}

  /**
   * Parses a TopoPoint from a segment string.
   * Segment formats:
   * - "x y" - Simple point
   * - "x y lower" - Point with lower marker
   * - "x y lbvyd Label" - Point with label marker and text
   */
  static parseFromSegment(segment: string): TopoPoint {
    if (!segment || segment.trim().length === 0) {
      throw new OneJsError(
        'Invalid point segment',
        400,
        'Point segment cannot be empty',
        { segment },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const parts = segment.trim().split(' ')

    if (parts.length < 2) {
      throw new OneJsError(
        'Invalid point segment',
        400,
        'Point segment must contain at least x and y coordinates',
        { segment },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const x = Number.parseFloat(parts[0])
    const y = Number.parseFloat(parts[1])

    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw new OneJsError(
        'Invalid point segment',
        400,
        'Point coordinates must be valid numbers',
        { segment, x: parts[0], y: parts[1] },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    // Parse marker if present
    let marker: string | null = null
    let markerLabel: string | null = null

    if (parts.length >= 3) {
      const potentialMarker = parts[2]

      if (potentialMarker === 'lower') {
        marker = 'lower'
      } else if (this.LABEL_MARKER_PATTERN.test(potentialMarker)) {
        marker = 'label'
        // The label text is the remaining parts joined
        if (parts.length >= 4) {
          markerLabel = parts.slice(3).join(' ')
        }
      } else {
        // Unknown marker, treat as plain marker
        marker = potentialMarker
      }
    }

    return new TopoPoint(x, y, marker, markerLabel)
  }

  /**
   * Creates a TopoPoint from trusted coordinates (e.g., from database).
   */
  static createFrom(
    x: number,
    y: number,
    marker?: string | null,
    markerLabel?: string | null,
  ): TopoPoint {
    return new TopoPoint(x, y, marker ?? null, markerLabel ?? null)
  }

  getX(): number {
    return this.x
  }

  getY(): number {
    return this.y
  }

  getMarker(): string | null {
    return this.marker
  }

  getMarkerLabel(): string | null {
    return this.markerLabel
  }

  hasMarker(): boolean {
    return this.marker !== null
  }

  isLowerMarker(): boolean {
    return this.marker === 'lower'
  }

  isLabelMarker(): boolean {
    return this.marker === 'label'
  }

  equals(other: TopoPoint): boolean {
    return (
      this.x === other.x &&
      this.y === other.y &&
      this.marker === other.marker &&
      this.markerLabel === other.markerLabel
    )
  }

  toString(): string {
    let result = `${this.x} ${this.y}`

    if (this.marker === 'lower') {
      result += ' lower'
    } else if (this.marker === 'label' && this.markerLabel) {
      result += ` label ${this.markerLabel}`
    } else if (this.marker) {
      result += ` ${this.marker}`
    }

    return result
  }
}
