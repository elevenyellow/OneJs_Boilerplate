import { memo } from 'react'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useUnits } from '@/hooks/useUnits'
import { getConditionIcon } from '@/utils/icons'
import { ThermometerOutlineIcon, FlagOutlineIcon, NavigateIcon } from './icons'

type Condition = 'sun' | 'shade' | 'partial' | 'cloudy'

interface ConditionBadgeProps {
  temperature?: number
  condition?: Condition
  windSpeed?: number
  distanceKm?: number
  compact?: boolean
}

/**
 * Memoized condition badge component.
 * Displays weather conditions, temperature, and distance info.
 */
export const ConditionBadge = memo(function ConditionBadge({
  temperature,
  condition,
  windSpeed,
  distanceKm,
  compact = false,
}: ConditionBadgeProps) {
  const { t } = useTranslation()
  const { formatTemperature, formatDistance } = useUnits()

  // Memoize the condition icon lookup
  const ConditionIcon = condition ? getConditionIcon(condition) : null

  if (compact) {
    return (
      <View className="flex-row items-center gap-3">
        {temperature !== undefined && (
          <View className="flex-row items-center">
            <ThermometerOutlineIcon size={14} />
            <Text className="text-accent text-xs ml-1">
              {formatTemperature(temperature)}
            </Text>
          </View>
        )}
        {windSpeed !== undefined && (
          <View className="flex-row items-center">
            <FlagOutlineIcon size={14} />
            <Text className="text-gray-400 text-xs ml-1">{windSpeed}km/h</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <View className="flex-row items-center justify-around py-3">
      {temperature !== undefined && (
        <View className="items-center">
          <ThermometerOutlineIcon size={20} />
          <Text className="text-white font-bold mt-1">
            {formatTemperature(temperature)}
          </Text>
        </View>
      )}

      {condition && ConditionIcon && (
        <View className="items-center">
          <ConditionIcon size={20} />
          <Text className="text-gray-400 text-xs mt-1 uppercase">
            {t(`conditions.${condition}`)}
          </Text>
        </View>
      )}

      {distanceKm !== undefined && (
        <View className="items-center">
          <NavigateIcon size={20} />
          <Text className="text-white font-bold mt-1">
            {formatDistance(distanceKm)}
          </Text>
        </View>
      )}
    </View>
  )
})
