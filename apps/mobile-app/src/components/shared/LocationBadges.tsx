import { memo, useMemo } from 'react'
import { View, Text } from 'react-native'
import {
  getCrowdsIconAndColor,
  getTemperatureRecommendationColor,
} from '@/utils/icons'
import {
  CompassOutlineIcon,
  HappyOutlineIcon,
  WarningOutlineIcon,
  MapOutlineIcon,
  ThermometerOutlineIcon,
} from './icons'
import { colors } from '@/theme/colors'

export interface LocationBadgesData {
  /** Family friendly tag: KID_FRIENDLY or NOT_KID_FRIENDLY */
  tagFamily?: string | null
  /** Crowds tag: DESERTED, QUIET, BUSY, CROWDED */
  tagCrowds?: string | null
  /** Orientation/aspect: N, NE, E, SE, S, SW, W, NW */
  orientation?: string | null
  /** Has topo available */
  hasTopo?: boolean
  /** Temperature (raw number for color calculation) */
  temperature?: number
  /** Temperature recommendation: good, moderate, poor */
  temperatureRecommendation?: 'good' | 'moderate' | 'poor' | null
}

interface LocationBadgesProps {
  data: LocationBadgesData
  iconSize?: number
}

/**
 * Shared component for displaying icon-only badges row in location cards.
 * Shows family-friendly, crowds, orientation, temperature, and topo icons.
 * Memoized to prevent unnecessary re-renders.
 */
export const LocationBadges = memo(function LocationBadges({
  data,
  iconSize = 16,
}: LocationBadgesProps) {
  const {
    tagFamily,
    tagCrowds,
    orientation,
    hasTopo,
    temperatureRecommendation,
  } = data

  // Memoize crowds icon lookup
  const crowdsIconData = useMemo(() => {
    if (!tagCrowds) return null
    return getCrowdsIconAndColor(tagCrowds)
  }, [tagCrowds])

  // Memoize temperature recommendation color
  const tempColor = useMemo(() => {
    if (!temperatureRecommendation) return null
    return getTemperatureRecommendationColor(temperatureRecommendation)
  }, [temperatureRecommendation])

  const hasBadges =
    tagFamily ||
    tagCrowds ||
    orientation ||
    temperatureRecommendation ||
    hasTopo

  if (!hasBadges) {
    return null
  }

  return (
    <View className="flex-row items-center gap-3 mt-2">
      {/* Family friendly indicator */}
      {tagFamily && (
        <View className="items-center justify-center">
          {tagFamily === 'KID_FRIENDLY' ? (
            <HappyOutlineIcon size={iconSize} color={colors.status.success} />
          ) : (
            <WarningOutlineIcon size={iconSize} color={colors.status.warning} />
          )}
        </View>
      )}

      {/* Crowds indicator */}
      {crowdsIconData && (
        <View className="items-center justify-center">
          <crowdsIconData.Icon size={iconSize} color={crowdsIconData.color} />
        </View>
      )}

      {/* Orientation indicator */}
      {orientation && (
        <View className="flex-row items-center">
          <CompassOutlineIcon size={iconSize - 2} color={colors.text.muted} />
          <Text className="text-gray-400 text-xs ml-0.5">{orientation}</Text>
        </View>
      )}

      {/* Temperature recommendation */}
      {temperatureRecommendation && tempColor && (
        <View className="items-center justify-center">
          <ThermometerOutlineIcon size={iconSize} color={tempColor} />
        </View>
      )}

      {/* Topo available */}
      {hasTopo && (
        <View className="items-center justify-center">
          <MapOutlineIcon size={iconSize} color={colors.accent.DEFAULT} />
        </View>
      )}
    </View>
  )
})
