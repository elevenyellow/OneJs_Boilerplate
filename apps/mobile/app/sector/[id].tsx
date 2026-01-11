import { FilterChip } from '@/components/FilterChip'
import { FilterChipsRow } from '@/components/FilterChipsRow'
import { HeroHeader } from '@/components/HeroHeader'
import { WeatherCard } from '@/components/WeatherCard'
import { TopoViewer } from '@/components/TopoViewer'
import { Colors } from '@/constants/Colors'
import { useFilters } from '@/contexts/FiltersContext'
import { useSectorRoutes } from '@/hooks/useSectorRoutes'
import { useSectorTopos } from '@/hooks/useTopos'
import type { RouteSearchInfo } from '@/lib/api'
import { gradeToIndex, indexToGrade } from '@/utils/gradeConverter'
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

  // Get global grade range and picker
  const { gradeRange: globalGradeRange, showGradePicker, isGradeInRange } = useFilters()

  // Filter states
  const [sortBy, setSortBy] = useState<'number' | 'grade' | 'stars' | 'height'>(
    'number',
  )
  const [minStars, setMinStars] = useState<number>(0)
  const [gradeFilter, setGradeFilter] = useState<'all' | 'inRange'>('all')

  // Route selection state
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(
    null,
  )

  // Info toggle state
  const [showInfo, setShowInfo] = useState(false)

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

  // Use global grade range for filtering
  const globalMinGradeIndex = gradeToIndex(globalGradeRange.min)
  const globalMaxGradeIndex = gradeToIndex(globalGradeRange.max)

  // Also keep sector-specific range for display
  const userMinGradeIndex = sector.gradeRange.min
    ? gradeToIndex(sector.gradeRange.min)
    : null
  const userMaxGradeIndex = sector.gradeRange.max
    ? gradeToIndex(sector.gradeRange.max)
    : null

  // Use context's isGradeInRange for filtering
  const isRouteInGlobalRange = (route: RouteSearchInfo): boolean => {
    const routeGradeIndex =
      route.gradeIndex ?? (route.grade ? gradeToIndex(route.grade) : null)
    return isGradeInRange(routeGradeIndex)
  }

  const filteredAndSortedRoutes = useMemo(() => {
    let routes = [...allRoutes]

    // Filter by global grade range
    if (gradeFilter === 'inRange') {
      routes = routes.filter(isRouteInGlobalRange)
    }

    // Filter by minimum stars
    if (minStars > 0) {
      routes = routes.filter((r) => (r.stars ?? 0) >= minStars)
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
    gradeFilter,
    globalMinGradeIndex,
    globalMaxGradeIndex,
  ])

  const routesInGlobalRangeCount = useMemo(() => {
    if (globalMinGradeIndex === null || globalMaxGradeIndex === null) return 0
    return allRoutes.filter(isRouteInGlobalRange).length
  }, [allRoutes, globalMinGradeIndex, globalMaxGradeIndex])

  // Computed stats from routes
  const routeStats = useMemo(() => {
    if (allRoutes.length === 0) return null

    const heights = allRoutes.map((r) => r.height).filter((h): h is number => h !== null && h > 0)
    const grades = allRoutes.map((r) => r.gradeIndex ?? (r.grade ? gradeToIndex(r.grade) : null)).filter((g): g is number => g !== null)
    const stars = allRoutes.map((r) => r.stars).filter((s): s is number => s !== null && s > 0)

    const maxHeight = heights.length > 0 ? Math.max(...heights) : null
    const avgHeight = heights.length > 0 ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length) : null
    
    const minGradeIndex = grades.length > 0 ? Math.min(...grades) : null
    const maxGradeIndex = grades.length > 0 ? Math.max(...grades) : null
    const avgGradeIndex = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null
    
    const avgStars = stars.length > 0 ? stars.reduce((a, b) => a + b, 0) / stars.length : null

    return {
      maxHeight,
      avgHeight,
      minGradeIndex,
      maxGradeIndex,
      avgGradeIndex,
      avgStars,
      totalWithHeight: heights.length,
      totalWithGrade: grades.length,
      totalWithStars: stars.length,
    }
  }, [allRoutes])

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
        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          {/* Info Button */}
          {(sector.description || sector.approach) && (
            <Pressable
              onPress={() => setShowInfo(!showInfo)}
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="information-circle" size={22} color="#3B82F6" />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Info
              </Text>
            </Pressable>
          )}

          {/* Parking Button */}
          {parkingLocations.length > 0 && (
            <Pressable
              onPress={() => handleNavigateToParking(parkingLocations[0])}
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="car" size={22} color="#F59E0B" />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Parking
              </Text>
            </Pressable>
          )}
        </View>

        {/* Collapsible Info Section */}
        {showInfo && (sector.description || sector.approach) && (
          <View style={[styles.infoSection, { backgroundColor: colors.muted }]}>
            {sector.description && (
              <View style={styles.infoBlock}>
                <View style={styles.infoBlockHeader}>
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  <Text style={[styles.infoBlockTitle, { color: colors.text }]}>
                    Description
                  </Text>
                </View>
                <Text style={[styles.infoBlockText, { color: colors.textSecondary }]}>
                  {formatInfoText(sector.description)}
                </Text>
              </View>
            )}
            {sector.approach && (
              <View style={styles.infoBlock}>
                <View style={styles.infoBlockHeader}>
                  <Ionicons name="walk-outline" size={18} color={colors.primary} />
                  <Text style={[styles.infoBlockTitle, { color: colors.text }]}>
                    Approach
                  </Text>
                </View>
                <Text style={[styles.infoBlockText, { color: colors.textSecondary }]}>
                  {formatInfoText(sector.approach)}
                </Text>
              </View>
            )}
          </View>
        )}

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
            {/* Total Routes */}
            <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {sector.totalRoutes}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Routes
              </Text>
            </View>

            {/* Routes in Global Range */}
            {routesInGlobalRangeCount > 0 && (
              <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statValue, { color: '#22C55E' }]}>
                  {routesInGlobalRangeCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  In Range
                </Text>
              </View>
            )}

            {/* Easiest Grade */}
            {routeStats && routeStats.minGradeIndex !== null && (
              <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statValue, { color: '#22C55E' }]}>
                  {indexToGrade(routeStats.minGradeIndex)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Easiest
                </Text>
              </View>
            )}

            {/* Hardest Grade */}
            {routeStats && routeStats.maxGradeIndex !== null && (
              <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {indexToGrade(routeStats.maxGradeIndex)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Hardest
                </Text>
              </View>
            )}

            {/* Average Grade */}
            {routeStats && routeStats.avgGradeIndex !== null && (
              <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {indexToGrade(routeStats.avgGradeIndex)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Avg Grade
                </Text>
              </View>
            )}

            {/* Max Height */}
            {routeStats && routeStats.maxHeight !== null && (
              <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                  {routeStats.maxHeight}m
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Max Height
                </Text>
              </View>
            )}

            {/* Average Height */}
            {routeStats && routeStats.avgHeight !== null && (
              <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                  {routeStats.avgHeight}m
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Avg Height
                </Text>
              </View>
            )}

            {/* Quality (Stars) */}
            {routeStats && routeStats.avgStars !== null && routeStats.avgStars > 0 && (
              <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                  {routeStats.avgStars.toFixed(1)} ★
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Quality
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Weather Card */}
        {latitude !== null && longitude !== null && (
          <WeatherCard
            latitude={latitude}
            longitude={longitude}
            onPress={() => router.push({
              pathname: '/sector/weather/[id]',
              params: { id: params.id, lat: latitude.toString(), lon: longitude.toString(), name: sector.name },
            })}
            showChevron
            style={{ marginTop: 16 }}
          />
        )}

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
          <FilterChipsRow>
            {/* Sort Filter */}
            <FilterChip
              label={
                sortBy === 'number'
                  ? 'By #'
                  : sortBy === 'grade'
                    ? 'By Grade'
                    : sortBy === 'stars'
                      ? 'By Stars'
                      : 'By Height'
              }
              icon={
                sortBy === 'number'
                  ? 'list-outline'
                  : sortBy === 'grade'
                    ? 'trending-up'
                    : sortBy === 'stars'
                      ? 'star'
                      : 'resize-outline'
              }
              isActive
              onPress={() => {
                const options: Array<'number' | 'grade' | 'stars' | 'height'> =
                  ['number', 'grade', 'stars', 'height']
                const currentIndex = options.indexOf(sortBy)
                const nextIndex = (currentIndex + 1) % options.length
                setSortBy(options[nextIndex])
              }}
            />

            {/* Grade Range Selector (opens global picker) */}
            <FilterChip
              label={`${globalGradeRange.min} - ${globalGradeRange.max}`}
              icon="options-outline"
              isActive
              onPress={showGradePicker}
            />

            {/* Filter by Grade Range Toggle */}
            <FilterChip
              label={gradeFilter === 'inRange' 
                ? `In Range (${routesInGlobalRangeCount})`
                : 'All Grades'
              }
              icon={gradeFilter === 'inRange' ? 'checkmark-circle' : 'ellipse-outline'}
              isActive={gradeFilter === 'inRange'}
              activeColor="#22C55E"
              onPress={() => setGradeFilter(gradeFilter === 'all' ? 'inRange' : 'all')}
            />

            {/* Sun/Shade Info Badge */}
            {sector.sunExposure && (
              <FilterChip
                label={sector.sunExposure}
                icon={sector.sunExposure.toLowerCase().includes('sun') || sector.sunExposure.toLowerCase().includes('sol')
                  ? 'sunny'
                  : sector.sunExposure.toLowerCase().includes('shade') || sector.sunExposure.toLowerCase().includes('sombra')
                    ? 'moon'
                    : 'contrast-outline'
                }
                isActive={false}
                onPress={() => { /* Info badge - no action */ }}
              />
            )}

            {/* Stars Filter */}
            <FilterChip
              label={minStars > 0 ? `${minStars}+ ★` : 'Any Stars'}
              icon="star"
              isActive={minStars > 0}
              activeColor="#F59E0B"
              onPress={() => {
                const options = [0, 1, 2, 3]
                const currentIndex = options.indexOf(minStars)
                const nextIndex = (currentIndex + 1) % options.length
                setMinStars(options[nextIndex])
              }}
            />
          </FilterChipsRow>

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
              const inRange = isRouteInGlobalRange(route)
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
                      {route.height !== null && route.height > 0 && (
                        <View style={styles.routeMetaItem}>
                          <Ionicons
                            name="resize-outline"
                            size={11}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.routeMetaText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {route.height}m
                          </Text>
                        </View>
                      )}
                      {route.pitches !== null && route.pitches > 1 && (
                        <View style={styles.routeMetaItem}>
                          <Ionicons
                            name="layers-outline"
                            size={11}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.routeMetaText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {route.pitches}L
                          </Text>
                        </View>
                      )}
                      {route.bolts !== null && route.bolts > 0 && (
                        <View style={styles.routeMetaItem}>
                          <Ionicons
                            name="link-outline"
                            size={11}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.routeMetaText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {route.bolts}
                          </Text>
                        </View>
                      )}
                      {route.stars !== null && route.stars > 0 && (
                        <View style={styles.routeMetaItem}>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <Text
                            style={[styles.routeMetaText, { color: '#F59E0B' }]}
                          >
                            {route.stars.toFixed(1)}
                          </Text>
                        </View>
                      )}
                      {route.ascents !== null && route.ascents > 0 && (
                        <View style={styles.routeMetaItem}>
                          <Ionicons
                            name="people-outline"
                            size={11}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.routeMetaText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {route.ascents}
                          </Text>
                        </View>
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
  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Collapsible Info Section
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  infoBlock: {
    gap: 8,
  },
  infoBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBlockTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoBlockText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginLeft: 4,
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
  toposContainer: {
    gap: 16,
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
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 8,
  },
  routeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
