import { HeroHeader } from '@/components/HeroHeader'
import { TopoViewer } from '@/components/TopoViewer'
import { WeatherIcon } from '@/components/WeatherIcon'
import { Colors } from '@/constants/Colors'
import { useSectorRoutes } from '@/hooks/useSectorRoutes'
import { useSectorTopos } from '@/hooks/useTopos'
import { useWeatherByCoordinates } from '@/hooks/useWeatherByCoordinates'
import type { RouteSearchInfo } from '@/lib/api'
import { gradeToIndex } from '@/utils/gradeConverter'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'

// Map weather codes to condition strings for WeatherIcon
const getWeatherCondition = (code: number): string => {
  if (code === 1) return 'sunny'
  if (code === 2) return 'partly-cloudy'
  if (code === 3) return 'cloudy'
  if (code === 4 || code === 5) return 'overcast'
  if (code === 6 || code === 7) return 'foggy'
  if (code === 8 || code === 9) return 'rainy'
  if (code === 10 || code === 11 || code === 12) return 'rainy'
  if (code === 13 || code === 14 || code === 15) return 'snowy'
  if (code === 16 || code === 17) return 'stormy'
  return 'sunny'
}

// Format date to display day name
const formatDayName = (dateStr: string, index: number): string => {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'

  const date = new Date(dateStr)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

// Format info text (clean markdown)
function formatInfoText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^-\s+/gm, '• ')
    .replace(/&nbsp;/g, ' ')
    .replace(/:parking:/g, '🅿️')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface ParkingLocation {
  name: string
  lat: number
  lon: number
}

function extractParkingLocations(text: string): ParkingLocation[] {
  if (!text) return []

  const parkings: ParkingLocation[] = []
  const normalizedText = text.replace(/:parking:/g, '🅿️')
  const coordPattern =
    /([-]?\d{1,3}[.,]\d{3,8})\s*[,\s]\s*([-]?\d{1,3}[.,]\d{3,8})/g

  let coordMatch = coordPattern.exec(normalizedText)
  while (coordMatch !== null) {
    const lat = parseFloat(coordMatch[1].replace(',', '.'))
    const lon = parseFloat(coordMatch[2].replace(',', '.'))
    const matchIndex = coordMatch.index
    const matchEnd = matchIndex + coordMatch[0].length

    if (isValidCoordinate(lat, lon)) {
      const contextStart = Math.max(0, matchIndex - 150)
      const contextEnd = Math.min(normalizedText.length, matchEnd + 150)
      const context = normalizedText.substring(contextStart, contextEnd)

      const parkingKeywords = /parking|aparcar|aparcamiento|🅿️/gi
      if (parkingKeywords.test(context)) {
        addParking(parkings, lat, lon)
      }
    }

    coordMatch = coordPattern.exec(normalizedText)
  }

  return parkings
}

function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

function addParking(parkings: ParkingLocation[], lat: number, lon: number) {
  const isDuplicate = parkings.some(
    (p) => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lon - lon) < 0.0001,
  )

  if (isDuplicate) return

  const parkingNumber = parkings.length + 1
  const name = `Parking ${parkingNumber}`

  parkings.push({ name, lat, lon })
}

