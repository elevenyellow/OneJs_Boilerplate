import { Colors } from '@/constants/Colors'
import { useCragDetail } from '@/hooks/useCragDetail'
import type { CragDetailHourlyForecast } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
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

function formatForecastDate(dateStr: string | null | undefined): {
  day: string
  date: string
} {
  if (!dateStr) return { day: '', date: '' }
  const date = new Date(dateStr)

  // Use UTC date to avoid timezone offset issues
  // The API returns dates at midnight UTC, so we use UTC methods
  const utcDay = date.getUTCDate()
  const utcMonth = date.getUTCMonth()
  const utcYear = date.getUTCFullYear()

  const today = new Date()
  const todayUtcDay = today.getUTCDate()
  const todayUtcMonth = today.getUTCMonth()
  const todayUtcYear = today.getUTCFullYear()

  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowUtcDay = tomorrow.getUTCDate()
  const tomorrowUtcMonth = tomorrow.getUTCMonth()
  const tomorrowUtcYear = tomorrow.getUTCFullYear()

  const dayNumber = utcDay.toString()

  // Check if it's today
  if (
    utcDay === todayUtcDay &&
    utcMonth === todayUtcMonth &&
    utcYear === todayUtcYear
  ) {
    return { day: 'Today', date: dayNumber }
  }

  // Check if it's tomorrow
  if (
    utcDay === tomorrowUtcDay &&
    utcMonth === tomorrowUtcMonth &&
    utcYear === tomorrowUtcYear
  ) {
    return { day: 'Tom', date: dayNumber }
  }

  // Get weekday name using UTC
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekday = weekdays[date.getUTCDay()]

  return {
    day: weekday,
    date: dayNumber,
  }
}

/**
 * Map Meteoblue pictocode to Ionicons weather icon
 * Meteoblue pictocodes (day): https://content.meteoblue.com/en/research-education/specifications/standards/symbols-and-pictograms
 * 1: Sunny, cloudless sky
 * 2: Sunny and few clouds
 * 3: Partly cloudy
 * 4: Overcast
 * 5: Fog
 * 6: Overcast with rain
 * 7: Mixed with showers
 * 8: Showers, thunderstorms likely
 * 9: Overcast with snow
 * 10: Mixed with snow showers
 * 11: Mostly cloudy with mixture of snow and rain
 * 12: Overcast with light rain
 * 13: Overcast with light snow
 * 14: Mostly cloudy with rain
 * 15: Mostly cloudy with snow
 * 16: Mostly cloudy with light rain
 * 17: Mostly cloudy with light snow
 *
 * @param code - Meteoblue pictocode
 * @param precipitation - Optional precipitation amount to refine icon selection
 * @param isDaylight - Optional flag to show moon icons at night
 */
function getWeatherIcon(
  code: number,
  precipitation?: number,
  isDaylight?: boolean,
): keyof typeof Ionicons.glyphMap {
  // If code suggests rain/snow but precipitation is 0, show cloudy instead
  const hasActualPrecipitation =
    precipitation !== undefined && precipitation > 0

  // Default to daylight if not specified (for daily forecasts)
  const isDay = isDaylight !== false

  switch (code) {
    case 1:
      return isDay ? 'sunny' : 'moon'
    case 2:
    case 3:
      return isDay ? 'partly-sunny' : 'cloudy-night'
    case 4:
      return 'cloudy'
    case 5:
      return 'cloudy' // Fog
    case 6: // Overcast with rain
    case 7: // Mixed with showers
    case 12: // Overcast with light rain
    case 14: // Mostly cloudy with rain
    case 16: // Mostly cloudy with light rain
      return hasActualPrecipitation ? 'rainy' : 'cloudy'
    case 8: // Showers, thunderstorms likely
      return hasActualPrecipitation ? 'thunderstorm' : 'cloudy'
    case 9: // Overcast with snow
    case 10: // Mixed with snow showers
    case 11: // Mixture of snow and rain
    case 13: // Overcast with light snow
    case 15: // Mostly cloudy with snow
    case 17: // Mostly cloudy with light snow
      return hasActualPrecipitation ? 'snow' : 'cloudy'
    default:
      return isDay ? 'partly-sunny' : 'cloudy-night'
  }
}

