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

function formatForecastDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

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
    case 9:
    case 11:
      return 'rainy'
    case 7:
    case 10:
    case 12:
      return 'snow'
    case 8:
    case 13:
      return 'rainy'
    case 14:
    case 15:
      return 'thunderstorm'
    case 16:
    case 17:
      return 'cloudy'
    default:
      return 'partly-sunny'
  }
}

function formatHour(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function WeatherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const { data: crag, isLoading } = useCragDetail(id)

  const todayForecast = crag?.forecast?.[0] || null

  const todayHourlyForecast = useMemo(() => {
    if (!crag?.hourlyForecast || !todayForecast?.date) return []
    const targetDate = todayForecast.date.split('T')[0]
    return crag.hourlyForecast.filter((h: CragDetailHourlyForecast) => {
      if (!h.timestamp) return false
      const hourDate = new Date(h.timestamp).toISOString().split('T')[0]
      return hourDate === targetDate
    })
  }, [crag?.hourlyForecast, todayForecast?.date])

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!crag) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Weather data not available</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Weather Forecast</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Complete Summary */}
        {todayForecast && (
          <View style={[styles.todaySummaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Main Temperature */}
            <View style={styles.todaySummaryHeader}>
              <View style={styles.todaySummaryMain}>
                <Ionicons
                  name={getWeatherIcon(todayForecast.weatherCode)}
                  size={64}
                  color={colors.primary}
                />
                <View style={styles.todaySummaryTemps}>
                  <Text style={[styles.todaySummaryTempMain, { color: colors.text }]}>
                    {Math.round(todayForecast.temperature?.mean || 0)}°C
                  </Text>
                  <Text style={[styles.todaySummaryTempRange, { color: colors.textSecondary }]}>
                    Min {Math.round(todayForecast.temperature?.min || 0)}° / Max {Math.round(todayForecast.temperature?.max || 0)}°
                  </Text>
                </View>
              </View>
              <Text style={[styles.todaySummaryLabel, { color: colors.textSecondary }]}>
                Today
              </Text>
            </View>

            {/* Detailed Conditions Grid */}
            <View style={styles.todayDetailsGrid}>
              {/* Temperature */}
              <View style={[styles.todayDetailBox, { backgroundColor: colors.muted }]}>
                <Ionicons name="thermometer-outline" size={22} color="#EF4444" />
                <Text style={[styles.todayDetailValue, { color: colors.text }]}>
                  {Math.round(todayForecast.temperature?.min || 0)}° - {Math.round(todayForecast.temperature?.max || 0)}°
                </Text>
                <Text style={[styles.todayDetailLabel, { color: colors.textSecondary }]}>
                  Temperature
                </Text>
              </View>

              {/* Feels Like */}
              <View style={[styles.todayDetailBox, { backgroundColor: colors.muted }]}>
                <Ionicons name="body-outline" size={22} color="#F59E0B" />
                <Text style={[styles.todayDetailValue, { color: colors.text }]}>
                  {Math.round(todayForecast.feelsLike?.min || todayForecast.temperature?.min || 0)}° - {Math.round(todayForecast.feelsLike?.max || todayForecast.temperature?.max || 0)}°
                </Text>
                <Text style={[styles.todayDetailLabel, { color: colors.textSecondary }]}>
                  Feels Like
                </Text>
              </View>

              {/* Rain Probability */}
              <View style={[styles.todayDetailBox, { backgroundColor: colors.muted }]}>
                <Ionicons name="rainy-outline" size={22} color="#3B82F6" />
                <Text style={[styles.todayDetailValue, { color: colors.text }]}>
                  {Math.round(todayForecast.precipitation?.probability || 0)}%
                </Text>
                <Text style={[styles.todayDetailLabel, { color: colors.textSecondary }]}>
                  Rain Chance
                </Text>
              </View>

              {/* Precipitation */}
              <View style={[styles.todayDetailBox, { backgroundColor: colors.muted }]}>
                <Ionicons name="water" size={22} color="#0EA5E9" />
                <Text style={[styles.todayDetailValue, { color: colors.text }]}>
                  {(todayForecast.precipitation?.amount || 0).toFixed(1)} mm
                </Text>
                <Text style={[styles.todayDetailLabel, { color: colors.textSecondary }]}>
                  Precipitation
                </Text>
              </View>

              {/* Humidity */}
              <View style={[styles.todayDetailBox, { backgroundColor: colors.muted }]}>
                <Ionicons name="water-outline" size={22} color="#6366F1" />
                <Text style={[styles.todayDetailValue, { color: colors.text }]}>
                  {Math.round(todayForecast.humidity?.min || 0)}% - {Math.round(todayForecast.humidity?.max || 0)}%
                </Text>
                <Text style={[styles.todayDetailLabel, { color: colors.textSecondary }]}>
                  Humidity
                </Text>
              </View>

              {/* Wind */}
              <View style={[styles.todayDetailBox, { backgroundColor: colors.muted }]}>
                <Ionicons name="leaf" size={22} color="#10B981" />
                <Text style={[styles.todayDetailValue, { color: colors.text }]}>
                  {Math.round(todayForecast.wind?.mean || 0)} m/s {todayForecast.wind?.direction || ''}
                </Text>
                <Text style={[styles.todayDetailLabel, { color: colors.textSecondary }]}>
                  Wind
                </Text>
              </View>

              {/* UV Index */}
              {todayForecast.uvIndex !== undefined && (
                <View style={[styles.todayDetailBox, { backgroundColor: colors.muted }]}>
                  <Ionicons name="sunny" size={22} color="#F59E0B" />
                  <Text style={[styles.todayDetailValue, { color: colors.text }]}>
                    {todayForecast.uvIndex}
                  </Text>
                  <Text style={[styles.todayDetailLabel, { color: colors.textSecondary }]}>
                    UV Index
                  </Text>
                </View>
              )}

              {/* Sunrise/Sunset */}
              {(todayForecast.sunrise || todayForecast.sunset) && (
                <View style={[styles.todayDetailBox, { backgroundColor: colors.muted }]}>
                  <Ionicons name="sunny-outline" size={22} color="#FB923C" />
                  <Text style={[styles.todayDetailValue, { color: colors.text }]}>
                    {todayForecast.sunrise || '--'} / {todayForecast.sunset || '--'}
                  </Text>
                  <Text style={[styles.todayDetailLabel, { color: colors.textSecondary }]}>
                    Sunrise / Sunset
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Today's Hourly Forecast */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Hourly Forecast
          </Text>
          {todayHourlyForecast.length === 0 ? (
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              No hourly data available
            </Text>
          ) : (
            todayHourlyForecast.map((hour: CragDetailHourlyForecast, index: number) => (
              <View
                key={hour.timestamp || `hour-${index}`}
                style={[
                  styles.hourlyRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.hourlyTime}>
                  <Text style={[styles.hourlyTimeText, { color: colors.text }]}>
                    {formatHour(hour.timestamp || '')}
                  </Text>
                  {hour.isDaylight ? (
                    <Ionicons name="sunny" size={14} color="#F59E0B" />
                  ) : (
                    <Ionicons name="moon" size={14} color="#6366F1" />
                  )}
                </View>

                <View style={styles.hourlyWeather}>
                  <Ionicons
                    name={getWeatherIcon(hour.weatherCode)}
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.hourlyTemp}>
                  <Text style={[styles.hourlyTempText, { color: colors.text }]}>
                    {Math.round(hour.temperature)}°
                  </Text>
                  <Text style={[styles.hourlyFeelsLike, { color: colors.textSecondary }]}>
                    Feels {Math.round(hour.feelsLike)}°
                  </Text>
                </View>

                <View style={styles.hourlyDetails}>
                  {hour.precipitation > 0 && (
                    <View style={styles.hourlyDetailItem}>
                      <Ionicons name="water" size={12} color="#3B82F6" />
                      <Text style={[styles.hourlyDetailText, { color: colors.textSecondary }]}>
                        {hour.precipitation}mm
                      </Text>
                    </View>
                  )}
                  <View style={styles.hourlyDetailItem}>
                    <Ionicons name="leaf" size={12} color={colors.textSecondary} />
                    <Text style={[styles.hourlyDetailText, { color: colors.textSecondary }]}>
                      {Math.round(hour.windSpeed)} m/s
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Weekly Forecast */}
        {crag.forecast && crag.forecast.length > 0 && (
          <View style={[styles.section, { marginBottom: 40 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              7-Day Forecast
            </Text>
            {crag.forecast.slice(0, 7).map((day, index) => (
              <View
                key={day.date || `day-${index}`}
                style={[
                  styles.weeklyRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.weeklyDay}>
                  <Text style={[styles.weeklyDayText, { color: colors.text }]}>
                    {formatForecastDate(day.date)}
                  </Text>
                </View>

                <View style={styles.weeklyWeather}>
                  <Ionicons
                    name={getWeatherIcon(day.weatherCode)}
                    size={28}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.weeklyTemps}>
                  <Text style={[styles.weeklyTempHigh, { color: colors.text }]}>
                    {Math.round(day.temperature?.max || 0)}°
                  </Text>
                  <Text style={[styles.weeklyTempLow, { color: colors.textSecondary }]}>
                    {Math.round(day.temperature?.min || 0)}°
                  </Text>
                </View>

                <View style={styles.weeklyConditions}>
                  {day.precipitation?.probability > 0 && (
                    <View style={styles.weeklyConditionItem}>
                      <Ionicons name="water" size={14} color="#3B82F6" />
                      <Text style={[styles.weeklyConditionText, { color: colors.textSecondary }]}>
                        {Math.round(day.precipitation.probability)}%
                      </Text>
                    </View>
                  )}
                  {day.wind?.mean > 0 && (
                    <View style={styles.weeklyConditionItem}>
                      <Ionicons name="leaf" size={14} color={colors.textSecondary} />
                      <Text style={[styles.weeklyConditionText, { color: colors.textSecondary }]}>
                        {Math.round(day.wind.mean)} m/s
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
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
  todaySummaryCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  todaySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  todaySummaryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  todaySummaryTemps: {
    gap: 4,
  },
  todaySummaryTempMain: {
    fontSize: 42,
    fontWeight: '700',
  },
  todaySummaryTempRange: {
    fontSize: 14,
  },
  todaySummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  todayDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  todayDetailBox: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  todayDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  todayDetailLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  hourlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  hourlyTime: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hourlyTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hourlyWeather: {
    width: 36,
    alignItems: 'center',
  },
  hourlyTemp: {
    width: 70,
    alignItems: 'flex-start',
  },
  hourlyTempText: {
    fontSize: 16,
    fontWeight: '600',
  },
  hourlyFeelsLike: {
    fontSize: 12,
  },
  hourlyDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  hourlyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hourlyDetailText: {
    fontSize: 12,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  weeklyDay: {
    width: 80,
  },
  weeklyDayText: {
    fontSize: 15,
    fontWeight: '600',
  },
  weeklyWeather: {
    width: 44,
    alignItems: 'center',
  },
  weeklyTemps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 70,
  },
  weeklyTempHigh: {
    fontSize: 16,
    fontWeight: '600',
  },
  weeklyTempLow: {
    fontSize: 14,
  },
  weeklyConditions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  weeklyConditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weeklyConditionText: {
    fontSize: 13,
  },
})