function openNavigationToCoordinates(lat: number, lon: number) {
  const url = Platform.select({
    ios: `maps:?daddr=${lat},${lon}`,
    android: `google.navigation:q=${lat},${lon}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
  })

  if (url) {
    Linking.openURL(url)
  }
}

export default function SectorDetailScreen() {
  const params = useLocalSearchParams<{
    id: string
    name?: string
    cragName?: string
    orientation?: string
    sunExposure?: string
    rockType?: string
    avgStars?: string
    totalRoutes?: string
    routesInRange?: string
    gradeMin?: string
    gradeMax?: string
    distance?: string
    description?: string
    approach?: string
    climbingStyle?: string
    latitude?: string
    longitude?: string
    headerImageUrl?: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  // Fetch routes from API
  const { data: routesData, isLoading: isLoadingRoutes } = useSectorRoutes(
    params.id || '',
    undefined,
    !!params.id,
  )

  // Parse coordinates
  const latitude = params.latitude ? parseFloat(params.latitude) : null
  const longitude = params.longitude ? parseFloat(params.longitude) : null

  // Fetch weather data by coordinates
  const { data: weatherData, isLoading: isLoadingWeather } =
    useWeatherByCoordinates(
      latitude,
      longitude,
      latitude !== null && longitude !== null,
    )

  // Fetch topos for this sector
  const { data: toposData, isLoading: isLoadingTopos } = useSectorTopos(
    params.id || '',
    !!params.id,
  )
  const topos = toposData?.topos || []

  // Use passed params or fallback
  const sector = {
    id: params.id,
    name: params.name || 'Sector',
    cragName: params.cragName || '',
    orientation: params.orientation || '',
    sunExposure: params.sunExposure || '',
    rockType: params.rockType || '',
    avgStars: params.avgStars ? parseFloat(params.avgStars) : null,
    totalRoutes:
      routesData?.total ||
      (params.totalRoutes ? parseInt(params.totalRoutes, 10) : 0),
    routesInRange: params.routesInRange
      ? parseInt(params.routesInRange, 10)
      : null,
    gradeRange: { min: params.gradeMin || '', max: params.gradeMax || '' },
    distance: params.distance ? parseFloat(params.distance) : null,
    description: params.description || null,
    approach: params.approach || null,
    climbingStyle: params.climbingStyle || '',
    latitude,
    longitude,
  }

  // Extract parking locations
  const parkingLocations = useMemo(() => {
    const combinedText = [sector.approach, sector.description]
      .filter(Boolean)
      .join('\n\n')
    if (!combinedText) return []
    return extractParkingLocations(combinedText)
  }, [sector.approach, sector.description])

  const handleNavigateToParking = (parking: ParkingLocation) => {
    openNavigationToCoordinates(parking.lat, parking.lon)
  }

  // Filter states
  const [sortBy, setSortBy] = useState<'number' | 'grade' | 'stars' | 'height'>(
    'number',
  )
  const [minStars, setMinStars] = useState<number>(0)
  const [showOnlyInRange, setShowOnlyInRange] = useState<boolean>(false)

  // Route selection state
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(
    null,
  )

  const handleRoutePress = (route: RouteSearchInfo) => {
    if (route.id) {
      // Toggle highlight - if already selected, deselect
      setHighlightedRouteId((prev) => (prev === route.id ? null : route.id))
    }
  }

  const handleViewRouteDetails = (route: RouteSearchInfo) => {
    if (route.id) {
      router.push({
        pathname: '/route/[id]',
        params: {
          id: route.id,
          sectorId: params.id,
          name: route.name,
          grade: route.grade || '',
          height: route.height?.toString() || '',
          stars: route.stars?.toString() || '',
          pitches: route.pitches?.toString() || '',
          bolts: route.bolts?.toString() || '',
          gradeMin: sector.gradeRange.min || '',
          gradeMax: sector.gradeRange.max || '',
        },
      })
    }
  }

  const allRoutes = routesData?.routes || []

  const getRouteGradeIndex = (route: RouteSearchInfo): number => {
    return (
      route.gradeIndex ??
      (route.grade ? gradeToIndex(route.grade) : null) ??
      999
    )
  }

  const userMinGradeIndex = sector.gradeRange.min
    ? gradeToIndex(sector.gradeRange.min)
    : null
  const userMaxGradeIndex = sector.gradeRange.max
    ? gradeToIndex(sector.gradeRange.max)
    : null

  const isRouteInRange = (route: RouteSearchInfo): boolean => {
    if (userMinGradeIndex === null || userMaxGradeIndex === null) return false
    const routeGradeIndex =
      route.gradeIndex ?? (route.grade ? gradeToIndex(route.grade) : null)
    return (
      routeGradeIndex !== null &&
      routeGradeIndex >= userMinGradeIndex &&
      routeGradeIndex <= userMaxGradeIndex
    )
  }

  const filteredAndSortedRoutes = useMemo(() => {
    let routes = [...allRoutes]

    if (minStars > 0) {
      routes = routes.filter((r) => (r.stars ?? 0) >= minStars)
    }

    if (
      showOnlyInRange &&
      userMinGradeIndex !== null &&
      userMaxGradeIndex !== null
    ) {
      routes = routes.filter(isRouteInRange)
    }

    routes.sort((a, b) => {
      switch (sortBy) {
        case 'number': {
          // Sort by topoNumber (parse as int, fallback to string comparison)
          const numA = a.topoNumber ? parseInt(a.topoNumber, 10) : 9999
          const numB = b.topoNumber ? parseInt(b.topoNumber, 10) : 9999
          if (isNaN(numA) || isNaN(numB)) {
            return (a.topoNumber || '').localeCompare(b.topoNumber || '')
          }
          return numA - numB
        }
        case 'stars':
          return (b.stars ?? 0) - (a.stars ?? 0)
        case 'height':
          return (b.height ?? 0) - (a.height ?? 0)
        case 'grade':
        default:
          return getRouteGradeIndex(a) - getRouteGradeIndex(b)
      }
    })

    return routes
  }, [
    allRoutes,
    sortBy,
    minStars,
    showOnlyInRange,
    userMinGradeIndex,
    userMaxGradeIndex,
  ])

  const routesInRangeCount = useMemo(() => {
    if (userMinGradeIndex === null || userMaxGradeIndex === null) return 0
    return allRoutes.filter(isRouteInRange).length
  }, [allRoutes, userMinGradeIndex, userMaxGradeIndex])

  const handleGetDirections = () => {
    if (sector.latitude === null || sector.longitude === null) return
    openNavigationToCoordinates(sector.latitude, sector.longitude)
  }

  const getGradeColor = (grade: string | null): string => {
    if (!grade) return colors.textSecondary
    const gradeNum = parseInt(grade.replace(/[^\d]/g, ''), 10)
    if (gradeNum <= 5) return '#22C55E'
    if (gradeNum <= 6) return '#F59E0B'
    if (gradeNum <= 7) return '#EF4444'
    return '#7C3AED'
  }

  if (isLoadingRoutes && !routesData) {
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={true}
    >
      {/* Hero Header */}
      <HeroHeader
        title={sector.name}
        subtitle={sector.cragName || undefined}
        imageUrl={params.headerImageUrl || null}
        rockType={sector.rockType}
        climbingType={sector.climbingStyle}
        icon="layers-outline"
        onBack={() => router.back()}
        stats={[
          { label: 'routes', value: sector.totalRoutes, icon: 'git-branch' },
          ...(sector.routesInRange !== null
            ? [
                {
                  label: 'in range',
                  value: sector.routesInRange,
                  icon: 'checkmark-circle' as const,
                },
              ]
            : []),
          ...(sector.avgStars !== null && sector.avgStars > 0
            ? [
                {
                  label: 'stars',
                  value: sector.avgStars.toFixed(1),
                  icon: 'star' as const,
                },
              ]
            : []),
        ]}
        badge={
          sector.gradeRange.min && sector.gradeRange.max
            ? {
                label: `${sector.gradeRange.min} - ${sector.gradeRange.max}`,
                color: colors.primary,
              }
            : undefined
        }
      />

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="stats-chart-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Stats
            </Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {sector.totalRoutes}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Routes
              </Text>
            </View>
            {sector.routesInRange !== null && (
              <View
                style={[styles.statItem, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.statValue, { color: '#22C55E' }]}>
                  {sector.routesInRange}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  In Range
                </Text>
              </View>
            )}
            {sector.gradeRange.min && sector.gradeRange.max && (
              <View
                style={[styles.statItem, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {sector.gradeRange.min}-{sector.gradeRange.max}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Grades
                </Text>
              </View>
            )}
            {sector.avgStars !== null && sector.avgStars > 0 && (
              <View
                style={[styles.statItem, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                  {sector.avgStars.toFixed(1)} ★
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Quality
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Information */}
        {(sector.rockType ||
          sector.orientation ||
          sector.sunExposure ||
          sector.climbingStyle) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Information
              </Text>
            </View>
            <View
              style={[styles.textContainer, { backgroundColor: colors.muted }]}
            >
              {sector.rockType && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="diamond-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Rock:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {sector.rockType}
                  </Text>
                </View>
              )}
              {sector.orientation && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="compass-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Orientation:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {sector.orientation}
                  </Text>
                </View>
              )}
              {sector.sunExposure && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="sunny-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Exposure:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {sector.sunExposure}
                  </Text>
                </View>
              )}
              {sector.climbingStyle && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="hand-left-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Style:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {sector.climbingStyle}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Weather */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="partly-sunny-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Weather
            </Text>
            {isLoadingWeather && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
          {weatherData?.daily && weatherData.daily.length > 0 ? (
            <View
              style={[
                styles.weatherContainer,
                { backgroundColor: colors.muted },
              ]}
            >
              {weatherData.daily.slice(0, 5).map((day, index) => (
                <View key={day.date} style={styles.weatherDay}>
                  <Text style={[styles.weatherDayName, { color: colors.text }]}>
                    {formatDayName(day.date, index)}
                  </Text>
                  <WeatherIcon
                    condition={getWeatherCondition(day.weatherCode)}
                    size={28}
                  />
                  <Text style={[styles.weatherTemp, { color: colors.text }]}>
                    {Math.round(day.temperature.max)}°
                  </Text>
                  <Text
                    style={[
                      styles.weatherTempMin,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {Math.round(day.temperature.min)}°
                  </Text>
                  {day.precipitation.probability > 20 && (
                    <View style={styles.precipBadge}>
                      <Ionicons name="water" size={10} color="#3B82F6" />
                      <Text style={styles.precipText}>
                        {day.precipitation.probability}%
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            !isLoadingWeather && (
              <View
                style={[
                  styles.textContainer,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Text style={[styles.text, { color: colors.textSecondary }]}>
                  {latitude === null || longitude === null
                    ? 'Location data not available'
                    : 'Weather data not available'}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Topos / Photos */}
        {(topos.length > 0 || isLoadingTopos) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Topos {topos.length > 0 && `(${topos.length})`}
              </Text>
              {isLoadingTopos && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>

            {topos.length > 0 ? (
              <View style={styles.toposContainer}>
                {topos.map((topo) => (
                  <TopoViewer
                    key={topo.id}
                    topo={topo}
                    highlightedRouteId={highlightedRouteId || undefined}
                    gradeRange={
                      userMinGradeIndex !== null && userMaxGradeIndex !== null
                        ? { min: userMinGradeIndex, max: userMaxGradeIndex }
                        : undefined
                    }
                    routeDetails={allRoutes}
                    showRouteList={false}
                    onRoutePress={(routePos) => {
                      setHighlightedRouteId((prev) =>
                        prev === routePos.routeId ? null : routePos.routeId,
                      )
                    }}
                  />
                ))}
              </View>
            ) : (
              !isLoadingTopos && (
                <View
                  style={[
                    styles.textContainer,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Text style={[styles.text, { color: colors.textSecondary }]}>
                    No topos available
                  </Text>
                </View>
              )
            )}
          </View>
        )}

        {/* Routes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Routes ({filteredAndSortedRoutes.length}
              {filteredAndSortedRoutes.length !== allRoutes.length
                ? ` of ${allRoutes.length}`
                : ''}
              )
            </Text>
            {isLoadingRoutes && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginLeft: 8 }}
              />
            )}
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
            style={styles.filtersRow}
          >
            <Pressable
              onPress={() => {
                const options: Array<'number' | 'grade' | 'stars' | 'height'> =
                  ['number', 'grade', 'stars', 'height']
                const currentIndex = options.indexOf(sortBy)
                const nextIndex = (currentIndex + 1) % options.length
                setSortBy(options[nextIndex])
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: colors.primary + '20',
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons
                name={
                  sortBy === 'number'
                    ? 'list-outline'
                    : sortBy === 'grade'
                      ? 'trending-up'
                      : sortBy === 'stars'
                        ? 'star'
                        : 'resize-outline'
                }
                size={12}
                color={colors.primary}
              />
              <Text style={[styles.filterChipText, { color: colors.primary }]}>
                {sortBy === 'number'
                  ? 'By #'
                  : sortBy === 'grade'
                    ? 'By Grade'
                    : sortBy === 'stars'
                      ? 'By Stars'
                      : 'By Height'}
              </Text>
            </Pressable>

            {userMinGradeIndex !== null && userMaxGradeIndex !== null && (
              <Pressable
                onPress={() => setShowOnlyInRange(!showOnlyInRange)}
                style={[
                  styles.filterChip,
                  showOnlyInRange
                    ? { backgroundColor: '#22C55E20', borderColor: '#22C55E' }
                    : {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                      },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color={showOnlyInRange ? '#22C55E' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: showOnlyInRange ? '#22C55E' : colors.textSecondary,
                    },
                  ]}
                >
                  {showOnlyInRange
                    ? `In Range (${routesInRangeCount})`
                    : 'In Range'}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                const options = [0, 2, 3, 4]
                const currentIndex = options.indexOf(minStars)
                const nextIndex = (currentIndex + 1) % options.length
                setMinStars(options[nextIndex])
              }}
              style={[
                styles.filterChip,
                minStars > 0
                  ? { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }
                  : {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
              ]}
            >
              <Ionicons
                name="star"
                size={12}
                color={minStars > 0 ? '#F59E0B' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: minStars > 0 ? '#F59E0B' : colors.textSecondary },
                ]}
              >
                {minStars > 0 ? `${minStars}+ Stars` : 'Any Stars'}
              </Text>
            </Pressable>
          </ScrollView>

          {/* Routes List */}
          {filteredAndSortedRoutes.length === 0 && !isLoadingRoutes && (
            <View
              style={[styles.emptyContainer, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {allRoutes.length === 0
                  ? 'No routes found'
                  : 'No routes match filters'}
              </Text>
            </View>
          )}

          {filteredAndSortedRoutes.map(
            (route: RouteSearchInfo, index: number) => {
              const inRange = isRouteInRange(route)
              const gradeColor = getGradeColor(route.grade)
              const isHighlighted = route.id === highlightedRouteId

              return (
                <Pressable
                  key={route.id || `route-${index}`}
                  onPress={() => handleRoutePress(route)}
                  style={[
                    styles.routeRow,
                    {
                      backgroundColor: isHighlighted
                        ? colors.primary + '15'
                        : colors.card,
                      borderColor: isHighlighted
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  {/* Number badge */}
                  <View
                    style={[
                      styles.routeNumBadge,
                      {
                        backgroundColor: isHighlighted
                          ? colors.primary
                          : colors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.routeNumText,
                        { color: isHighlighted ? '#FFF' : colors.text },
                      ]}
                    >
                      {route.topoNumber || index + 1}
                    </Text>
                  </View>

                  {/* Route info */}
                  <View style={styles.routeInfo}>
                    <View style={styles.routeNameRow}>
                      {inRange && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#22C55E"
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[styles.routeName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {route.name}
                      </Text>
                    </View>
                    <View style={styles.routeMeta}>
                      {route.height && (
                        <Text
                          style={[
                            styles.routeMetaText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {route.height}m
                        </Text>
                      )}
                      {route.stars !== null && route.stars > 0 && (
                        <>
                          <Text
                            style={[
                              styles.routeMetaText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            •
                          </Text>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <Text
                            style={[styles.routeMetaText, { color: '#F59E0B' }]}
                          >
                            {route.stars.toFixed(1)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Grade badge */}
                  <View
                    style={[
                      styles.gradeBadge,
                      { backgroundColor: gradeColor + '20' },
                    ]}
                  >
                    <Text style={[styles.gradeText, { color: gradeColor }]}>
                      {route.grade || '-'}
                    </Text>
                  </View>

                  {/* Details button */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation()
                      handleViewRouteDetails(route)
                    }}
                    hitSlop={8}
                    style={[
                      styles.detailsButton,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                </Pressable>
              )
            },
          )}
        </View>

        {/* Description */}
        {sector.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Description
              </Text>
            </View>
            <View
              style={[styles.textContainer, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.text, { color: colors.text }]}>
                {formatInfoText(sector.description)}
              </Text>
            </View>
          </View>
        )}

        {/* Approach */}
        {sector.approach && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="walk-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Approach
              </Text>
            </View>
            <View
              style={[styles.textContainer, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.text, { color: colors.text }]}>
                {formatInfoText(sector.approach)}
              </Text>
            </View>

            {parkingLocations.length > 0 && (
              <View style={styles.parkingContainer}>
                {parkingLocations.map((parking, index) => (
                  <Pressable
                    key={`parking-${index}-${parking.lat}`}
                    onPress={() => handleNavigateToParking(parking)}
                    style={[
                      styles.parkingButton,
                      { backgroundColor: '#3B82F6' },
                    ]}
                  >
                    <Ionicons name="car" size={20} color="#FFF" />
                    <Text style={styles.parkingButtonText}>
                      {parkingLocations.length > 1
                        ? parking.name
                        : 'Navigate to Parking'}
                    </Text>
                    <Ionicons name="navigate" size={16} color="#FFF" />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Location */}
        {sector.latitude !== null && sector.longitude !== null && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Location
              </Text>
            </View>
            <View
              style={[styles.textContainer, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.text, { color: colors.text }]}>
                {sector.latitude.toFixed(6)}, {sector.longitude.toFixed(6)}
              </Text>
            </View>
            <Pressable
              onPress={handleGetDirections}
              style={[
                styles.parkingButton,
                { backgroundColor: '#10B981', marginTop: 12 },
              ]}
            >
              <Ionicons name="navigate" size={20} color="#FFF" />
              <Text style={styles.parkingButtonText}>Get Directions</Text>
              <Ionicons name="open-outline" size={16} color="#FFF" />
            </Pressable>
          </View>
        )}
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  textContainer: {
    padding: 16,
    borderRadius: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flex: 1,
    minWidth: 80,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  weatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 12,
  },
  weatherDay: {
    alignItems: 'center',
    gap: 4,
  },
  weatherDayName: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: '700',
  },
  weatherTempMin: {
    fontSize: 12,
  },
  precipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  precipText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '500',
  },
  toposContainer: {
    gap: 16,
  },
  filtersRow: {
    marginBottom: 12,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 12,
  },
  // Routes List
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  routeNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeNumText: {
    fontSize: 12,
    fontWeight: '700',
  },
  routeInfo: {
    flex: 1,
  },
  routeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  routeMetaText: {
    fontSize: 12,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  parkingContainer: {
    marginTop: 12,
    gap: 8,
  },
  parkingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  parkingButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
})
