import { FilterChip } from '@/components/FilterChip'
import { FilterChipsRow } from '@/components/FilterChipsRow'
import { HeroHeader } from '@/components/HeroHeader'
import { LanguageTextSection } from '@/components/LanguageTextSection'
import { TopoViewer } from '@/components/TopoViewer'
import { WeatherChip } from '@/components/WeatherChip'
import { Colors } from '@/constants/Colors'
import { useFilters } from '@/contexts/FiltersContext'
import { useSectorRoutes } from '@/hooks/useSectorRoutes'
import { useSectorTopos } from '@/hooks/useTopos'
import type {
  RouteSearchInfo as RouteInfo,
  RouteSearchInfo,
  TopoImage,
} from '@/lib/api'
import { t } from '@/lib/i18n'
import { gradeToIndex, indexToGrade } from '@/utils/gradeConverter'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'

// Local type for parsed tags
interface SectorTagsLocal {
  kidFriendly: boolean | null
  dogFriendly: boolean | null
  accessible: boolean | null
  camping: boolean | null
  swimming: boolean | null
  scenic: boolean | null
  popular: boolean | null
  quiet: boolean | null
  multipitch: boolean | null
  trad: boolean | null
  sport: boolean | null
  bouldering: boolean | null
  beginner: boolean | null
  rawTags: string[]
}

// Section type for SectionList with sticky topo headers
interface TopoSection {
  topo: TopoImage | null
  topoIndex: number
  title: string
  data: RouteInfo[]
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
    // Individual tag params
    kidFriendly?: string
    dogFriendly?: string
    beginner?: string
    accessible?: string
    scenic?: string
    camping?: string
    swimming?: string
    quiet?: string
    popular?: string
    sport?: string
    trad?: string
    bouldering?: string
    multipitch?: string
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

  // Parse tags from individual params
  const sectorTags: SectorTagsLocal | null = useMemo(() => {
    // Check if any tag param is present
    const hasAnyTag =
      params.kidFriendly !== undefined ||
      params.dogFriendly !== undefined ||
      params.beginner !== undefined ||
      params.accessible !== undefined ||
      params.scenic !== undefined ||
      params.camping !== undefined ||
      params.swimming !== undefined ||
      params.quiet !== undefined ||
      params.popular !== undefined ||
      params.sport !== undefined ||
      params.trad !== undefined ||
      params.bouldering !== undefined ||
      params.multipitch !== undefined

    if (!hasAnyTag) return null

    return {
      kidFriendly:
        params.kidFriendly === 'true'
          ? true
          : params.kidFriendly === 'false'
            ? false
            : null,
      dogFriendly: params.dogFriendly === 'true' ? true : null,
      accessible: params.accessible === 'true' ? true : null,
      camping: params.camping === 'true' ? true : null,
      swimming: params.swimming === 'true' ? true : null,
      scenic: params.scenic === 'true' ? true : null,
      popular: params.popular === 'true' ? true : null,
      quiet: params.quiet === 'true' ? true : null,
      multipitch: params.multipitch === 'true' ? true : null,
      trad: params.trad === 'true' ? true : null,
      sport: params.sport === 'true' ? true : null,
      bouldering: params.bouldering === 'true' ? true : null,
      beginner: params.beginner === 'true' ? true : null,
      rawTags: [],
    }
  }, [
    params.kidFriendly,
    params.dogFriendly,
    params.beginner,
    params.accessible,
    params.scenic,
    params.camping,
    params.swimming,
    params.quiet,
    params.popular,
    params.sport,
    params.trad,
    params.bouldering,
    params.multipitch,
  ])

