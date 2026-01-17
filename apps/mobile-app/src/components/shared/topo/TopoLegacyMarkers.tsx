import { Text, TouchableOpacity } from 'react-native'
import Svg, { Path, G } from 'react-native-svg'
import type { LegacyTopoMarker } from './types'
import { SCREEN_WIDTH, IMAGE_HEIGHT } from './constants'
import { colors } from '@/theme/colors'

interface TopoLegacyMarkersProps {
  /**
   * Legacy markers to render
   */
  markers: LegacyTopoMarker[]

  /**
   * Currently selected route ID
   */
  selectedRouteId?: string

  /**
   * Callback when a marker is pressed
   */
  onRoutePress?: (routeId: string) => void
}

/**
 * Legacy marker rendering for backwards compatibility
 * @deprecated Use route lines with SVG paths instead
 */
export function TopoLegacyMarkers({
  markers,
  selectedRouteId,
  onRoutePress,
}: TopoLegacyMarkersProps) {
  if (!markers.length) return null

  return (
    <>
      <Svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SCREEN_WIDTH,
          height: IMAGE_HEIGHT,
        }}
      >
        {markers.map((marker) => {
          const x = (marker.x / 100) * SCREEN_WIDTH
          const y = (marker.y / 100) * IMAGE_HEIGHT
          const isSelected = marker.routeId === selectedRouteId
          const endY = IMAGE_HEIGHT - 20

          return (
            <G key={marker.routeId}>
              <Path
                d={`M ${x},${y + 12} L ${x},${endY}`}
                stroke={marker.color}
                strokeWidth={isSelected ? 3 : 2}
                strokeDasharray={isSelected ? undefined : '5,5'}
                opacity={isSelected ? 1 : 0.7}
              />
            </G>
          )
        })}
      </Svg>

      {markers.map((marker, index) => {
        const x = (marker.x / 100) * SCREEN_WIDTH
        const y = (marker.y / 100) * IMAGE_HEIGHT
        return (
          <TouchableOpacity
            key={`legacy-label-${marker.routeId}`}
            style={{
              position: 'absolute',
              left: x - 12,
              top: y - 12,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: marker.color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => onRoutePress?.(marker.routeId)}
          >
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              {marker.number ?? index + 1}
            </Text>
          </TouchableOpacity>
        )
      })}
    </>
  )
}
