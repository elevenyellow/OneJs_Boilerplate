import { memo, useMemo } from 'react'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { formatGradeRangeFromBands, type GradeSystem } from '@/utils/grades'
import { usePreferences } from '@/contexts/PreferencesContext'
import { getWeatherIcon } from '@/utils/icons'
import { BaseLocationCard } from './BaseLocationCard'
import { LocationBadges } from './LocationBadges'
import {
  ImagesOutlineIcon,
  LayersOutlineIcon,
  ChevronForwardIcon,
} from './icons'
import { colors } from '@/theme/colors'

interface ZoneSectorData {
  id: string
  name: string
  numberRoutes: number
  hasSubSectors: boolean
  hasTopo: boolean
  imageUrl: string
  hasOwnPhoto: boolean
  // Grade range as gradeBand indices - converted to display internally
  minGradeBand: number | null
  maxGradeBand: number | null
  starRating: number
  subAreaCount: number | null
  // Tag-based indicators (icon-only display)
  tagFamily?: string | null // KID_FRIENDLY, NOT_KID_FRIENDLY
  tagCrowds?: string | null // DESERTED, QUIET, BUSY, CROWDED
  // Orientation (can come as 'aspect' or 'orientation' from API)
  aspect?: string | null // N, NE, E, SE, S, SW, W, NW (from API)
  orientation?: string | null // Alternative field name
  // API-provided fields for real-time conditions
  temperatureRecommendation?: 'good' | 'moderate' | 'poor' | null
  weatherCondition?: 'sunny' | 'cloudy' | 'partly_cloudy' | null
}

interface ZoneSectorListItemProps {
  sector: ZoneSectorData
  isSelected?: boolean
  onPress?: () => void
}

/**
 * Memoized zone sector list item component.
 * Optimized for FlatList rendering.
 */
export const ZoneSectorListItem = memo(function ZoneSectorListItem({
  sector,
  isSelected,
  onPress,
}: ZoneSectorListItemProps) {
  const { t } = useTranslation()
  const { preferences } = usePreferences()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem

  // Memoize grade range conversion
  const gradeRange = useMemo(
    () =>
      formatGradeRangeFromBands(
        sector.minGradeBand,
        sector.maxGradeBand,
        gradeSystem,
      ),
    [sector.minGradeBand, sector.maxGradeBand, gradeSystem],
  )

  // Use aspect or orientation (both mean the same thing)
  const sectorOrientation = sector.aspect || sector.orientation

  // Memoize badges data
  const badgesData = useMemo(
    () => ({
      tagFamily: sector.tagFamily,
      tagCrowds: sector.tagCrowds,
      orientation: sectorOrientation,
      temperatureRecommendation: sector.temperatureRecommendation,
      hasTopo: sector.hasTopo,
    }),
    [
      sector.tagFamily,
      sector.tagCrowds,
      sectorOrientation,
      sector.temperatureRecommendation,
      sector.hasTopo,
    ],
  )

  // Memoize weather icon
  const WeatherIcon = useMemo(
    () =>
      sector.weatherCondition ? getWeatherIcon(sector.weatherCondition) : null,
    [sector.weatherCondition],
  )

  // Weather condition badge (shown inline in badges)
  const badgesSlot = (
    <View className="flex-row items-center gap-3 mt-2">
      <LocationBadges data={badgesData} />

      {/* Weather condition icon */}
      {WeatherIcon && (
        <View className="items-center justify-center">
          <WeatherIcon size={16} color={colors.condition.sol} />
        </View>
      )}
    </View>
  )

  // Image overlay for non-own photos
  const imageOverlay = !sector.hasOwnPhoto ? (
    <View className="absolute bottom-1 right-1 bg-black/70 rounded px-1">
      <ImagesOutlineIcon size={10} color={colors.text.secondary} />
    </View>
  ) : null

  // Right slot with chevron
  const rightSlot = (
    <View className="justify-center ml-2">
      <ChevronForwardIcon
        size={20}
        color={isSelected ? colors.accent.DEFAULT : colors.text.muted}
      />
    </View>
  )

  return (
    <BaseLocationCard
      name={sector.name}
      imageUrl={sector.imageUrl}
      isSelected={isSelected}
      onPress={onPress}
      starRating={sector.starRating}
      hasHorizontalMargin={true}
      badgesSlot={badgesSlot}
      imageOverlay={imageOverlay}
      rightSlot={rightSlot}
    >
      <Text className="text-gray-400 text-sm">
        {t('sector.routeCount', { count: sector.numberRoutes })}
        {gradeRange ? ` · ${gradeRange}` : ''}
      </Text>

      {/* Subsectors indicator */}
      {sector.hasSubSectors && sector.subAreaCount && (
        <View className="flex-row items-center mt-1">
          <LayersOutlineIcon size={12} color={colors.accent.DEFAULT} />
          <Text className="text-accent text-xs ml-1">
            {t('sector.subsectorsCount', { count: sector.subAreaCount })}
          </Text>
        </View>
      )}
    </BaseLocationCard>
  )
})