  // Convert sector tags to HeroHeader format
  const heroTags = useMemo(() => {
    if (!sectorTags) return undefined

    const tags: {
      label: string
      icon: keyof typeof Ionicons.glyphMap
      color: string
    }[] = []

    if (sectorTags.kidFriendly === true) {
      tags.push({
        label: 'Kid Friendly',
        icon: 'happy-outline',
        color: '#16A34A',
      })
    }
    if (sectorTags.kidFriendly === false) {
      tags.push({
        label: 'Not Kid Friendly',
        icon: 'warning-outline',
        color: '#DC2626',
      })
    }
    if (sectorTags.dogFriendly === true) {
      tags.push({
        label: 'Dog Friendly',
        icon: 'paw-outline',
        color: '#D97706',
      })
    }
    if (sectorTags.beginner === true) {
      tags.push({ label: 'Beginner', icon: 'school-outline', color: '#2563EB' })
    }
    if (sectorTags.accessible === true) {
      tags.push({
        label: 'Accessible',
        icon: 'accessibility-outline',
        color: '#4F46E5',
      })
    }
    if (sectorTags.scenic === true) {
      tags.push({ label: 'Scenic', icon: 'eye-outline', color: '#059669' })
    }
    if (sectorTags.camping === true) {
      tags.push({ label: 'Camping', icon: 'bonfire-outline', color: '#CA8A04' })
    }
    if (sectorTags.swimming === true) {
      tags.push({ label: 'Swimming', icon: 'water-outline', color: '#0891B2' })
    }
    if (sectorTags.quiet === true) {
      tags.push({ label: 'Quiet', icon: 'leaf-outline', color: '#7C3AED' })
    }
    if (sectorTags.popular === true) {
      tags.push({ label: 'Crowded', icon: 'people-outline', color: '#EA580C' })
    }
    if (sectorTags.sport === true) {
      tags.push({ label: 'Sport', icon: 'flash-outline', color: '#3B82F6' })
    }
    if (sectorTags.trad === true) {
      tags.push({ label: 'Trad', icon: 'shield-outline', color: '#F59E0B' })
    }
    if (sectorTags.bouldering === true) {
      tags.push({ label: 'Boulder', icon: 'fitness-outline', color: '#10B981' })
    }
    if (sectorTags.multipitch === true) {
      tags.push({
        label: 'Multipitch',
        icon: 'trending-up-outline',
        color: '#8B5CF6',
      })
    }

    return tags.length > 0 ? tags : undefined
  }, [sectorTags])

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
  const {
    gradeRange: globalGradeRange,
    showGradePicker,
    isGradeInRange,
  } = useFilters()

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

  // Group routes by topo image for SectionList
  const sections: TopoSection[] = useMemo(() => {
    if (topos.length === 0) {
      // No topos - single section with all routes
      if (filteredAndSortedRoutes.length === 0) return []
      return [
        {
          topo: null,
          topoIndex: 0,
          title: `All Routes (${filteredAndSortedRoutes.length})`,
          data: filteredAndSortedRoutes,
        },
      ]
    }

    // Build a set of all route IDs that appear in any topo
    const routeIdsInTopos = new Set<string>()
    for (const topo of topos) {
      for (const routePos of topo.routes || []) {
        routeIdsInTopos.add(routePos.routeId)
      }
    }

    // Create sections for each topo
    const topoSections: TopoSection[] = topos
      .map((topo, index) => {
        const topoRouteIds = new Set((topo.routes || []).map((r) => r.routeId))
        const routesInTopo = filteredAndSortedRoutes.filter((route) =>
          topoRouteIds.has(route.id),
        )
        return {
          topo,
          topoIndex: index + 1,
          title: `Topo ${index + 1} (${routesInTopo.length} routes)`,
          data: routesInTopo,
        }
      })
      .filter((section) => section.data.length > 0)

    // Routes that are not in any topo
    const routesWithoutTopo = filteredAndSortedRoutes.filter(
      (route) => !routeIdsInTopos.has(route.id),
    )

    if (routesWithoutTopo.length > 0) {
      topoSections.push({
        topo: null,
        topoIndex: 0,
        title:
          topoSections.length > 0
            ? `Other Routes (${routesWithoutTopo.length})`
            : `All Routes (${routesWithoutTopo.length})`,
        data: routesWithoutTopo,
      })
    }

    return topoSections
  }, [topos, filteredAndSortedRoutes])

