import { memo } from 'react'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useUnits } from '@/hooks/useUnits'
import {
  ThermometerOutlineIcon,
  SunnyIcon,
  CloudIcon,
  PartlySunnyIcon,
  NavigateIcon,
} from '@/components/shared/icons'
import { colors } from '@/theme/colors'

type WeatherCondition = 'shade' | 'sun' | 'partial' | 'cloudy'

interface SectorCardWeatherRowProps {
  /** Temperature in Celsius */
  temperature?: number
  /** Weather/shade condition */
  condition?: WeatherCondition
  /** Distance in kilometers */
  distanceKm?: number
}

/**
 * Returns the appropriate icon and color for weather condition.
 */
function getConditionIconAndColor(condition: WeatherCondition) {
  switch (condition) {
    case 'sun':
      return {
        Icon: SunnyIcon,
        color: colors.status.warning,
      }
    case 'shade':
      return {
        Icon: CloudIcon,
        color: colors.text.secondary,
      }
    case 'partial':
      return {
        Icon: PartlySunnyIcon,
        color: colors.status.warning,
      }
    case 'cloudy':
      return {
        Icon: CloudIcon,
        color: colors.text.secondary,
      }
    default:
      return {
        Icon: PartlySunnyIcon,
        color: colors.text.secondary,
      }
  }
}

/**
 * Row displaying weather indicators: temperature, sun/shade condition, and distance.
 * Used in SectorCard to show current conditions at a glance.
 */
export const SectorCardWeatherRow = memo(function SectorCardWeatherRow({
  temperature,
  condition,
  distanceKm,
}: SectorCardWeatherRowProps) {
  const { t } = useTranslation()
  const { formatDistance, formatTemperature } = useUnits()

  const conditionInfo = condition ? getConditionIconAndColor(condition) : null
  const conditionLabel = condition ? t(`conditions.${condition}`) : null

  return (
    <View className="flex-row items-center justify-between py-3 border-t border-b border-border-muted">
      {/* Temperature */}
      {temperature !== undefined && (
        <View className="flex-row items-center flex-1 justify-center">
          <ThermometerOutlineIcon size={18} color={colors.text.secondary} />
          <Text className="text-white text-sm font-medium ml-1.5">
            {formatTemperature(temperature)}
          </Text>
        </View>
      )}

      {/* Condition (Sun/Shade) */}
      {conditionInfo && condition && (
        <View className="flex-row items-center flex-1 justify-center border-l border-r border-border-muted">
          <conditionInfo.Icon size={18} color={conditionInfo.color} />
          <Text className="text-gray-400 text-sm ml-1.5 uppercase">
            {conditionLabel}
          </Text>
        </View>
      )}

      {/* Distance */}
      {distanceKm !== undefined && (
        <View className="flex-row items-center flex-1 justify-center">
          <NavigateIcon size={18} color={colors.accent.DEFAULT} />
          <Text className="text-white text-sm font-medium ml-1.5">
            {formatDistance(distanceKm)}
          </Text>
        </View>
      )}
    </View>
  )
})
