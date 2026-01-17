export class SvgPath {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates an SvgPath from theCrag's point format or standard SVG path.
   *
   * theCrag format: "x1 y1,x2 y2,x3 y3,... [label]"
   * Each point is "x y" (space-separated), points are comma-separated.
   * May end with labels like "lower", "upper", etc.
   *
   * Examples:
   * - "9 15,49 55" = two points: (9,15) and (49,55)
   * - "260 279.5,268.3 200.5,281.1 107.5 lower" = three points with label
   *
   * This converts to standard SVG path: "M x1,y1 L x2,y2 L x3,y3..."
   */
  static createFrom(points: string | null | undefined): SvgPath {
    if (!points || points.trim() === '') {
      return new SvgPath('')
    }

    const trimmed = points.trim()

    // If already a valid SVG path (starts with M or m), use as-is
    if (/^[Mm]\s*[\d.-]/.test(trimmed)) {
      return new SvgPath(trimmed)
    }

    // Convert theCrag format to SVG path
    const svgPath = SvgPath.convertTheCragToSvgPath(trimmed)
    return new SvgPath(svgPath)
  }

  /**
   * Converts theCrag's coordinate format to standard SVG path.
   *
   * theCrag format: "x1 y1,x2 y2,x3 y3,... [label]"
   * - Each point is "x y" (x and y separated by space)
   * - Points are separated by commas
   * - May end with labels like "lower", "upper", etc.
   *
   * Output format: "M x1,y1 L x2,y2 L x3,y3..."
   */
  private static convertTheCragToSvgPath(points: string): string {
    // Remove trailing labels (non-numeric text at end)
    const cleanedPoints = points.replace(/\s+[a-zA-Z]+\s*$/g, '').trim()

    if (!cleanedPoints) {
      return ''
    }

    // Split by comma to get individual points
    const pointStrings = cleanedPoints.split(',').map((p) => p.trim())
    const coords: Array<{ x: number; y: number }> = []

    for (const pointStr of pointStrings) {
      if (!pointStr) continue

      // Each point is "x y" - split by whitespace
      const parts = pointStr.split(/\s+/)
      if (parts.length >= 2) {
        const x = Number.parseFloat(parts[0])
        const y = Number.parseFloat(parts[1])

        if (!Number.isNaN(x) && !Number.isNaN(y)) {
          coords.push({ x, y })
        }
      }
    }

    if (coords.length === 0) {
      return ''
    }

    // Build SVG path: M for first point, L for subsequent points
    const pathParts = coords.map((coord, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${coord.x},${coord.y}`
    })

    return pathParts.join(' ')
  }

  static createEmpty(): SvgPath {
    return new SvgPath('')
  }

  getValue(): string {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== ''
  }

  getPointCount(): number {
    return this.getPoints().length
  }

  /**
   * Extracts all points from the SVG path.
   * Parses M (moveTo) and L (lineTo) commands to extract coordinates.
   */
  getPoints(): Array<{ x: number; y: number }> {
    if (!this.value) return []

    const points: Array<{ x: number; y: number }> = []
    const regex = /[ML]\s*([\d.-]+)\s*,\s*([\d.-]+)/gi
    let match = regex.exec(this.value)

    while (match !== null) {
      points.push({
        x: Number.parseFloat(match[1]),
        y: Number.parseFloat(match[2]),
      })
      match = regex.exec(this.value)
    }

    return points
  }

  /**
   * Checks if the SVG path forms a closed polygon.
   * A closed path either:
   * - Ends with 'Z' or 'z' command (SVG closepath)
   * - Has the first and last points at the same position (within tolerance)
   *
   * Closed paths typically represent areas/sectors.
   * Open paths typically represent route lines.
   */
  isClosed(): boolean {
    if (!this.value) return false

    // Check for explicit Z command (closepath)
    if (/[Zz]\s*$/.test(this.value)) {
      return true
    }

    // Check if first and last points are the same
    const points = this.getPoints()
    if (points.length < 3) return false // Need at least 3 points for a polygon

    const first = points[0]
    const last = points[points.length - 1]

    // Consider closed if points are within a small tolerance
    const tolerance = 0.5
    return (
      Math.abs(first.x - last.x) < tolerance &&
      Math.abs(first.y - last.y) < tolerance
    )
  }

  /**
   * Checks if the SVG path looks like an area/sector boundary rather than a route line.
   * This is a heuristic detection that identifies paths that:
   * - Have repeated/backtracking points where the path returns to an earlier point
   * - Form rectangular shapes with wide horizontal span
   *
   * Route lines typically go from bottom to top with some horizontal variation.
   * Area boundaries typically form rectangles or have paths that go back on themselves.
   *
   * Note: This method is conservative to avoid false positives on vertical climbing routes.
   */
  looksLikeAreaBoundary(): boolean {
    const points = this.getPoints()
    if (points.length < 4) return false

    // Check 1: Does the path have true backtracking (point returns to exact same location)?
    // This is a strong indicator of an area boundary - the path goes somewhere then comes back
    // Both X and Y must match within tolerance (not just one coordinate)
    for (let i = 0; i < points.length - 2; i++) {
      const p1 = points[i]
      const p3 = points[i + 2]
      const tolerance = 1.0
      // Both coordinates must be within tolerance for true backtracking
      if (
        Math.abs(p1.x - p3.x) < tolerance &&
        Math.abs(p1.y - p3.y) < tolerance
      ) {
        // Path goes to a point and comes back to same position - definitely an area
        return true
      }
    }

    // Check 2: Path with very wide aspect ratio AND mostly orthogonal segments
    // This catches rectangular area boundaries
    const minX = Math.min(...points.map((p) => p.x))
    const maxX = Math.max(...points.map((p) => p.x))
    const minY = Math.min(...points.map((p) => p.y))
    const maxY = Math.max(...points.map((p) => p.y))

    const width = maxX - minX
    const height = maxY - minY

    // Only check aspect ratio if the path has significant dimensions
    if (width > 50 && height > 20) {
      const aspectRatio = width / height
      // If width is more than 1.5x the height AND path has orthogonal segments
      if (aspectRatio > 1.5) {
        // Count how many segments are purely horizontal or vertical
        let horizontalSegments = 0
        let verticalSegments = 0
        const segmentTolerance = 2.0

        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i]
          const p2 = points[i + 1]
          if (Math.abs(p1.y - p2.y) < segmentTolerance) {
            horizontalSegments++
          }
          if (Math.abs(p1.x - p2.x) < segmentTolerance) {
            verticalSegments++
          }
        }

        const totalSegments = points.length - 1
        if (totalSegments >= 3) {
          const orthogonalRatio =
            (horizontalSegments + verticalSegments) / totalSegments
          // Require at least 75% orthogonal segments for a wide path to be considered an area
          if (orthogonalRatio >= 0.75) {
            return true
          }
        }
      }
    }

    return false
  }

  toSvgPathElement(): string {
    if (!this.value) return ''
    return `<path d="${this.value}" />`
  }

  equals(other: SvgPath): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