  // Computed stats from routes
  const routeStats = useMemo(() => {
    if (allRoutes.length === 0) return null

    const heights = allRoutes
      .map((r) => r.height)
      .filter((h): h is number => h !== null && h > 0)
    const grades = allRoutes
      .map((r) => r.gradeIndex ?? (r.grade ? gradeToIndex(r.grade) : null))
      .filter((g): g is number => g !== null)
    const stars = allRoutes
      .map((r) => r.stars)
      .filter((s): s is number => s !== null && s > 0)

    const maxHeight = heights.length > 0 ? Math.max(...heights) : null
    const avgHeight =
      heights.length > 0
        ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length)
        : null

    const minGradeIndex = grades.length > 0 ? Math.min(...grades) : null
    const maxGradeIndex = grades.length > 0 ? Math.max(...grades) : null
    const avgGradeIndex =
      grades.length > 0
        ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
        : null

    const avgStars =
      stars.length > 0 ? stars.reduce((a, b) => a + b, 0) / stars.length : null

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

  // Helper function to render a route row
  const renderRouteRow = (route: RouteSearchInfo, index: number) => {
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
            borderColor: isHighlighted ? colors.primary : colors.border,
          },
        ]}
      >
        {/* Number badge */}
        <View
          style={[
            styles.routeNumBadge,
            {
              backgroundColor: isHighlighted ? colors.primary : colors.muted,
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
                <Text style={[styles.routeMetaText, { color: '#F59E0B' }]}>
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
          style={[styles.gradeBadge, { backgroundColor: gradeColor + '20' }]}
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
          style={[styles.detailsButton, { backgroundColor: colors.muted }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
        </Pressable>
      </Pressable>
    )
  }

  // Render item for SectionList
  const renderItem = useCallback(
    ({ item, index }: { item: RouteSearchInfo; index: number }) => {
      return (
        <View style={styles.routeItemContainer}>
          {renderRouteRow(item, index)}
        </View>
      )
    },
    [highlightedRouteId, colors, isRouteInGlobalRange],
  )

  // Render section header with sticky topo image - no title, just the image
  const renderSectionHeader = useCallback(
    ({ section }: { section: TopoSection }) => {
      // Only render topo image, skip header for sections without topo
      if (!section.topo) return null

      return (
        <View
          style={[
            styles.stickyTopoHeader,
            { backgroundColor: colors.background },
          ]}
        >
          <TopoViewer
            topo={section.topo}
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
        </View>
      )
    },
    [
      highlightedRouteId,
      colors,
      userMinGradeIndex,
      userMaxGradeIndex,
      allRoutes,
    ],
  )

  // Key extractor
  const keyExtractor = useCallback((item: RouteSearchInfo, index: number) => {
    return item.id || `route-${index}`
  }, [])

  // List header component (content before routes) - must be before early return
  const ListHeaderComponent = useCallback(
    () => (
      <>
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
          tags={heroTags}
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
            <View style={styles.infoSection}>
              {sector.description && (
                <LanguageTextSection
                  text={sector.description}
                  title={t('description')}
                />
              )}
              {sector.approach && (
                <LanguageTextSection
                  text={sector.approach}
                  title={t('approach')}
                  showMapButton={!!latitude && !!longitude}
                  latitude={latitude}
                  longitude={longitude}
                  locationName={sector.name}
                />
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
              <View
                style={[styles.statItem, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {sector.totalRoutes}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Routes
                </Text>
              </View>

              {/* Routes in Global Range */}
              {routesInGlobalRangeCount > 0 && (
                <View
                  style={[styles.statItem, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.statValue, { color: '#22C55E' }]}>
                    {routesInGlobalRangeCount}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    In Range
                  </Text>
                </View>
              )}

              {/* Easiest Grade */}
              {routeStats && routeStats.minGradeIndex !== null && (
                <View
                  style={[styles.statItem, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.statValue, { color: '#22C55E' }]}>
                    {indexToGrade(routeStats.minGradeIndex)}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Easiest
                  </Text>
                </View>
              )}

              {/* Hardest Grade */}
              {routeStats && routeStats.maxGradeIndex !== null && (
                <View
                  style={[styles.statItem, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.statValue, { color: '#EF4444' }]}>
                    {indexToGrade(routeStats.maxGradeIndex)}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Hardest
                  </Text>
                </View>
              )}

              {/* Average Grade */}
              {routeStats && routeStats.avgGradeIndex !== null && (
                <View
                  style={[styles.statItem, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {indexToGrade(routeStats.avgGradeIndex)}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Avg Grade
                  </Text>
                </View>
              )}

              {/* Max Height */}
              {routeStats && routeStats.maxHeight !== null && (
                <View
                  style={[styles.statItem, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                    {routeStats.maxHeight}m
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Max Height
                  </Text>
                </View>
              )}

              {/* Average Height */}
              {routeStats && routeStats.avgHeight !== null && (
                <View
                  style={[styles.statItem, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                    {routeStats.avgHeight}m
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Avg Height
                  </Text>
                </View>
              )}

              {/* Quality (Stars) */}
              {routeStats &&
                routeStats.avgStars !== null &&
                routeStats.avgStars > 0 && (
                  <View
                    style={[styles.statItem, { backgroundColor: colors.muted }]}
                  >
                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                      {routeStats.avgStars.toFixed(1)} ★
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Quality
                    </Text>
                  </View>
                )}

              {/* Weather Chip integrated in stats */}
              {latitude !== null && longitude !== null && (
                <WeatherChip
                  latitude={latitude}
                  longitude={longitude}
                  onPress={() =>
                    router.push({
                      pathname: '/sector/weather/[id]',
                      params: {
                        id: params.id,
                        lat: latitude.toString(),
                        lon: longitude.toString(),
                        name: sector.name,
                      },
                    })
                  }
                />
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
                style={[
                  styles.textContainer,
                  { backgroundColor: colors.muted },
                ]}
              >
                {sector.rockType && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="diamond-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: colors.textSecondary },
                      ]}
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
                      style={[
                        styles.infoLabel,
                        { color: colors.textSecondary },
                      ]}
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
                      style={[
                        styles.infoLabel,
                        { color: colors.textSecondary },
                      ]}
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
                      style={[
                        styles.infoLabel,
                        { color: colors.textSecondary },
                      ]}
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

          {/* Routes Section Header and Filters - Unified Compact Block */}
          <View style={styles.routesBlock}>
            <View style={styles.routesTitleRow}>
              <Ionicons name="list-outline" size={18} color={colors.primary} />
              <Text style={[styles.routesTitleText, { color: colors.text }]}>
                {filteredAndSortedRoutes.length}
                {filteredAndSortedRoutes.length !== allRoutes.length
                  ? `/${allRoutes.length}`
                  : ''}{' '}
                routes
              </Text>
              {(isLoadingRoutes || isLoadingTopos) && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
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
                  const options: Array<
                    'number' | 'grade' | 'stars' | 'height'
                  > = ['number', 'grade', 'stars', 'height']
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
                label={
                  gradeFilter === 'inRange'
                    ? `In Range (${routesInGlobalRangeCount})`
                    : 'All Grades'
                }
                icon={
                  gradeFilter === 'inRange'
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                isActive={gradeFilter === 'inRange'}
                activeColor="#22C55E"
                onPress={() =>
                  setGradeFilter(gradeFilter === 'all' ? 'inRange' : 'all')
                }
              />

              {/* Sun/Shade Info Badge */}
              {sector.sunExposure && (
                <FilterChip
                  label={sector.sunExposure}
                  icon={
                    sector.sunExposure.toLowerCase().includes('sun') ||
                    sector.sunExposure.toLowerCase().includes('sol')
                      ? 'sunny'
                      : sector.sunExposure.toLowerCase().includes('shade') ||
                          sector.sunExposure.toLowerCase().includes('sombra')
                        ? 'moon'
                        : 'contrast-outline'
                  }
                  isActive={false}
                  onPress={() => {
                    /* Info badge - no action */
                  }}
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

            {/* Empty state */}
            {filteredAndSortedRoutes.length === 0 && !isLoadingRoutes && (
              <View
                style={[
                  styles.emptyContainer,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  {allRoutes.length === 0
                    ? 'No routes found'
                    : 'No routes match filters'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </>
    ),
    [
      sector,
      params,
      router,
      colors,
      showInfo,
      parkingLocations,
      heroTags,
      latitude,
      longitude,
      routeStats,
      routesInGlobalRangeCount,
      globalGradeRange,
      showGradePicker,
      gradeFilter,
      sortBy,
      minStars,
      filteredAndSortedRoutes,
      allRoutes,
      isLoadingRoutes,
      isLoadingTopos,
      userMinGradeIndex,
      userMaxGradeIndex,
    ],
  )

  // List footer component (content after routes)
  const ListFooterComponent = useCallback(
    () => (
      <View style={styles.content}>
        {/* Description */}
        {sector.description && (
          <LanguageTextSection
            text={sector.description}
            title={t('description')}
          />
        )}

        {/* Approach */}
        {sector.approach && (
          <LanguageTextSection
            text={sector.approach}
            title={t('approach')}
            showMapButton={!!latitude && !!longitude}
            latitude={latitude}
            longitude={longitude}
            locationName={sector.name}
          />
        )}

        {/* Parking buttons */}
        {parkingLocations.length > 0 && (
          <View style={styles.parkingContainer}>
            {parkingLocations.map((parking, index) => (
              <Pressable
                key={`parking-${index}-${parking.lat}`}
                onPress={() => handleNavigateToParking(parking)}
                style={[styles.parkingButton, { backgroundColor: '#3B82F6' }]}
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
    ),
    [sector, latitude, longitude, parkingLocations],
  )

  // Early return for loading state - MUST be after all hooks
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
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      stickySectionHeadersEnabled={true}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.sectionListContent}
      showsVerticalScrollIndicator={true}
    />
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
    paddingBottom: 8,
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
  // Topo sections with grouped routes
  topoSection: {
    marginTop: 16,
  },
  topoImageContainer: {
    marginBottom: 12,
  },
  topoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  topoTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  topoRoutesList: {
    gap: 0,
  },
  // SectionList styles
  sectionListContent: {
    paddingBottom: 40,
  },
  stickyTopoHeader: {
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 8,
  },
  routeItemContainer: {
    paddingHorizontal: 20,
  },
  // Routes block - title + filters as unified block
  routesBlock: {
    marginTop: 12,
    marginBottom: 0,
  },
  routesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  routesTitleText: {
    fontSize: 16,
    fontWeight: '700',
  },
})
