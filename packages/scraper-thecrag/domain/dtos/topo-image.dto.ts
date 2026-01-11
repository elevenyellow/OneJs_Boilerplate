/**
 * Route annotation on a topo image
 */
export interface TopoRouteAnnotation {
  id: number
  type: 'route' | 'area' | 'anchor' | 'belay'
  num: string
  grade: string
  gradeClass: string // e.g., 'gb3' for grade band
  zindex: string
  name: string
  stars: string
  style: string // 'Sport', 'Trad', 'Boulder', etc.
  order: number
  url: string
  /** Points as "x1 y1,x2 y2,..." - coordinates relative to original image size */
  points: string
}

/**
 * Parsed point coordinate
 */
export interface TopoPoint {
  x: number
  y: number
  /** Special marker like 'lower', 'anchor', 'belay' */
  marker?: string
}

/**
 * A photo topo from TheCrag
 */
export interface TopoImageData {
  /** Topo ID in TheCrag */
  topoId: string
  /** Display width */
  width: number
  /** Display height */
  height: number
  /** View scale factor */
  viewScale: number
  /** Thumbnail image URL */
  thumbnailUrl: string
  /** Full resolution image URL */
  fullImageUrl: string
  /** Original image dimensions (calculated from viewScale) */
  originalWidth: number
  originalHeight: number
  /** Route annotations with line data */
  routes: TopoRouteAnnotation[]
}

/**
 * Header/cover image for a crag/sector
 */
export interface HeaderImageData {
  url: string
  width?: number
  height?: number
  alt?: string
}

/**
 * Parse points string into array of coordinates
 * @example "231.6 396.3,238.1 207.4,234.2 34 lower" -> [{x: 231.6, y: 396.3}, {x: 238.1, y: 207.4}, {x: 234.2, y: 34, marker: 'lower'}]
 */
export function parseTopoPoints(pointsStr: string): TopoPoint[] {
  const points: TopoPoint[] = []
  const segments = pointsStr.split(',')

  for (const segment of segments) {
    const parts = segment.trim().split(/\s+/)
    if (parts.length >= 2) {
      const x = parseFloat(parts[0])
      const y = parseFloat(parts[1])
      
      if (!isNaN(x) && !isNaN(y)) {
        const point: TopoPoint = { x, y }
        
        // Check for marker (third part if exists and is not a number)
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
 * Generate SVG path data from topo points
 */
export function topoPointsToSvgPath(points: TopoPoint[]): string {
  if (points.length === 0) return ''

  let path = `M ${points[0].x} ${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }

  return path
}

/**
 * Generate complete SVG element for a topo with route lines
 */
export function generateTopoSvg(
  topo: TopoImageData,
  options: {
    lineColor?: string
    lineWidth?: number
    showNumbers?: boolean
    showGrades?: boolean
    numberFontSize?: number
  } = {}
): string {
  const {
    lineColor = '#FF0000',
    lineWidth = 2,
    showNumbers = true,
    showGrades = false,
    numberFontSize = 14,
  } = options

  const { originalWidth, originalHeight, routes } = topo

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${originalWidth} ${originalHeight}" width="${originalWidth}" height="${originalHeight}">\n`

  // Draw route lines
  for (const route of routes) {
    const points = parseTopoPoints(route.points)
    if (points.length < 2) continue

    const pathData = topoPointsToSvgPath(points)
    const routeColor = getGradeColor(route.gradeClass) || lineColor

    // Draw the route line
    svg += `  <path d="${pathData}" stroke="${routeColor}" stroke-width="${lineWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />\n`

    // Draw markers at anchor points
    const lastPoint = points[points.length - 1]
    if (lastPoint.marker === 'lower' || lastPoint.marker === 'anchor') {
      svg += `  <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="6" fill="${routeColor}" />\n`
    }

    // Draw route number at the start
    if (showNumbers && points.length > 0) {
      const startPoint = points[0]
      svg += `  <circle cx="${startPoint.x}" cy="${startPoint.y}" r="${numberFontSize * 0.8}" fill="${routeColor}" />\n`
      svg += `  <text x="${startPoint.x}" y="${startPoint.y + numberFontSize * 0.35}" text-anchor="middle" font-size="${numberFontSize}" font-weight="bold" fill="white">${route.num}</text>\n`
    }

    // Draw grade if requested
    if (showGrades && points.length > 1) {
      const midIndex = Math.floor(points.length / 2)
      const midPoint = points[midIndex]
      svg += `  <text x="${midPoint.x + 10}" y="${midPoint.y}" font-size="${numberFontSize - 2}" fill="${routeColor}" font-weight="bold">${route.grade}</text>\n`
    }
  }

  svg += '</svg>'
  return svg
}

/**
 * Get color based on grade band class
 */
function getGradeColor(gradeClass: string): string | null {
  const colors: Record<string, string> = {
    'gb1': '#4CAF50', // Easy - Green
    'gb2': '#8BC34A', // Moderate - Light Green
    'gb3': '#FFC107', // Intermediate - Yellow/Amber
    'gb4': '#FF9800', // Difficult - Orange
    'gb5': '#FF5722', // Hard - Deep Orange
    'gb6': '#F44336', // Very Hard - Red
    'gb7': '#9C27B0', // Elite - Purple
    'gb8': '#673AB7', // Super Elite - Deep Purple
  }
  return colors[gradeClass] || null
}
