import type { SectorPhotoWithAreasDto } from '@/types/api'
import type { Point, DisplayDimensions, RouteLineData } from './types'
import { SCREEN_WIDTH } from './constants'
import { colors } from '@/theme/colors'

/**
 * Parse SVG path to extract the starting point for the route number label
 * Returns the first point in the path (bottom of the route)
 */
export function getPathStartPoint(svgPath: string): Point | null {
  const match = svgPath.match(/M\s*([\d.-]+)[,\s]+([\d.-]+)/)
  if (match) {
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
  }
  return null
}

/**
 * Transform SVG path coordinates to screen coordinates
 */
export function transformPath(
  svgPath: string,
  scaleX: number,
  scaleY: number,
): string {
  return svgPath.replace(
    /([ML])\s*([\d.-]+)[,\s]+([\d.-]+)/g,
    (_match, command, x, y) => {
      const scaledX = parseFloat(x) * scaleX
      const scaledY = parseFloat(y) * scaleY
      return `${command} ${scaledX.toFixed(1)},${scaledY.toFixed(1)}`
    },
  )
}

/**
 * Calculate display dimensions for a photo
 * Maps from ORIGINAL image coordinate system to screen coordinates
 */
export function calculateDisplayDimensions(
  photo: SectorPhotoWithAreasDto | undefined,
): DisplayDimensions {
  const originalWidth = photo?.originalWidth || photo?.width || 1350
  const originalHeight = photo?.originalHeight || photo?.height || 900

  // Display image using ORIGINAL aspect ratio
  const imageAspectRatio = originalHeight / originalWidth
  const displayHeight = SCREEN_WIDTH * imageAspectRatio

  // Scale factors: map ORIGINAL image coords to screen coords
  const scaleX = SCREEN_WIDTH / originalWidth
  const scaleY = displayHeight / originalHeight

  return {
    width: SCREEN_WIDTH,
    height: displayHeight,
    scaleX,
    scaleY,
  }
}

/**
 * Calculate fullscreen dimensions maintaining aspect ratio
 */
export function calculateFullscreenDimensions(
  photo: SectorPhotoWithAreasDto | undefined,
  screenWidth: number,
  screenHeight: number,
): { width: number; height: number } {
  if (!photo) {
    return { width: screenWidth, height: screenHeight }
  }

  const origW = photo.originalWidth || photo.width || 1350
  const origH = photo.originalHeight || photo.height || 900
  const photoAspectRatio = origH / origW
  const screenAspectRatio = screenHeight / screenWidth

  if (photoAspectRatio > screenAspectRatio) {
    return {
      width: screenHeight / photoAspectRatio,
      height: screenHeight,
    }
  }
  return {
    width: screenWidth,
    height: screenWidth * photoAspectRatio,
  }
}

/**
 * Check if a route line matches the selected route
 * Compares by routeId, externalRouteId, or annotation id
 */
export function isRouteLineSelected(
  line: RouteLineData,
  selectedRouteId?: string,
  selectedRouteExternalId?: string,
): boolean {
  if (!selectedRouteId && !selectedRouteExternalId) return false
  return (
    (selectedRouteId !== undefined && line.routeId === selectedRouteId) ||
    (selectedRouteExternalId !== undefined &&
      line.externalRouteId === selectedRouteExternalId) ||
    (selectedRouteId !== undefined && line.id === selectedRouteId)
  )
}

/**
 * Get the color for a route line, considering selection state
 */
export function getRouteLineColor(
  line: RouteLineData,
  isSelected: boolean,
  selectedRouteColor?: string,
  defaultColor = colors.text.secondary,
): string {
  if (isSelected && selectedRouteColor) {
    return selectedRouteColor
  }
  return line.color || defaultColor
}
