import { Colors } from '@/constants/Colors'
import { useCragDetail } from '@/hooks/useCragDetail'
import type { SearchSectorResult } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { HeroHeader } from '@/components/HeroHeader'
import { LanguageApproachSection } from '@/components/LanguageApproachSection'

function formatForecastDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return 'Hoy'
  if (date.toDateString() === tomorrow.toDateString()) return 'Mañana'

  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
}

function getWeatherIcon(code: number): keyof typeof Ionicons.glyphMap {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  switch (code) {
    case 0: // Clear sky
      return 'sunny'
    case 1: // Mainly clear
    case 2: // Partly cloudy
      return 'partly-sunny'
    case 3: // Overcast
      return 'cloudy'
    case 45: // Fog
    case 48: // Depositing rime fog
      return 'cloudy' // No specific fog icon in Ionicons
    case 51: // Light drizzle
    case 53: // Moderate drizzle
    case 55: // Dense drizzle
    case 56: // Light freezing drizzle
    case 57: // Dense freezing drizzle
      return 'rainy'
    case 61: // Slight rain
    case 63: // Moderate rain
    case 65: // Heavy rain
    case 66: // Light freezing rain
    case 67: // Heavy freezing rain
    case 80: // Slight rain showers
    case 81: // Moderate rain showers
    case 82: // Violent rain showers
      return 'rainy'
    case 71: // Slight snowfall
    case 73: // Moderate snowfall
    case 75: // Heavy snowfall
    case 77: // Snow grains
    case 85: // Slight snow showers
    case 86: // Heavy snow showers
      return 'snow'
    case 95: // Slight or moderate thunderstorm
    case 96: // Thunderstorm with slight hail
    case 99: // Thunderstorm with heavy hail
      return 'thunderstorm'
    default:
      return 'cloud'
  }
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  if (score >= 25) return '#EF4444'
  return '#64748B'
}

