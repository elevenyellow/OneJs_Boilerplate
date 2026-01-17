import type { SectorPhotoWithAreasDto } from '@/types/api'

/**
 * Props for the TopoImageViewer component
 * Supports both new SVG path format and legacy marker format
 */
export interface TopoImageViewerProps {
  /**
   * Array of topo photos with route line annotations
   * This is the preferred format matching backend DTOs
   */
  photos?: SectorPhotoWithAreasDto[]

  /**
   * Single image URL (used as fallback if no photos provided)
   */
  imageUrl?: string

  /**
   * Legacy markers format - for backwards compatibility
   * @deprecated Use photos with routeLines instead
   */
  markers?: LegacyTopoMarker[]

  /**
   * Currently selected route ID (internal ID)
   */
  selectedRouteId?: string

  /**
   * Currently selected route external ID (for matching with annotations)
   */
  selectedRouteExternalId?: string

  /**
   * Color override for selected route (from route's gradeCategory)
   * This ensures the line color matches the route list color
   */
  selectedRouteColor?: string

  /**
   * Currently selected photo index (controlled mode)
   */
  selectedPhotoIndex?: number

  /**
   * Callback when a route line or marker is pressed
   */
  onRoutePress?: (routeId: string) => void

  /**
   * Callback when photo changes (swipe or thumbnail tap)
   */
  onPhotoChange?: (index: number) => void

  /**
   * Callback when fullscreen button is pressed
   */
  onFullscreen?: () => void
}

/**
 * Legacy marker format for backwards compatibility
 * @deprecated Use RouteLineAnnotation instead
 */
export interface LegacyTopoMarker {
  routeId: string
  x: number
  y: number
  color: string
  number?: number
}

/**
 * Route line data for rendering
 * Matches RouteLineAnnotationDto from API
 */
export interface RouteLineData {
  id: string
  routeId?: string | null
  externalRouteId?: string | null
  svgPath: string
  color?: string | null
  topoNumber?: string | null
  routeName?: string | null
}

/**
 * Point coordinates
 */
export interface Point {
  x: number
  y: number
}

/**
 * Display dimensions
 */
export interface DisplayDimensions {
  width: number
  height: number
  scaleX: number
  scaleY: number
}

/**
 * Props for route line selection checking
 */
export interface RouteSelectionProps {
  selectedRouteId?: string
  selectedRouteExternalId?: string
  selectedRouteColor?: string
}
