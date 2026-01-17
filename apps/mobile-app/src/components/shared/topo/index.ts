// Main component
export { TopoImageViewer } from './TopoImageViewer'

// Sub-components (for advanced usage)
export { TopoImage } from './TopoImage'
export { TopoFullscreenModal } from './TopoFullscreenModal'
export { TopoLegendModal } from './TopoLegendModal'
export { TopoThumbnailStrip } from './TopoThumbnailStrip'
export { TopoRouteOverlay } from './TopoRouteOverlay'
export { TopoRouteLabels } from './TopoRouteLabels'
export { TopoNavigationArrows } from './TopoNavigationArrows'
export { TopoPhotoBadges } from './TopoPhotoBadges'
export { TopoLegacyMarkers } from './TopoLegacyMarkers'

// Types
export type {
  TopoImageViewerProps,
  LegacyTopoMarker,
  RouteLineData,
  Point,
  DisplayDimensions,
  RouteSelectionProps,
} from './types'

// Constants
export {
  MIN_ZOOM,
  MAX_ZOOM,
  DOUBLE_TAP_ZOOM,
  IMAGE_HEIGHT,
  THUMBNAIL_SIZE,
  THUMBNAIL_SPACING,
  SWIPE_THRESHOLD,
  DOUBLE_TAP_DELAY,
  DEFAULT_ROUTE_COLOR,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from './constants'

// Utilities
export {
  getPathStartPoint,
  transformPath,
  calculateDisplayDimensions,
  calculateFullscreenDimensions,
  isRouteLineSelected,
  getRouteLineColor,
} from './utils'
