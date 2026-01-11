import { Injectable, logger } from '@OneJs/core'
import type { TopoImageData, TopoPoint } from '@scraper-thecrag/domain/dtos/topo-image.dto'
import { parseTopoPoints } from '@scraper-thecrag/domain/dtos/topo-image.dto'

/**
 * Options for rendering topo overlays
 */
export interface TopoRenderOptions {
  /** Line width for route paths */
  lineWidth?: number
  /** Show route numbers at start points */
  showNumbers?: boolean
  /** Show grades along the routes */
  showGrades?: boolean
  /** Font size for numbers/text */
  fontSize?: number
  /** Custom colors by grade band (gb1-gb8) */
  gradeColors?: Record<string, string>
  /** Default line color if grade color not found */
  defaultColor?: string
  /** Line opacity (0-1) */
  lineOpacity?: number
  /** Use TheCrag style (rectangular labels, lower symbol) */
  theCragStyle?: boolean
  /** Shadow width around lines */
  shadowWidth?: number
  /** Shadow color */
  shadowColor?: string
  /** Route IDs to highlight (within grade range) */
  highlightedRouteIds?: number[]
  /** Color for highlighted routes */
  highlightColor?: string
  /** Make non-highlighted routes dimmer */
  dimNonHighlighted?: boolean
}

// TheCrag grade band colors (matching their CSS)
const DEFAULT_GRADE_COLORS: Record<string, string> = {
  gb1: '#0a0',    // Green - Very easy
  gb2: '#090',    // Green - Easy  
  gb3: '#007',    // Blue - Moderate
  gb4: '#00a',    // Blue - Intermediate
  gb5: '#a0a',    // Purple - Difficult
  gb6: '#a0a',    // Purple - Hard
  gb7: '#a00',    // Red - Very Hard
  gb8: '#a00',    // Red - Elite
}

/**
 * Service for rendering topo route overlays on images
 * Generates SVG overlays matching TheCrag's visual style with smooth Bézier curves
 */
@Injectable()
export class TopoRendererService {
  private readonly defaultOptions: Required<TopoRenderOptions> = {
    lineWidth: 2,
    showNumbers: true,
    showGrades: false,
    fontSize: 8,
    gradeColors: DEFAULT_GRADE_COLORS,
    defaultColor: '#007',
    lineOpacity: 1,
    theCragStyle: true,
    shadowWidth: 4,
    shadowColor: 'rgba(255,255,255,0.6)',
    highlightedRouteIds: [],
    highlightColor: '#4CAF50',
    dimNonHighlighted: false,
  }

  /**
   * Generate an SVG overlay for a topo image (TheCrag style)
   * This SVG can be placed over the original image
   */
  generateSvgOverlay(topo: TopoImageData, options: TopoRenderOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options }
    const { originalWidth, originalHeight, routes } = topo

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${originalWidth} ${originalHeight}" 
     width="${originalWidth}" 
     height="${originalHeight}">
`

    // Add defs for symbols (TheCrag style lower/anchor symbol)
    svg += `  <defs>
    <path id="lower" fill="#fff" stroke="#007" d="M-1.5 5 a5 5 0 1 1 3 0 l0 3 l3.5 -1.5 l-5 10 l-5 -10 l3.5 1.5 z" stroke-width="1.3"/>
    <path id="anchor" fill="#fff" stroke="#007" d="M0 -6 L4 2 L0 0 L-4 2 Z M0 0 L0 8 M-3 8 L3 8" stroke-width="1.2"/>
  </defs>
`

    // Sort routes by zindex and order
    const sortedRoutes = [...routes].sort((a, b) => {
      const zDiff = parseInt(a.zindex || '1') - parseInt(b.zindex || '1')
      return zDiff !== 0 ? zDiff : a.order - b.order
    })

    // Check if we have highlighted routes
    const hasHighlights = opts.highlightedRouteIds.length > 0
    const highlightSet = new Set(opts.highlightedRouteIds)

    // Group: Routes (shadows first, then lines)
    svg += `  <g class="routes">\n`
    
    for (const route of sortedRoutes) {
      const points = parseTopoPoints(route.points)
      if (points.length < 2) continue

      const isHighlighted = highlightSet.has(route.id)
      const color = isHighlighted && hasHighlights
        ? opts.highlightColor
        : opts.gradeColors[route.gradeClass] || opts.defaultColor
      const pathData = this.pointsToBezierPath(points)
      const gradeClass = route.gradeClass || 'gb3'
      const lineWidth = isHighlighted && hasHighlights ? opts.lineWidth + 1 : opts.lineWidth
      const opacity = hasHighlights && opts.dimNonHighlighted && !isHighlighted ? 0.4 : opts.lineOpacity
      const highlightClass = isHighlighted ? ' highlighted' : ''

      svg += `    <g class="${gradeClass}${highlightClass}">\n`
      
      // Shadow path (white/light for visibility on dark rock)
      const shadowColor = isHighlighted && hasHighlights ? 'rgba(76,175,80,0.6)' : opts.shadowColor
      svg += `      <path class="routeshadow" d="${pathData}" stroke="${shadowColor}" stroke-width="${lineWidth + opts.shadowWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>\n`
      
