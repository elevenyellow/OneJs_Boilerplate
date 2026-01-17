import { memo, useMemo } from 'react'
import { View, Text } from 'react-native'
import { useUnits } from '@/hooks/useUnits'
import {
  SunnyIcon,
  CloudIcon,
  PartlySunnyIcon,
  CloudyIcon,
  RainyIcon,
  ThunderstormIcon,
  SnowIcon,
  ThermometerOutlineIcon,
} from './icons'
import { colors } from '@/theme/colors'
import {
  formatWindSpeed,
  formatHumidity,
  getWindConditionColor,
  getHumidityConditionColor,
  getSyntheticWindSpeed,
  getSyntheticHumidity,
} from '@/utils/cragHelpers'
import type { WeatherConditionsDto } from '@/types/api'

type Condition =
  | 'sun'
  | 'shade'
  | 'partial'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'snow'

interface WeatherIndicatorsCompactProps {
  /** Current temperature in Celsius */
  temperature?: number
  /** Weather condition (sun, shade, etc.) */
  condition?: Condition
  /** Weather conditions from API */
  weatherConditions?: WeatherConditionsDto
}

/**
 * Compact weather indicators component.
 * Displays condition icon, temperature, wind, and humidity in a single row.
 * Designed to be placed in the header area next to the sector name.
 */
export const WeatherIndicatorsCompact = memo(function WeatherIndicatorsCompact({
  temperature,
  condition,
  weatherConditions,
}: WeatherIndicatorsCompactProps) {
  const { formatTemperature } = useUnits()

  // Get color based on weather conditions quality (consistent with wind/humidity)
  const conditionColor = useMemo(() => {
    switch (weatherConditions?.label) {
      case 'excellent':
        return colors.status.success
      case 'good':
        return colors.accent.DEFAULT
      case 'fair':
        return colors.status.warning
      case 'poor':
        return colors.status.error
      default:
        return colors.text.secondary
    }
  }, [weatherConditions?.label])

  // Get weather icon based on condition type (color is consistent with other indicators)
  const WeatherIcon = useMemo(() => {
    switch (condition) {
      case 'sun':
        return SunnyIcon
      case 'partial':
        return PartlySunnyIcon
      case 'shade':
        return CloudIcon
      case 'cloudy':
        return CloudyIcon
      case 'rain':
        return RainyIcon
      case 'storm':
        return ThunderstormIcon
      case 'snow':
        return SnowIcon
      default:
        return CloudIcon
    }
  }, [condition])

  // Calculate synthetic wind and humidity data
  const windSpeed = useMemo(
    () =>
      weatherConditions?.windScore !== undefined
        ? Math.round((1 - weatherConditions.windScore / 3) * 35 + 5)
        : getSyntheticWindSpeed(weatherConditions?.overallScore),
    [weatherConditions],
  )

  const humidity = useMemo(
    () =>
      weatherConditions?.humidityScore !== undefined
        ? Math.round((1 - weatherConditions.humidityScore / 3) * 50 + 30)
        : getSyntheticHumidity(weatherConditions?.overallScore),
    [weatherConditions],
  )

  const windColor = useMemo(() => getWindConditionColor(windSpeed), [windSpeed])
  const humidityColor = useMemo(
    () => getHumidityConditionColor(humidity),
    [humidity],
  )

  // Don't render if no data available
  if (temperature === undefined && !weatherConditions) {
    return null
  }

  return (
    <View className="flex-row items-center gap-2 ml-2">
      {/* Condition icon - uses same color scheme as wind/humidity */}
      <WeatherIcon size={12} color={conditionColor} />

      {/* Temperature */}
      {temperature !== undefined && (
        <View className="flex-row items-center">
          <ThermometerOutlineIcon size={10} color={colors.accent.DEFAULT} />
          <Text
            className="text-xs ml-0.5"
            style={{ color: colors.accent.DEFAULT }}
          >
            {formatTemperature(temperature, { includeUnit: false })}°
          </Text>
        </View>
      )}

      {/* Wind */}
      <View className="flex-row items-center">
        <Text className="text-xs">💨</Text>
        <Text className="text-xs ml-0.5" style={{ color: windColor }}>
          {formatWindSpeed(windSpeed)}
        </Text>
      </View>

      {/* Humidity */}
      <View className="flex-row items-center">
        <Text className="text-xs">💧</Text>
        <Text className="text-xs ml-0.5" style={{ color: humidityColor }}>
          {formatHumidity(humidity)}
        </Text>
      </View>
    </View>
  )
})
