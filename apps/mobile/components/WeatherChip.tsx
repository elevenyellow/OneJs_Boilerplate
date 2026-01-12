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

interface WeatherChipProps {
  /** Latitude coordinate */
  latitude: number
  /** Longitude coordinate */
  longitude: number
  /** Optional callback when chip is pressed */
  onPress?: () => void
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

/**
 * Get weather color based on conditions
 */
function getWeatherColor(code: number, precipProb: number): string {
  // Rainy/snow conditions
  if (code >= 8 && code <= 15) {
    return '#3B82F6' // Blue for precipitation
  }
  // Thunderstorm
  if (code >= 16) {
    return '#7C3AED' // Purple for storm
  }
  // High precipitation probability
  if (precipProb >= 50) {
    return '#3B82F6' // Blue
  }
  // Cloudy
  if (code >= 4 && code <= 7) {
    return '#6B7280' // Gray for cloudy
  }
  // Sunny/good weather
  return '#F59E0B' // Amber for sunny
}

/**
 * Compact weather chip that integrates with stats grid
 * Shows temperature and weather icon, clickable for full details
 */
export function WeatherChip({
  latitude,
  longitude,
  onPress,
  style,
}: WeatherChipProps) {
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
      <View style={[styles.chip, { backgroundColor: colors.muted }, style]}>
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
  const precipProb = today.precipitation.probability
  const windSpeed = today.wind.mean
  const humidity = today.humidity?.mean ?? null
  const weatherCode = today.weatherCode

  const weatherColor = getWeatherColor(weatherCode, precipProb)
  const weatherIcon = getWeatherIcon(weatherCode)

  // Convert wind from m/s to km/h
  const windKmh = windSpeed * 3.6

  const content = (
    <View style={[styles.chip, { backgroundColor: colors.muted }, style]}>
      {/* Weather icon */}
      <Ionicons name={weatherIcon} size={18} color={weatherColor} />

      {/* Temperature range */}
      <View style={styles.tempContainer}>
        <Text style={[styles.tempText, { color: colors.text }]}>
          {Math.round(tempMin)}° / {Math.round(tempMax)}°
        </Text>
      </View>

      {/* Rain probability */}
      <View style={styles.detailItem}>
        <Ionicons name="rainy-outline" size={12} color="#3B82F6" />
        <Text style={[styles.detailText, { color: '#3B82F6' }]}>
          {Math.round(precipProb)}%
        </Text>
      </View>

      {/* Humidity */}
      {humidity !== null && (
        <View style={styles.detailItem}>
          <Ionicons name="water-outline" size={12} color="#06B6D4" />
          <Text style={[styles.detailText, { color: '#06B6D4' }]}>
            {Math.round(humidity)}%
          </Text>
        </View>
      )}

      {/* Wind */}
      <View style={styles.detailItem}>
        <Ionicons name="leaf-outline" size={12} color="#10B981" />
        <Text style={[styles.detailText, { color: '#10B981' }]}>
          {Math.round(windKmh)}
        </Text>
      </View>

      {/* Chevron for navigation */}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={14}
          color={colors.textSecondary}
          style={styles.chevron}
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 2,
  },
})