      // Main route line
      svg += `      <path class="route" d="${pathData}" stroke="${color}" stroke-width="${lineWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>\n`
      
      svg += `    </g>\n`
    }
    
    svg += `  </g>\n`

    // Group: Lower/Anchor symbols
    svg += `  <g class="anchors">\n`
    for (const route of sortedRoutes) {
      const points = parseTopoPoints(route.points)
      if (points.length < 2) continue

      const lastPoint = points[points.length - 1]
      if (lastPoint.marker === 'lower' || lastPoint.marker === 'anchor') {
        const symbolId = lastPoint.marker === 'anchor' ? 'anchor' : 'lower'
        svg += `    <g class="lower" transform="translate(${lastPoint.x.toFixed(0)},${lastPoint.y.toFixed(0)}) rotate(0)"><use xlink:href="#${symbolId}"/></g>\n`
      }
    }
    svg += `  </g>\n`

    // Group: Labels (TheCrag style - rectangular with white background)
    if (opts.showNumbers) {
      svg += `  <g class="labels">\n`
      for (const route of sortedRoutes) {
        const points = parseTopoPoints(route.points)
        if (points.length === 0 || !route.num) continue

        const isHighlighted = highlightSet.has(route.id)
        const startPoint = points[0]
        const gradeClass = route.gradeClass || 'gb3'
        const labelWidth = route.num.length > 1 ? 12 : 10
        const labelHeight = 12
        const highlightClass = isHighlighted ? ' highlighted' : ''
        const fillColor = isHighlighted && hasHighlights ? '#4CAF50' : '#fff'
        const textColor = isHighlighted && hasHighlights ? '#fff' : '#000'
        const strokeColor = isHighlighted && hasHighlights ? '#2E7D32' : '#000'
        
        svg += `    <g class="label ${gradeClass}${highlightClass}">\n`
        svg += `      <rect x="${(startPoint.x - labelWidth / 2).toFixed(1)}" y="${(startPoint.y - labelHeight + 5).toFixed(1)}" width="${labelWidth}" height="${labelHeight}" stroke="${strokeColor}" fill="${fillColor}" rx="1" ry="1"/>\n`
        svg += `      <text x="${startPoint.x.toFixed(1)}" y="${(startPoint.y + 3).toFixed(1)}" text-anchor="middle" style="font-family: Tahoma, Arial; font-size: ${opts.fontSize}px; line-height: 16px; text-align: center; fill: ${textColor};">${route.num}</text>\n`
        svg += `    </g>\n`
      }
      svg += `  </g>\n`
    }

    // Group: Grade labels (optional)
    if (opts.showGrades) {
      svg += `  <g class="grades">\n`
      for (const route of sortedRoutes) {
        const points = parseTopoPoints(route.points)
        if (points.length < 2 || !route.grade) continue

        const color = opts.gradeColors[route.gradeClass] || opts.defaultColor
        const midIdx = Math.floor(points.length / 2)
        const midPoint = points[midIdx]
        
        svg += `    <g transform="translate(${(midPoint.x + 10).toFixed(1)}, ${midPoint.y.toFixed(1)})">\n`
        svg += `      <rect x="-2" y="-9" width="${route.grade.length * 5 + 4}" height="11" fill="rgba(255,255,255,0.85)" stroke="${color}" stroke-width="0.5" rx="2"/>\n`
        svg += `      <text y="0" style="font-family: Tahoma, Arial; font-size: 8px; fill: ${color}; font-weight: bold;">${route.grade}</text>\n`
        svg += `    </g>\n`
      }
      svg += `  </g>\n`
    }

    svg += '</svg>'
    return svg
  }

  /**
   * Generate an HTML element that combines image and SVG overlay
   * Useful for web display
   */
  generateHtmlComposite(
    topo: TopoImageData,
    options: TopoRenderOptions = {},
    imageUrl?: string
  ): string {
    const imgUrl = imageUrl || topo.fullImageUrl
    const svgOverlay = this.generateSvgOverlay(topo, options)
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgOverlay).toString('base64')}`

    return `<div class="topo-composite" style="position: relative; display: inline-block; max-width: 100%;">
  <img src="${imgUrl}" style="display: block; max-width: 100%; height: auto;" alt="Topo base image"/>
  <img src="${svgDataUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" alt="Route overlay"/>