export default function CragDetailScreen() {
  const {
    id,
    sectorsData,
    avgScore,
    distance: distanceParam,
  } = useLocalSearchParams<{
    id: string
    sectorsData?: string
    avgScore?: string
    distance?: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  // Parse pre-scored sectors from navigation params (already scored by backend)
  const scoredSectors: SearchSectorResult[] = useMemo(() => {
    if (!sectorsData) return []
    try {
      return JSON.parse(sectorsData)
    } catch {
      return []
    }
  }, [sectorsData])

  const {
    data: crag,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useCragDetail(id || '')

  // Get today's forecast
  const todayForecast = useMemo(() => {
    if (!crag?.forecast?.length) return null
    const today = new Date().toISOString().split('T')[0]
    return (
      crag.forecast.find((f) => f.date?.startsWith(today)) || crag.forecast[0]
    )
  }, [crag?.forecast])

  // Combine scored sectors with crag sectors to show all
  // scoredSectors come from search navigation, crag.sectors come from API
  const allSectors = useMemo((): SearchSectorResult[] => {
    // Helper to convert SectorSummary to SearchSectorResult
    const convertToSearchResult = (s: {
      id: string
      name: string
      orientation: string | null
      rockType: string | null
      sunExposure: string | null
      routesInGradeRange?: number
      score?: number
    }): SearchSectorResult => ({
      sector: {
        id: s.id,
        name: s.name,
        orientation: s.orientation,
        rockType: s.rockType,
        sunExposure: s.sunExposure,
        routes: [],
        coordinates: null,
        avgStars: null,
        climbingStyle: null,
      },
      relevanceScore: s.score || 0,
      distance: 0,
      routesInUserRange: s.routesInGradeRange || 0,
      matchReasons: [],
      scoringBreakdown: {
        gradeMatch: 0,
        distance: 0,
        orientation: 0,
        popularity: 0,
        routeCount: 0,
        quality: 0,
      },
      conditions: undefined,
    })

    // If we have scored sectors from search, use them as base
    if (scoredSectors.length > 0) {
      const scoredIds = new Set(scoredSectors.map((s) => s.sector.id))

      // Add any crag sectors that aren't in scoredSectors
      const additionalSectors = (crag?.sectors || [])
        .filter((s) => !scoredIds.has(s.id))
        .map(convertToSearchResult)

      return [...scoredSectors, ...additionalSectors].sort(
        (a, b) => b.relevanceScore - a.relevanceScore,
      )
    }

    // If no scored sectors, convert crag.sectors to SearchSectorResult format
    return (crag?.sectors || [])
      .map(convertToSearchResult)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }, [scoredSectors, crag?.sectors])

  // Get rock type from first sector if available
  const primaryRockType = allSectors[0]?.sector?.rockType || null

  const handleOpenTheCrag = () => {
    if (crag?.theCragUrl) {
      Linking.openURL(crag.theCragUrl)
    }
  }

  const handleSectorPress = (sectorResult: SearchSectorResult) => {
    const sector = sectorResult.sector
    const grades =
      sector.routes
        ?.map((r: { grade: string | null }) => r.grade)
        .filter(Boolean)
        .sort() || []
    const gradeMin = grades[0] || ''
    const gradeMax = grades[grades.length - 1] || ''

    const params = new URLSearchParams({
      name: sector.name || '',
      cragName: crag?.name || '',
      orientation: sector.orientation || '',
      sunExposure: sector.sunExposure || '',
      rockType: sector.rockType || '',
      avgStars: sector.avgStars?.toString() || '',
      totalRoutes: (sector.routes?.length || 0).toString(),
      routesInRange: sectorResult.routesInUserRange.toString(),
      gradeMin,
      gradeMax,
      distance: distanceParam || '',
      climbingStyle: Array.isArray(sector.climbingStyle)
        ? sector.climbingStyle.join(', ')
        : sector.climbingStyle || '',
    })

    // Add coordinates if available
    if (sector.coordinates?.lat) {
      params.set('latitude', sector.coordinates.lat.toString())
    }
    if (sector.coordinates?.lon) {
      params.set('longitude', sector.coordinates.lon.toString())
    }

    router.push(`/sector/${sector.id}?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading zone...
        </Text>
      </View>
    )
  }

  if (isError || !crag) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons name="alert-circle" size={64} color={colors.destructive} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Error loading zone
        </Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
          Could not get information
        </Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text
            style={[
              styles.retryButtonText,
              { color: colors.primaryForeground },
            ]}
          >
            Retry
          </Text>
        </Pressable>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={[styles.backLinkText, { color: colors.primary }]}>
            Go back
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      {/* Hero Header with Image */}
      <HeroHeader
        title={crag.name}
        subtitle={crag.region ? `${crag.region}, ${crag.country}` : crag.country}
        theCragUrl={crag.theCragUrl}
        rockType={primaryRockType}
        icon="layers"
        onBack={() => router.back()}
        stats={[
          { label: 'sectors', value: crag.totalSectors, icon: 'grid' },
          { label: 'routes', value: crag.totalRoutes, icon: 'git-branch' },
          ...(distanceParam
            ? [{
                label: 'km',
                value: Number(distanceParam) < 1
                  ? `${Math.round(Number(distanceParam) * 1000)}m`
                  : Number(distanceParam).toFixed(1),
                icon: 'location' as const,
              }]
            : []),
        ]}
        badge={
          avgScore
            ? {
                label: `${Math.round(Number(avgScore))} match`,
                color: getScoreColor(Number(avgScore)),
              }
            : undefined
        }
      />

      <View style={styles.content}>
        {/* Current Weather */}
        {todayForecast && (
          <View
            style={[
              styles.weatherBanner,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.weatherBannerLeft}>
              <Ionicons
                name={getWeatherIcon(todayForecast.weatherCode)}
                size={32}
                color={colors.primary}
              />
              <View>
                <Text style={[styles.weatherTemp, { color: colors.text }]}>
                  {Math.round(todayForecast.temperature?.mean || 0)}°C
                </Text>
                <Text
                  style={[styles.weatherRange, { color: colors.textSecondary }]}
                >
                  {Math.round(todayForecast.temperature?.min || 0)}° -{' '}
                  {Math.round(todayForecast.temperature?.max || 0)}°
                </Text>
              </View>
            </View>
            {avgScore && (
              <View style={styles.weatherBannerRight}>
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: getScoreColor(Number(avgScore)) },
                  ]}
                >
                  <Text style={styles.scoreText}>
                    {Math.round(Number(avgScore))}
                  </Text>
                </View>
                <Text
                  style={[styles.scoreLabel, { color: colors.textSecondary }]}
                >
                  match
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="grid" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {crag.totalSectors}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Sectors
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="git-branch" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {crag.totalRoutes}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Routes
            </Text>
          </View>
          {distanceParam && (
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Number(distanceParam) < 1
                  ? `${Math.round(Number(distanceParam) * 1000)}m`
                  : `${Number(distanceParam).toFixed(1)}km`}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Distance
              </Text>
            </View>
          )}
        </View>

        {/* Sectors (sorted by score from backend) */}
        {allSectors.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitleInCard, { color: colors.text }]}>
                Sectors
              </Text>
              <Text
                style={[styles.sectorCount, { color: colors.textSecondary }]}
              >
                {allSectors.length}
              </Text>
            </View>
            <View style={styles.sectorsList}>
              {allSectors.map((sectorResult) => {
                const isGoodDay = sectorResult.conditions?.isGoodDay
                const isHighScore = sectorResult.relevanceScore >= 70
                const isRecommended = isGoodDay || isHighScore

                return (
                  <Pressable
                    key={sectorResult.sector.id}
                    style={[
                      styles.sectorItem,
                      {
                        borderColor: colors.border,
                        backgroundColor: isRecommended
                          ? colors.card
                          : colors.muted,
                      },
                      isRecommended && styles.sectorItemRecommended,
                    ]}
                    onPress={() => handleSectorPress(sectorResult)}
                  >
                    {/* Recommended indicator bar */}
                    {isRecommended && <View style={styles.recommendedBar} />}

                    <View style={styles.sectorInfo}>
                      <View style={styles.sectorNameRow}>
                        <Text
                          style={[styles.sectorName, { color: colors.text }]}
                        >
                          {sectorResult.sector.name}
                        </Text>
                        {isGoodDay && (
                          <View style={styles.goodDayBadge}>
                            <Ionicons
                              name="checkmark-circle"
                              size={12}
                              color="#FFFFFF"
                            />
                            <Text style={styles.goodDayText}>Ideal today</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.sectorMeta}>
                        <Text
                          style={[
                            styles.sectorMetaText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {sectorResult.routesInUserRange} routes in range
                        </Text>
                        {sectorResult.sector.orientation && (
                          <>
                            <Text
                              style={[
                                styles.sectorMetaText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {' '}
                              •{' '}
                            </Text>
                            <Text
                              style={[
                                styles.sectorMetaText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {sectorResult.sector.orientation}
                            </Text>
                          </>
                        )}
                      </View>
                      {/* Show match reasons from backend */}
                      {sectorResult.matchReasons &&
                        sectorResult.matchReasons.length > 0 && (
                          <Text
                            style={[
                              styles.matchReason,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {sectorResult.matchReasons[0]}
                          </Text>
                        )}
                    </View>
                    <View style={styles.sectorRight}>
                      <View
                        style={[
                          styles.miniScoreBadge,
                          {
                            backgroundColor: getScoreColor(
                              sectorResult.relevanceScore,
                            ),
                          },
                        ]}
                      >
                        <Text style={styles.miniScoreText}>
                          {Math.round(sectorResult.relevanceScore)}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        {/* Forecast */}
        {crag.forecast && crag.forecast.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.forecastHeader}>
              <Text style={[styles.sectionTitleInCard, { color: colors.text }]}>
                Previsión próximos días
              </Text>
              <Text
                style={[
                  styles.forecastSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Máx / Mín
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.forecastScroll}
            >
              {crag.forecast.slice(0, 7).map((day, index) => (
                <View
                  key={day.date || `forecast-${index}`}
                  style={[
                    styles.forecastDay,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.forecastDayName, { color: colors.text }]}
                  >
                    {formatForecastDate(day.date)}
                  </Text>
                  <Ionicons
                    name={getWeatherIcon(day.weatherCode)}
                    size={32}
                    color={colors.primary}
                  />
                  <View style={styles.forecastTemps}>
                    <Text
                      style={[styles.forecastTempMax, { color: colors.text }]}
                    >
                      {Math.round(day.temperature?.max || 0)}°
                    </Text>
                    <Text
                      style={[
                        styles.forecastTempMin,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {Math.round(day.temperature?.min || 0)}°
                    </Text>
                  </View>
                  {/* Additional info */}
                  <View style={styles.forecastExtra}>
                    {day.precipitation?.probability > 0 && (
                      <View style={styles.forecastExtraItem}>
                        <Ionicons name="water" size={12} color="#3B82F6" />
                        <Text
                          style={[
                            styles.forecastExtraText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {Math.round(day.precipitation.probability)}%
                        </Text>
                      </View>
                    )}
                    {day.wind?.mean > 0 && (
                      <View style={styles.forecastExtraItem}>
                        <Ionicons
                          name="leaf"
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.forecastExtraText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {Math.round(day.wind.mean)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Description */}
        {crag.description && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitleInCard, { color: colors.text }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {crag.description}
            </Text>
          </View>
        )}

        {/* Approach */}
        {crag.approach && (
          <LanguageApproachSection
            approach={crag.approach}
            latitude={crag.latitude}
            longitude={crag.longitude}
            cragName={crag.name}
          />
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {crag.theCragUrl && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleOpenTheCrag}
            >
              <Ionicons
                name="open-outline"
                size={20}
                color={colors.primaryForeground}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                View on TheCrag
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 16,
  },
  weatherBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  weatherBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: '700',
  },
  weatherRange: {
    fontSize: 13,
  },
  weatherBannerRight: {
    alignItems: 'center',
    gap: 2,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 42,
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleInCard: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectorCount: {
    fontSize: 14,
  },
  sectorsList: {
    gap: 8,
  },
  sectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectorItemRecommended: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  recommendedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#10B981',
  },
  sectorInfo: {
    flex: 1,
    marginLeft: 8,
  },
  sectorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  sectorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  goodDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goodDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  sectorMetaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  matchReason: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
    opacity: 0.8,
  },
  sectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  miniScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  miniScoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  forecastSubtitle: {
    fontSize: 12,
  },
  forecastScroll: {
    marginHorizontal: -4,
  },
  forecastDay: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
    gap: 6,
  },
  forecastDayName: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  forecastTemps: {
    alignItems: 'center',
    gap: 2,
  },
  forecastTempMax: {
    fontSize: 18,
    fontWeight: '700',
  },
  forecastTempMin: {
    fontSize: 13,
    fontWeight: '500',
  },
  forecastExtra: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  forecastExtraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  forecastExtraText: {
    fontSize: 11,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
})
