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

function formatForecastDate(dateStr: string | null | undefined): { day: string; date: string } {
  if (!dateStr) return { day: '', date: '' }
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayNumber = date.getDate().toString()

  if (date.toDateString() === today.toDateString()) {
    return { day: 'Today', date: dayNumber }
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return { day: 'Tom', date: dayNumber }
  }

  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: dayNumber,
  }
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

  const todayForecast = crag?.forecast?.[0] || null

  // Use all hourly data available (backend should filter by relevant dates)
  const todayHourlyForecast = useMemo(() => {
    if (!crag?.hourlyForecast) return []
    // Return all hourly forecasts, sorted by timestamp
    return [...crag.hourlyForecast].sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    })
  }, [crag?.hourlyForecast])

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
            <View style={[styles.noDataContainer, { backgroundColor: colors.muted }]}>
              <Ionicons name="time-outline" size={32} color={colors.textSecondary} />
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                Hourly data not available for this location
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyScrollContent}
            >
              {todayHourlyForecast.slice(0, 24).map((hour: CragDetailHourlyForecast, index: number) => (
                <View
                  key={hour.timestamp || `hour-${index}`}
                  style={[
                    styles.hourlyCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {/* Time */}
                  <View style={styles.hourlyCardTime}>
                    <Text style={[styles.hourlyCardTimeText, { color: colors.text }]}>
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
                    name={getWeatherIcon(hour.weatherCode)}
                    size={28}
                    color={colors.primary}
                  />

                  {/* Temperature */}
                  <Text style={[styles.hourlyCardTemp, { color: colors.text }]}>
                    {Math.round(hour.temperature)}°
                  </Text>

                  {/* Conditions */}
                  <View style={[styles.hourlyCardConditions, { backgroundColor: colors.muted }]}>
                    {hour.precipitation > 0 ? (
                      <View style={styles.hourlyCardConditionRow}>
                        <Ionicons name="water" size={10} color="#3B82F6" />
                        <Text style={[styles.hourlyCardConditionText, { color: colors.textSecondary }]}>
                          {hour.precipitation.toFixed(1)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.hourlyCardConditionRow}>
                        <Ionicons name="water-outline" size={10} color={colors.textSecondary} />
                        <Text style={[styles.hourlyCardConditionText, { color: colors.textSecondary }]}>
                          0
                        </Text>
                      </View>
                    )}
                    <View style={styles.hourlyCardConditionRow}>
                      <Ionicons name="leaf" size={10} color={colors.textSecondary} />
                      <Text style={[styles.hourlyCardConditionText, { color: colors.textSecondary }]}>
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
        {crag.forecast && crag.forecast.length > 0 && (
          <View style={[styles.section, { marginBottom: 40 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              7-Day Forecast
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weeklyScrollContent}
            >
              {crag.forecast.slice(0, 7).map((day, index) => {
                const isToday = index === 0
                const rainChance = day.precipitation?.probability || 0
                const { day: dayName, date: dayDate } = formatForecastDate(day.date)
                
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
                      <Text style={[
                        styles.dayCardLabel,
                        { color: isToday ? '#FFFFFF' : colors.text }
                      ]}>
                        {dayName}
                      </Text>
                      <Text style={[
                        styles.dayCardDate,
                        { color: isToday ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                      ]}>
                        {dayDate}
                      </Text>
                    </View>

                    {/* Weather icon */}
                    <Ionicons
                      name={getWeatherIcon(day.weatherCode)}
                      size={36}
                      color={isToday ? '#FFFFFF' : colors.primary}
                    />

                    {/* Temperature */}
                    <View style={styles.dayCardTemps}>
                      <Text style={[
                        styles.dayCardTempHigh,
                        { color: isToday ? '#FFFFFF' : colors.text }
                      ]}>
                        {Math.round(day.temperature?.max || 0)}°
                      </Text>
                      <Text style={[
                        styles.dayCardTempLow,
                        { color: isToday ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                      ]}>
                        {Math.round(day.temperature?.min || 0)}°
                      </Text>
                    </View>

                    {/* Conditions */}
                    <View style={[
                      styles.dayCardConditions,
                      { backgroundColor: isToday ? 'rgba(255,255,255,0.15)' : colors.muted }
                    ]}>
                      {/* Rain */}
                      <View style={styles.dayCardConditionRow}>
                        <Ionicons 
                          name="water" 
                          size={12} 
                          color={rainChance > 50 ? '#3B82F6' : (isToday ? 'rgba(255,255,255,0.6)' : colors.textSecondary)} 
                        />
                        <Text style={[
                          styles.dayCardConditionText,
                          { color: isToday ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                        ]}>
                          {Math.round(rainChance)}%
                        </Text>
                      </View>
                      
                      {/* Wind */}
                      <View style={styles.dayCardConditionRow}>
                        <Ionicons 
                          name="leaf" 
                          size={12} 
                          color={isToday ? 'rgba(255,255,255,0.6)' : colors.textSecondary} 
                        />
                        <Text style={[
                          styles.dayCardConditionText,
                          { color: isToday ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                        ]}>
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