</div>`
  }

  /**
   * Generate a composite image using Sharp
   * This actually merges the SVG onto the image
   */
  async generateCompositeImage(
    topo: TopoImageData,
    options: TopoRenderOptions = {},
    outputPath?: string
  ): Promise<{ imagePath?: string; imageBuffer?: Buffer; imageUrl: string; svgUrl: string }> {
    const svgOverlay = this.generateSvgOverlay(topo, options)
    
    try {
      const sharp = (await import('sharp')).default
      
      // Download the base image
      logger.info('topo-renderer', `Downloading base image: ${topo.fullImageUrl}`)
      const imageResponse = await fetch(topo.fullImageUrl)
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      
      // Get base image dimensions
      const baseImage = sharp(imageBuffer)
      const metadata = await baseImage.metadata()
      const { width, height } = metadata
      
      logger.info('topo-renderer', `Base image size: ${width}x${height}`)
      
      // Resize SVG to match base image dimensions
      const svgBuffer = Buffer.from(svgOverlay)
      const svgResized = await sharp(svgBuffer)
        .resize(width, height)
        .toBuffer()
      
      // Composite the images
      const compositeBuffer = await sharp(imageBuffer)
        .composite([{ input: svgResized, top: 0, left: 0 }])
        .png()
        .toBuffer()

      if (outputPath) {
        await Bun.write(outputPath, compositeBuffer)
        logger.info('topo-renderer', `Saved composite image to ${outputPath}`)
        return {
          imagePath: outputPath,
          imageBuffer: compositeBuffer,
          imageUrl: topo.fullImageUrl,
          svgUrl: `data:image/svg+xml;base64,${Buffer.from(svgOverlay).toString('base64')}`,
        }
      }

      // Return buffer and data URL
      const dataUrl = `data:image/png;base64,${compositeBuffer.toString('base64')}`
      return {
        imageBuffer: compositeBuffer,
        imageUrl: dataUrl,
        svgUrl: `data:image/svg+xml;base64,${Buffer.from(svgOverlay).toString('base64')}`,
      }
    } catch (err) {
      // Sharp not available or error occurred
      logger.warn('topo-renderer', `Could not generate composite: ${err}`)
      return {
        imageUrl: topo.fullImageUrl,
        svgUrl: `data:image/svg+xml;base64,${Buffer.from(svgOverlay).toString('base64')}`,
      }
    }
  }

  /**
   * Generate composite from local files (SVG + image already downloaded)
   */
  async generateCompositeFromFiles(
    imagePath: string,
    svgPath: string,
    outputPath: string
  ): Promise<void> {
    const sharp = (await import('sharp')).default
    
    // Get base image dimensions
    const baseImage = sharp(imagePath)
    const metadata = await baseImage.metadata()
    const { width, height } = metadata
    
    // Resize SVG to match base image
    const svgBuffer = await Bun.file(svgPath).arrayBuffer()
    const svgResized = await sharp(Buffer.from(svgBuffer))
      .resize(width, height)
      .toBuffer()
    
    // Composite and save
    await sharp(imagePath)
      .composite([{ input: svgResized, top: 0, left: 0 }])
      .png()
      .toFile(outputPath)
    
    logger.info('topo-renderer', `Generated composite: ${outputPath}`)
  }

  /**
   * Save SVG overlay to file
   */
  async saveSvgOverlay(topo: TopoImageData, outputPath: string, options: TopoRenderOptions = {}): Promise<void> {
    const svg = this.generateSvgOverlay(topo, options)
    await Bun.write(outputPath, svg)
    logger.info('topo-renderer', `Saved SVG overlay to ${outputPath}`)
  }

  /**
   * Download and save image from URL
   */
  async downloadImage(url: string, outputPath: string): Promise<void> {
    const response = await fetch(url)
    const buffer = Buffer.from(await response.arrayBuffer())
    await Bun.write(outputPath, buffer)
    logger.info('topo-renderer', `Downloaded image to ${outputPath}`)
  }

  // Private helper methods

  /**
   * Convert points to smooth Bézier curve path (TheCrag style)
   * Uses cubic Bézier curves (C command) for smooth lines through waypoints
   */
  private pointsToBezierPath(points: TopoPoint[]): string {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
    
    let path = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
    
    if (points.length === 2) {
      // Simple line for 2 points
      path += `L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`
      return path
    }

    // Generate smooth cubic Bézier curves through all points
    // Using Catmull-Rom to Bézier conversion for smooth curves
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]

      // Catmull-Rom to Cubic Bézier control points
      const tension = 0.5 // Adjust for curve tightness (0 = straight, 1 = very curved)
      
      const cp1x = p1.x + (p2.x - p0.x) * tension / 3
      const cp1y = p1.y + (p2.y - p0.y) * tension / 3
      const cp2x = p2.x - (p3.x - p1.x) * tension / 3
      const cp2y = p2.y - (p3.y - p1.y) * tension / 3

      path += `C ${cp1x.toFixed(1)},${cp1y.toFixed(1)},${cp2x.toFixed(1)},${cp2y.toFixed(1)},${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }

    return path
  }

  /**
   * Convert points to simple line path (fallback)
   */
  private pointsToLinePath(points: TopoPoint[]): string {
    if (points.length === 0) return ''
    
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`
    }

    return path
  }
}
