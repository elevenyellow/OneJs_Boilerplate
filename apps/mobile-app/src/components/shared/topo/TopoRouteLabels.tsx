import { View, Text, TouchableOpacity } from 'react-native'
import type { RouteLineData } from './types'
import {
  getPathStartPoint,
  isRouteLineSelected,
  getRouteLineColor,
} from './utils'
import { DEFAULT_ROUTE_COLOR } from './constants'
import { colors } from '@/theme/colors'

interface TopoRouteLabelsProps {
  /**
   * Route lines to render labels for
   */
  routeLines: RouteLineData[]

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
   * Callback when a route label is pressed
   */
  onRoutePress?: (routeId: string) => void

  /**
   * Whether in fullscreen mode (larger labels)
   */
  isFullscreen?: boolean
}

/**
 * Route number labels at the start point of each route line
 */
export function TopoRouteLabels({
  routeLines,
  scaleX,
  scaleY,
  selectedRouteId,
  selectedRouteExternalId,
  selectedRouteColor,
  onRoutePress,
  isFullscreen = false,
}: TopoRouteLabelsProps) {
  // Check if any route is selected
  const hasSelectedRoute =
    selectedRouteId !== undefined || selectedRouteExternalId !== undefined

  // Sort labels so selected route renders last (on top)
  const sortedLines = [...routeLines].sort((a, b) => {
    const aSelected = isRouteLineSelected(
      a,
      selectedRouteId,
      selectedRouteExternalId,
    )
      ? 1
      : 0
    const bSelected = isRouteLineSelected(
      b,
      selectedRouteId,
      selectedRouteExternalId,
    )
      ? 1
      : 0
    return aSelected - bSelected
  })

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {sortedLines.map((line) => {
        const startPoint = getPathStartPoint(line.svgPath)
        if (!startPoint) return null

        const scaledX = startPoint.x * scaleX
        const scaledY = startPoint.y * scaleY
        const isSelected = isRouteLineSelected(
          line,
          selectedRouteId,
          selectedRouteExternalId,
        )

        const labelColor = getRouteLineColor(
          line,
          isSelected,
          selectedRouteColor,
          DEFAULT_ROUTE_COLOR,
        )

        // Sizes based on mode and selection state
        const size = isFullscreen
          ? isSelected
            ? 22
            : 16
          : isSelected
            ? 18
            : 14
        const fontSize = isFullscreen
          ? isSelected
            ? 12
            : 9
          : isSelected
            ? 10
            : 8
        const labelOpacity = hasSelectedRoute ? (isSelected ? 1 : 0.5) : 0.85

        return (
          <TouchableOpacity
            key={`label-${line.id}`}
            style={{
              position: 'absolute',
              left: scaledX - size / 2,
              top: scaledY - size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isSelected ? labelColor : 'rgba(0,0,0,0.7)',
              borderWidth: isSelected ? 0 : 1,
              borderColor: labelColor,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: labelOpacity,
              zIndex: isSelected ? 100 : 1,
            }}
            onPress={() => {
              // Use routeId if available, otherwise fall back to externalRouteId
              const idToUse = line.routeId || line.externalRouteId
              if (idToUse) {
                onRoutePress?.(idToUse)
              }
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={{
                color: colors.text.primary,
                fontSize,
                fontWeight: 'bold',
              }}
            >
              {line.topoNumber}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
