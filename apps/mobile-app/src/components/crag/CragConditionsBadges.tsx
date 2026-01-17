import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  SunnyIcon,
  ThermometerOutlineIcon,
  SpeedometerOutlineIcon,
} from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import { usePreferences } from '@/contexts/PreferencesContext'
import type { SectorWithPhoto } from './types'
import type { CurrentWeatherDto } from '@/types/api'

interface CragConditionsBadgesProps {
  sector: SectorWithPhoto | null
  currentWeather?: CurrentWeatherDto | null
  isLoading?: boolean
}

function formatTemperature(
  celsius: number,
  unit: 'celsius' | 'fahrenheit',
): string {
  if (unit === 'fahrenheit') {
    const fahrenheit = Math.round(celsius * 1.8 + 32)
    return `${fahrenheit}°F`
  }
  return `${Math.round(celsius)}°C`
}

export function CragConditionsBadges({
  sector,
  currentWeather,
  isLoading,
}: CragConditionsBadgesProps) {
  const { t } = useTranslation()
  const { preferences } = usePreferences()
  const temperatureUnit = preferences.temperatureUnit || 'celsius'

  // Get sun/shade label from weatherLabels or aspect
  const sunShadeLabel =
    sector?.weatherLabels?.[0] || sector?.aspectLabel || null

  // Get real-time weather data from the API
  const temperature = currentWeather?.temperature ?? null
  const windSpeed = currentWeather?.windSpeed ?? null

  if (isLoading) {
    return (
      <View className="flex-row justify-around py-4 px-4 bg-card">
        {[1, 2, 3].map((i) => (
          <View key={i} className="items-center">
            <View className="w-10 h-10 rounded-full bg-card-elevated mb-2" />
            <View className="w-16 h-3 bg-card-elevated rounded mb-1" />
            <View className="w-12 h-3 bg-card-elevated rounded" />
          </View>
        ))}
      </View>
    )
  }

  return (
    <View className="flex-row justify-around py-4 px-4 bg-card border-t border-border">
      {/* Sun/Shade - based on sector orientation */}
      <View className="items-center">
        <View className="w-10 h-10 rounded-full bg-card-elevated items-center justify-center mb-2">
          <SunnyIcon size={20} color={colors.grade.medium} />
        </View>
        <Text className="text-gray-500 text-[10px] uppercase tracking-wider">
          {t('crag.conditions.sunShade')}
        </Text>
        <Text className="text-white text-sm font-medium">
          {sunShadeLabel || '--'}
        </Text>
      </View>

      {/* Temperature - from real-time API */}
      <View className="items-center">
        <View className="w-10 h-10 rounded-full bg-card-elevated items-center justify-center mb-2">
          <ThermometerOutlineIcon size={20} color={colors.accent.DEFAULT} />
        </View>
        <Text className="text-gray-500 text-[10px] uppercase tracking-wider">
          {t('crag.conditions.temp')}
        </Text>
        <Text className="text-white text-sm font-medium">
          {temperature !== null
            ? formatTemperature(temperature, temperatureUnit)
            : '--'}
        </Text>
      </View>

      {/* Wind - from real-time API */}
      <View className="items-center">
        <View className="w-10 h-10 rounded-full bg-card-elevated items-center justify-center mb-2">
          <SpeedometerOutlineIcon size={20} color={colors.text.secondary} />
        </View>
        <Text className="text-gray-500 text-[10px] uppercase tracking-wider">
          {t('crag.conditions.wind')}
        </Text>
        <Text className="text-white text-sm font-medium">
          {windSpeed !== null ? `${Math.round(windSpeed)} km/h` : '--'}
        </Text>
      </View>
    </View>
  )
}
