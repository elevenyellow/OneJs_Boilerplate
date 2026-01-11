import { Colors } from '@/constants/Colors'
import { useWeatherByCoordinates } from '@/hooks/useWeatherByCoordinates'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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

function formatDayName(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return weekdays[date.getDay()]
}

function formatHour(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function SectorWeatherScreen() {
  const { lat, lon, name } = useLocalSearchParams<{
    lat: string
    lon: string
    name: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const latitude = lat ? parseFloat(lat) : null
  const longitude = lon ? parseFloat(lon) : null

  const { data: weatherData, isLoading } = useWeatherByCoordinates(
    latitude ?? 0,
    longitude ?? 0,
    latitude !== null && longitude !== null,
  )

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const forecast = weatherData?.daily || []
  const hourlyForecast = weatherData?.hourly || []
  const today = forecast[0]

  // Filter hourly to show next 24 hours
  const now = new Date()
  const next24Hours = hourlyForecast.filter((hour) => {
    const hourDate = new Date(hour.timestamp)
    const diffHours = (hourDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return diffHours >= -1 && diffHours <= 24
  })

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, paddingTop: insets.top + 8 },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Weather
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {name || 'Sector'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Conditions - First */}
        {today && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Climbing Conditions Today
            </Text>
            <View style={[styles.currentCard, { backgroundColor: colors.card }]}>
              {/* Main weather display */}
              <View style={styles.currentMain}>
                <Ionicons
                  name={getWeatherIcon(today.weatherCode)}
                  size={64}
                  color={colors.primary}
                />
                <View style={styles.currentTemp}>
                  <Text style={[styles.currentTempText, { color: colors.text }]}>
                    {Math.round(today.temperature.mean)}°
                  </Text>
                  <Text style={[styles.currentTempRange, { color: colors.textSecondary }]}>
                    {Math.round(today.temperature.min)}° / {Math.round(today.temperature.max)}°
                  </Text>
                </View>
              </View>

              {/* Conditions grid */}
              <View style={styles.conditionsGrid}>
                <View style={styles.conditionItem}>
                  <Ionicons name="water-outline" size={20} color="#3B82F6" />
                  <Text style={[styles.conditionValue, { color: colors.text }]}>
                    {today.precipitation.probability}%
                  </Text>
                  <Text style={[styles.conditionLabel, { color: colors.textSecondary }]}>
                    Rain
                  </Text>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name="leaf-outline" size={20} color="#22C55E" />
                  <Text style={[styles.conditionValue, { color: colors.text }]}>
                    {Math.round(today.wind.mean)} km/h
                  </Text>
                  <Text style={[styles.conditionLabel, { color: colors.textSecondary }]}>
                    Wind
                  </Text>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name="sunny-outline" size={20} color="#F59E0B" />
                  <Text style={[styles.conditionValue, { color: colors.text }]}>
                    {today.uvIndex}
                  </Text>
                  <Text style={[styles.conditionLabel, { color: colors.textSecondary }]}>
                    UV Index
                  </Text>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name="water" size={20} color="#06B6D4" />
                  <Text style={[styles.conditionValue, { color: colors.text }]}>
                    {Math.round(today.humidity.mean)}%
                  </Text>
                  <Text style={[styles.conditionLabel, { color: colors.textSecondary }]}>
                    Humidity
                  </Text>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                  <Text style={[styles.conditionValue, { color: colors.text }]}>
                    {Math.round(today.sunshineMinutes / 60)}h
                  </Text>
                  <Text style={[styles.conditionLabel, { color: colors.textSecondary }]}>
                    Sunshine
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Hourly Forecast */}
        {next24Hours.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Hourly Forecast
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyScrollContent}
            >
              {next24Hours.map((hour, index) => (
                <View
                  key={hour.timestamp || index}
                  style={[styles.hourlyCard, { backgroundColor: colors.card }]}
                >
                  <Text style={[styles.hourlyTime, { color: colors.textSecondary }]}>
                    {formatHour(hour.timestamp)}
                  </Text>
                  <Ionicons
                    name={getWeatherIcon(hour.weatherCode)}
                    size={24}
                    color={hour.isDaylight ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.hourlyTemp, { color: colors.text }]}>
                    {Math.round(hour.temperature)}°
                  </Text>
                  <View style={styles.hourlyDetails}>
                    <View style={styles.hourlyDetail}>
                      <Ionicons name="water" size={10} color="#3B82F6" />
                      <Text style={[styles.hourlyDetailText, { color: colors.textSecondary }]}>
                        {Math.round(hour.precipitation)}%
                      </Text>
                    </View>
                    <View style={styles.hourlyDetail}>
                      <Ionicons name="leaf" size={10} color="#22C55E" />
                      <Text style={[styles.hourlyDetailText, { color: colors.textSecondary }]}>
                        {Math.round(hour.windSpeed)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 7-Day Forecast */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            7-Day Forecast
          </Text>
          <View style={[styles.forecastCard, { backgroundColor: colors.card }]}>
            {forecast.map((day, index) => (
              <View
                key={day.date || index}
                style={[
                  styles.forecastRow,
                  index < forecast.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={styles.forecastDayContainer}>
                  <Text style={[styles.forecastDay, { color: colors.text }]}>
                    {formatDayName(day.date)}
                  </Text>
                  <Text style={[styles.forecastDate, { color: colors.textSecondary }]}>
                    {new Date(day.date).getDate()}
                  </Text>
                </View>

                <View style={styles.forecastIconContainer}>
                  <Ionicons
                    name={getWeatherIcon(day.weatherCode || 1)}
                    size={28}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.forecastTempContainer}>
                  <Text style={[styles.forecastTempMax, { color: colors.text }]}>
                    {Math.round(day.temperature.max)}°
                  </Text>
                  <Text style={[styles.forecastTempMin, { color: colors.textSecondary }]}>
                    {Math.round(day.temperature.min)}°
                  </Text>
                </View>

                <View style={styles.forecastDetailsContainer}>
                  {day.precipitation.probability > 0 && (
                    <View style={styles.forecastDetail}>
                      <Ionicons name="water" size={14} color="#3B82F6" />
                      <Text style={[styles.forecastDetailText, { color: colors.textSecondary }]}>
                        {day.precipitation.probability}%
                      </Text>
                    </View>
                  )}
                  <View style={styles.forecastDetail}>
                    <Ionicons name="leaf-outline" size={14} color="#22C55E" />
                    <Text style={[styles.forecastDetailText, { color: colors.textSecondary }]}>
                      {Math.round(day.wind.mean)} km/h
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  // Current conditions card
  currentCard: {
    borderRadius: 16,
    padding: 20,
  },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  currentTemp: {
    flex: 1,
  },
  currentTempText: {
    fontSize: 48,
    fontWeight: '700',
  },
  currentTempRange: {
    fontSize: 16,
    marginTop: 4,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  conditionItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },
  conditionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  conditionLabel: {
    fontSize: 11,
  },
  // Hourly forecast
  hourlyScrollContent: {
    gap: 10,
  },
  hourlyCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 70,
    gap: 6,
  },
  hourlyTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: '700',
  },
  hourlyDetails: {
    gap: 4,
  },
  hourlyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hourlyDetailText: {
    fontSize: 10,
  },
  // 7-day forecast
  forecastCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  forecastDayContainer: {
    width: 50,
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  forecastDate: {
    fontSize: 12,
    marginTop: 2,
  },
  forecastIconContainer: {
    width: 50,
    alignItems: 'center',
  },
  forecastTempContainer: {
    flexDirection: 'row',
    gap: 8,
    width: 70,
  },
  forecastTempMax: {
    fontSize: 16,
    fontWeight: '700',
  },
  forecastTempMin: {
    fontSize: 16,
  },
  forecastDetailsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  forecastDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forecastDetailText: {
    fontSize: 12,
  },
})
