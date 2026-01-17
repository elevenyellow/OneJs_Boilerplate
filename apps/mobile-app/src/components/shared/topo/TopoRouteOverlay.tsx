import Svg, { Path, G } from 'react-native-svg'
import type { RouteLineData } from './types'
import { transformPath, isRouteLineSelected, getRouteLineColor } from './utils'
import { DEFAULT_ROUTE_COLOR } from './constants'

interface TopoRouteOverlayProps {
  /**
   * Route lines to render
   */
  routeLines: RouteLineData[]

  /**
   * Width of the overlay container
   */
  width: number

  /**
   * Height of the overlay container
   */
  height: number

  /**
   * Scale factor for X coordinates
   */
  scaleX: number

  /**
   * Scale factor for Y coordinates
   */
  scaleY: number

  /**
   * Currently selected route ID
   */
  selectedRouteId?: string

  /**
   * Currently selected route external ID
   */
  selectedRouteExternalId?: string

  /**
   * Color override for selected route
   */
  selectedRouteColor?: string

  /**
   * Callback when a route line is pressed
   */
  onRoutePress?: (routeId: string) => void
}

/**
 * SVG overlay for rendering route lines on topo image
 */
export function TopoRouteOverlay({
  routeLines,
  width,
  height,
  scaleX,
  scaleY,
  selectedRouteId,
  selectedRouteExternalId,
  selectedRouteColor,
  onRoutePress,
}: TopoRouteOverlayProps) {
  // Check if any route is selected
  const hasSelectedRoute =
    selectedRouteId !== undefined || selectedRouteExternalId !== undefined

  return (
    <Svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
      }}
    >
      {routeLines.map((line) => {
        const isSelected = isRouteLineSelected(
          line,
          selectedRouteId,
          selectedRouteExternalId,
        )
        const transformedPath = transformPath(line.svgPath, scaleX, scaleY)
        const lineColor = getRouteLineColor(
          line,
          isSelected,
          selectedRouteColor,
          DEFAULT_ROUTE_COLOR,
        )

        // Determine opacity based on selection state
        const lineOpacity = hasSelectedRoute ? (isSelected ? 1 : 0.3) : 0.85

        return (
          <G key={line.id}>
            {/* Route line */}
            <Path
              d={transformedPath}
              stroke={lineColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={lineOpacity}
            />

            {/* Invisible touch target - wider for easier tapping */}
            <Path
              d={transformedPath}
              stroke="transparent"
              strokeWidth={20}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              onPress={() => {
                // Use routeId if available, otherwise fall back to externalRouteId
                const idToUse = line.routeId || line.externalRouteId
                if (idToUse) {
                  onRoutePress?.(idToUse)
                }
              }}
            />
          </G>
        )
      })}
    </Svg>
  )
}
