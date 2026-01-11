import { Colors } from '@/constants/Colors'
import { useWeatherByCoordinates } from '@/hooks/useWeatherByCoordinates'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native'

interface WeatherCardProps {
  /** Latitude coordinate */
  latitude: number
  /** Longitude coordinate */
  longitude: number
  /** Optional callback when card is pressed */
  onPress?: () => void
  /** Show chevron indicator for navigation */
  showChevron?: boolean
  /** Optional container style */
  style?: ViewStyle
}

/**
 * Map weather codes to Ionicons icon names
 */
function getWeatherIcon(code: number): keyof typeof Ionicons.glyphMap {
  switch (code) {
    case 1:
      return 'sunny'
    case 2:
    case 3:
      return 'partly-sunny'
    case 4:
    case 5:
      return 'cloudy'
    case 6:
    case 7:
      return 'cloud'
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
      return 'rainy'
    case 13:
    case 14:
    case 15:
      return 'snow'
    case 16:
    case 17:
      return 'thunderstorm'
    default:
      return 'partly-sunny'
  }
}

export function WeatherCard({
  latitude,
  longitude,
  onPress,
  showChevron = false,
  style,
}: WeatherCardProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const { data: weatherData, isLoading } = useWeatherByCoordinates(
    latitude,
    longitude,
    latitude !== null && longitude !== null,
  )

  // Loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.weatherCard,
          styles.loadingCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          style,
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  // No data
  if (!weatherData?.daily?.[0]) {
    return null
  }

  const today = weatherData.daily[0]
  const tempMax = today.temperature.max
  const tempMin = today.temperature.min
  const tempMean = today.temperature.mean
  const precipProb = today.precipitation.probability
  const windSpeed = today.wind.mean
  const weatherCode = today.weatherCode

  const content = (
    <View
      style={[
        styles.weatherCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      <View style={styles.weatherCardLeft}>
        <Ionicons
          name={getWeatherIcon(weatherCode)}
          size={48}
          color={colors.primary}
        />
        <View style={styles.weatherCardInfo}>
          <Text style={[styles.weatherCardTemp, { color: colors.text }]}>
            {Math.round(tempMean)}°C
          </Text>
          <Text
            style={[styles.weatherCardRange, { color: colors.textSecondary }]}
          >
            {Math.round(tempMin)}° / {Math.round(tempMax)}°
          </Text>
        </View>
      </View>
      <View style={styles.weatherCardRight}>
        <View style={styles.weatherCardDetail}>
          <Ionicons name="water" size={16} color="#3B82F6" />
          <Text
            style={[
              styles.weatherCardDetailText,
              { color: colors.textSecondary },
            ]}
          >
            {Math.round(precipProb)}%
          </Text>
        </View>
        <View style={styles.weatherCardDetail}>
          <Ionicons name="leaf" size={16} color="#10B981" />
          <Text
            style={[
              styles.weatherCardDetailText,
              { color: colors.textSecondary },
            ]}
          >
            {Math.round(windSpeed)} m/s
          </Text>
        </View>
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      )}
    </View>
  )

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>
  }

  return content
}

const styles = StyleSheet.create({
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  loadingCard: {
    justifyContent: 'center',
    minHeight: 80,
  },
  weatherCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherCardInfo: {
    gap: 2,
  },
  weatherCardTemp: {
    fontSize: 28,
    fontWeight: '700',
  },
  weatherCardRange: {
    fontSize: 14,
  },
  weatherCardRight: {
    flexDirection: 'row',
    gap: 16,
    marginRight: 12,
  },
  weatherCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherCardDetailText: {
    fontSize: 14,
  },
})
