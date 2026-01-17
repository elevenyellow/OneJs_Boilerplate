import { memo, useMemo } from 'react'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { ZoneSectorUI } from '@/types/ui'
import { getWeatherIcon } from '@/utils/icons'
import { BaseLocationCard } from './BaseLocationCard'
import { LocationBadges } from './LocationBadges'
import { ConditionBadge } from './ConditionBadge'
import { colors } from '@/theme/colors'

interface SectorListItemProps {
  sector: ZoneSectorUI
  isSelected?: boolean
  onPress?: () => void
}

/**
 * Memoized sector list item component.
 * Optimized for FlatList rendering.
 */
export const SectorListItem = memo(function SectorListItem({
  sector,
  isSelected,
  onPress,
}: SectorListItemProps) {
  const { t } = useTranslation()

  // Use aspect as orientation (API field)
  const sectorOrientation = sector.aspectLabel?.split(' ').pop() // Get just the direction (N, S, etc.)

  // Check if sector has topos
  const hasTopo =
    sector.numberTopos !== undefined &&
    sector.numberTopos !== null &&
    sector.numberTopos > 0

  // Memoize badges data to prevent object recreation
  const badgesData = useMemo(
    () => ({
      tagFamily: sector.tagFamily,
      tagCrowds: sector.tagCrowds,
      orientation: sectorOrientation,
      temperature: sector.temperature,
      hasTopo,
    }),
    [
      sector.tagFamily,
      sector.tagCrowds,
      sectorOrientation,
      sector.temperature,
      hasTopo,
    ],
  )

  // Memoize weather icon to prevent recreation
  const WeatherIcon = useMemo(
    () => getWeatherIcon(sector.condition),
    [sector.condition],
  )

  // Footer row with condition badge and weather icon
  const footerSlot = (
    <View className="flex-row items-center justify-between mt-2">
      <ConditionBadge temperature={sector.temperature} compact />

      {/* Weather icon only */}
      <View className="items-center justify-center">
        <WeatherIcon size={16} color={colors.condition.sol} />
      </View>
    </View>
  )

  return (
    <BaseLocationCard
      name={sector.name}
      imageUrl={sector.imageUrl}
      isSelected={isSelected}
      onPress={onPress}
      starRating={sector.starRating}
      hasHorizontalMargin={false}
      badgesSlot={<LocationBadges data={badgesData} />}
      footerSlot={footerSlot}
    >
      <Text className="text-gray-400 text-sm">
        {t('sector.routesSummary', {
          count: sector.routeCount,
          gradeRange: sector.gradeRange,
        })}
      </Text>
    </BaseLocationCard>
  )
})