function formatHour(timestamp: string | null | undefined): string {
  if (!timestamp) return '--:--'

  // Try parsing as ISO string first
  let date = new Date(timestamp)

  // If that fails, try parsing as a number (unix timestamp)
  if (isNaN(date.getTime()) && !isNaN(Number(timestamp))) {
    // Check if it's seconds or milliseconds
    const num = Number(timestamp)
    date = new Date(num > 9999999999 ? num : num * 1000)
  }

  // Check if date is valid
  if (isNaN(date.getTime())) return '--:--'

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${hours}:${minutes}`
}

export default function WeatherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const { data: crag, isLoading } = useCragDetail(id)

  // Filter forecast to only include today and future days
  const filteredForecast = useMemo(() => {
    if (!crag?.forecast) return []

    const now = new Date()
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )

    return crag.forecast.filter((day) => {
      if (!day.date) return false
      const forecastDate = new Date(day.date)
      // Include if forecast date is today or in the future
      return forecastDate >= todayStart
    })
  }, [crag?.forecast])

  const todayForecast = filteredForecast[0] || null

  // Use all hourly data available, filtered to current time and future
  const todayHourlyForecast = useMemo(() => {
    if (!crag?.hourlyForecast) return []

    const now = new Date()
    // Filter to only show current hour and future
    return [...crag.hourlyForecast]
      .filter((hour) => {
        if (!hour.timestamp) return false
        const hourTime = new Date(hour.timestamp)
        // Include if within 1 hour of now or in the future
        return hourTime.getTime() >= now.getTime() - 60 * 60 * 1000
      })
      .sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      })
  }, [crag?.hourlyForecast])

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!crag) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={{ color: colors.text }}>Weather data not available</Text>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>
          Weather Forecast
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Summary */}
        {todayForecast && (
          <View
            style={[
              styles.todaySummary,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* Header row: Icon + Temp + Label */}
            <View style={styles.todaySummaryHeader}>
              <View style={styles.todaySummaryMain}>
                <Ionicons
                  name={getWeatherIcon(
                    todayForecast.weatherCode,
                    todayForecast.precipitation?.amount,
                  )}
                  size={52}
                  color={colors.primary}
                />
                <View>
                  <Text style={[styles.todaySummaryTemp, { color: colors.text }]}>
                    {Math.round(todayForecast.temperature?.mean || 0)}°C
                  </Text>
                  <Text style={[styles.todaySummaryRange, { color: colors.textSecondary }]}>
                    {Math.round(todayForecast.temperature?.min || 0)}° / {Math.round(todayForecast.temperature?.max || 0)}°
                  </Text>
                </View>
              </View>
              <Text style={[styles.todaySummaryLabel, { color: colors.textSecondary }]}>
                Today
              </Text>
            </View>

            {/* Stats row */}
            <View style={[styles.todaySummaryStats, { borderTopColor: colors.border }]}>
              {/* Rain */}
              <View style={styles.todaySummaryStat}>
                <Ionicons name="rainy-outline" size={18} color="#3B82F6" />
                <Text style={[styles.todaySummaryStatValue, { color: colors.text }]}>
                  {Math.round(todayForecast.precipitation?.probability || 0)}%
                </Text>
                <Text style={[styles.todaySummaryStatLabel, { color: colors.textSecondary }]}>
                  Rain
                </Text>
              </View>

              {/* Wind */}
              <View style={styles.todaySummaryStat}>
                <Ionicons name="leaf" size={18} color="#10B981" />
                <Text style={[styles.todaySummaryStatValue, { color: colors.text }]}>
                  {Math.round(todayForecast.wind?.mean || 0)}
                </Text>
                <Text style={[styles.todaySummaryStatLabel, { color: colors.textSecondary }]}>
                  m/s
                </Text>
              </View>

              {/* Humidity */}
              <View style={styles.todaySummaryStat}>
                <Ionicons name="water-outline" size={18} color="#6366F1" />
                <Text style={[styles.todaySummaryStatValue, { color: colors.text }]}>
                  {Math.round(todayForecast.humidity?.mean || 50)}%
                </Text>
                <Text style={[styles.todaySummaryStatLabel, { color: colors.textSecondary }]}>
                  Humidity
                </Text>
              </View>

              {/* UV */}
              <View style={styles.todaySummaryStat}>
                <Ionicons name="sunny" size={18} color="#F59E0B" />
                <Text style={[styles.todaySummaryStatValue, { color: colors.text }]}>
                  {todayForecast.uvIndex || 0}
                </Text>
                <Text style={[styles.todaySummaryStatLabel, { color: colors.textSecondary }]}>
                  UV
                </Text>
              </View>

              {/* Sunrise */}
              <View style={styles.todaySummaryStat}>
                <Ionicons name="sunny-outline" size={18} color="#FB923C" />
                <Text style={[styles.todaySummaryStatValue, { color: colors.text }]}>
                  {todayForecast.sunrise || '--'}
                </Text>
                <Text style={[styles.todaySummaryStatLabel, { color: colors.textSecondary }]}>
                  Sunrise
                </Text>
              </View>

              {/* Sunset */}
              <View style={styles.todaySummaryStat}>
                <Ionicons name="moon-outline" size={18} color="#6366F1" />
                <Text style={[styles.todaySummaryStatValue, { color: colors.text }]}>
                  {todayForecast.sunset || '--'}
                </Text>
                <Text style={[styles.todaySummaryStatLabel, { color: colors.textSecondary }]}>
                  Sunset
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Hourly Forecast */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Hourly Forecast
          </Text>
          {todayHourlyForecast.length === 0 ? (
            <View
              style={[
                styles.noDataContainer,
                { backgroundColor: colors.muted },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={32}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.noDataText, { color: colors.textSecondary }]}
              >
                Hourly data not available for this location
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyScrollContent}
            >
              {todayHourlyForecast
                .slice(0, 24)
                .map((hour: CragDetailHourlyForecast, index: number) => (
                  <View
                    key={hour.timestamp || `hour-${index}`}
                    style={[
                      styles.hourlyCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* Time */}
                    <View style={styles.hourlyCardTime}>
                      <Text
                        style={[
                          styles.hourlyCardTimeText,
                          { color: colors.text },
                        ]}
                      >
                        {formatHour(hour.timestamp || '')}
                      </Text>
                      {hour.isDaylight ? (
                        <Ionicons name="sunny" size={10} color="#F59E0B" />
                      ) : (
                        <Ionicons name="moon" size={10} color="#6366F1" />
                      )}
                    </View>

                    {/* Weather Icon */}
                    <Ionicons
                      name={getWeatherIcon(
                        hour.weatherCode,
                        hour.precipitation,
                        hour.isDaylight,
                      )}
                      size={28}
                      color={colors.primary}
                    />

                    {/* Temperature */}
                    <Text
                      style={[styles.hourlyCardTemp, { color: colors.text }]}
                    >
                      {Math.round(hour.temperature)}°
                    </Text>

                    {/* Conditions */}
                    <View
                      style={[
                        styles.hourlyCardConditions,
                        { backgroundColor: colors.muted },
                      ]}
                    >
                      {hour.precipitation > 0 ? (
                        <View style={styles.hourlyCardConditionRow}>
                          <Ionicons name="water" size={10} color="#3B82F6" />
                          <Text
                            style={[
                              styles.hourlyCardConditionText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {hour.precipitation.toFixed(1)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.hourlyCardConditionRow}>
                          <Ionicons
                            name="water-outline"
                            size={10}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.hourlyCardConditionText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            0
                          </Text>
                        </View>
                      )}
                      <View style={styles.hourlyCardConditionRow}>
                        <Ionicons
                          name="leaf"
                          size={10}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.hourlyCardConditionText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {Math.round(hour.windSpeed)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
            </ScrollView>
          )}
        </View>

        {/* Weekly Forecast */}
        {filteredForecast.length > 0 && (
          <View style={[styles.section, { marginBottom: 40 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              7-Day Forecast
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weeklyScrollContent}
            >
              {filteredForecast.slice(0, 7).map((day, index) => {
                const { day: dayName, date: dayDate } = formatForecastDate(
                  day.date,
                )
                const isToday = dayName === 'Today'
                const rainChance = day.precipitation?.probability || 0

                return (
                  <View
                    key={day.date || `day-${index}`}
                    style={[
                      styles.dayCard,
                      {
                        backgroundColor: isToday ? colors.primary : colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* Day label */}
                    <View style={styles.dayCardLabelContainer}>
                      <Text
                        style={[
                          styles.dayCardLabel,
                          { color: isToday ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {dayName}
                      </Text>
                      <Text
                        style={[
                          styles.dayCardDate,
                          {
                            color: isToday
                              ? 'rgba(255,255,255,0.7)'
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {dayDate}
                      </Text>
                    </View>

                    {/* Weather icon */}
                    <Ionicons
                      name={getWeatherIcon(
                        day.weatherCode,
                        day.precipitation?.amount,
                      )}
                      size={36}
                      color={isToday ? '#FFFFFF' : colors.primary}
                    />

                    {/* Temperature */}
                    <View style={styles.dayCardTemps}>
                      <Text
                        style={[
                          styles.dayCardTempHigh,
                          { color: isToday ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {Math.round(day.temperature?.max || 0)}°
                      </Text>
                      <Text
                        style={[
                          styles.dayCardTempLow,
                          {
                            color: isToday
                              ? 'rgba(255,255,255,0.7)'
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {Math.round(day.temperature?.min || 0)}°
                      </Text>
                    </View>

                    {/* Conditions */}
                    <View
                      style={[
                        styles.dayCardConditions,
                        {
                          backgroundColor: isToday
                            ? 'rgba(255,255,255,0.15)'
                            : colors.muted,
                        },
                      ]}
                    >
                      {/* Rain */}
                      <View style={styles.dayCardConditionRow}>
                        <Ionicons
                          name="water"
                          size={12}
                          color={
                            rainChance > 50
                              ? '#3B82F6'
                              : isToday
                                ? 'rgba(255,255,255,0.6)'
                                : colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.dayCardConditionText,
                            {
                              color: isToday
                                ? 'rgba(255,255,255,0.8)'
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {Math.round(rainChance)}%
                        </Text>
                      </View>

                      {/* Wind */}
                      <View style={styles.dayCardConditionRow}>
                        <Ionicons
                          name="leaf"
                          size={12}
                          color={
                            isToday
                              ? 'rgba(255,255,255,0.6)'
                              : colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.dayCardConditionText,
                            {
                              color: isToday
                                ? 'rgba(255,255,255,0.8)'
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {Math.round(day.wind?.mean || 0)}m/s
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Today Summary
  todaySummary: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  todaySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todaySummaryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  todaySummaryTemp: {
    fontSize: 36,
    fontWeight: '700',
  },
  todaySummaryRange: {
    fontSize: 14,
  },
  todaySummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  todaySummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  todaySummaryStat: {
    alignItems: 'center',
    gap: 4,
  },
  todaySummaryStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  todaySummaryStatLabel: {
    fontSize: 10,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    gap: 8,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Hourly Forecast Cards
  hourlyScrollContent: {
    paddingRight: 20,
    gap: 8,
  },
  hourlyCard: {
    width: 70,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  hourlyCardTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hourlyCardTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hourlyCardTemp: {
    fontSize: 18,
    fontWeight: '700',
  },
  hourlyCardConditions: {
    width: '100%',
    borderRadius: 6,
    padding: 4,
    gap: 2,
  },
  hourlyCardConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  hourlyCardConditionText: {
    fontSize: 10,
    fontWeight: '500',
  },
  // 7-Day Forecast Cards
  weeklyScrollContent: {
    paddingRight: 20,
    gap: 10,
  },
  dayCard: {
    width: 85,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  dayCardLabelContainer: {
    alignItems: 'center',
    gap: 2,
  },
  dayCardLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayCardDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  dayCardTemps: {
    alignItems: 'center',
    gap: 2,
  },
  dayCardTempHigh: {
    fontSize: 20,
    fontWeight: '700',
  },
  dayCardTempLow: {
    fontSize: 13,
    fontWeight: '500',
  },
  dayCardConditions: {
    width: '100%',
    borderRadius: 8,
    padding: 6,
    gap: 4,
    marginTop: 4,
  },
  dayCardConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayCardConditionText: {
    fontSize: 11,
    fontWeight: '500',
  },
})
