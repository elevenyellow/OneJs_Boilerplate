import { HeroHeader } from '@/components/HeroHeader'
import { Colors } from '@/constants/Colors'
import { useGradeRange } from '@/contexts/FiltersContext'
import { useCragDetail } from '@/hooks/useCragDetail'
import type { SearchSectorResult } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
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

function getScoreColor(score: number): string {
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  if (score >= 25) return '#EF4444'
  return '#64748B'
}

// Sun preference type
type SunPreference = 'any' | 'sun' | 'shade'

export default function CragDetailScreen() {
  const {
    id,
    sectorsData,
    avgScore,
    distance: distanceParam,
    appliedSunPreference,
    appliedMinRoutes,
    appliedWithTopo,
  } = useLocalSearchParams<{
    id: string
    sectorsData?: string
    avgScore?: string
    distance?: string
    appliedSunPreference?: string
    appliedMinRoutes?: string
    appliedWithTopo?: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  // Get global grade range (shared with Explorer and Filter screens)
  const { gradeRange: globalGradeRange } = useGradeRange()

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
  } = useCragDetail(id || '', { gradeRange: globalGradeRange })

  // Filter state (grade range comes from global context, not local state)
  const [sunPreference, setSunPreference] = useState<SunPreference>('any')
  const [minRoutes, setMinRoutes] = useState(0)
  const [withTopo, setWithTopo] = useState(false)

  // Update filters when returning from filter screen
  useEffect(() => {
    if (appliedSunPreference) {
      setSunPreference(appliedSunPreference as SunPreference)
    }
    if (appliedMinRoutes) {
      setMinRoutes(parseInt(appliedMinRoutes, 10) || 0)
    }
    if (appliedWithTopo !== undefined) {
      setWithTopo(appliedWithTopo === 'true')
    }
  }, [
    appliedSunPreference,
    appliedMinRoutes,
    appliedWithTopo,
  ])

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
      routeCount?: number
      routesInGradeRange?: number
      minGrade?: string | null
      maxGrade?: string | null
      avgGrade?: string | null
      avgHeight?: number | null
      maxHeight?: number | null
      hasTopo?: boolean
      headerImageUrl?: string | null
      score?: number
    }): SearchSectorResult => ({
      sector: {
        id: s.id,
        name: s.name,
        orientation: s.orientation,
        rockType: s.rockType,
        sunExposure: s.sunExposure,
        routeCount: s.routeCount || 0,
        minGrade: s.minGrade || null,
        maxGrade: s.maxGrade || null,
        avgGrade: s.avgGrade || null,
        avgHeight: s.avgHeight || null,
        maxHeight: s.maxHeight || null,
        hasTopo: s.hasTopo || false,
        routes: [],
        coordinates: null,
        avgStars: null,
        climbingStyle: null,
        headerImageUrl: s.headerImageUrl || null,
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
    // but enrich them with data from crag.sectors
    if (scoredSectors.length > 0) {
      const cragSectorsMap = new Map(
        (crag?.sectors || []).map((s) => [s.id, s]),
      )

      // Enrich scored sectors with crag sector data
      const enrichedScoredSectors = scoredSectors.map((sr) => {
        const cragSector = cragSectorsMap.get(sr.sector.id)
        if (cragSector) {
          return {
            ...sr,
            sector: {
              ...sr.sector,
              routeCount: cragSector.routeCount || sr.sector.routeCount || 0,
              minGrade: cragSector.minGrade || sr.sector.minGrade,
              maxGrade: cragSector.maxGrade || sr.sector.maxGrade,
              avgGrade: cragSector.avgGrade || sr.sector.avgGrade,
              avgHeight: cragSector.avgHeight || sr.sector.avgHeight,
              maxHeight: cragSector.maxHeight || sr.sector.maxHeight,
              hasTopo: cragSector.hasTopo || sr.sector.hasTopo,
            },
            routesInUserRange:
              sr.routesInUserRange || cragSector.routesInGradeRange || 0,
          }
        }
        return sr
      })

      const scoredIds = new Set(scoredSectors.map((s) => s.sector.id))

      // Add any crag sectors that aren't in scoredSectors
      const additionalSectors = (crag?.sectors || [])
        .filter((s) => !scoredIds.has(s.id))
        .map(convertToSearchResult)

      return [...enrichedScoredSectors, ...additionalSectors].sort(
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

  // Helper to check if sector is in sun or shade based on orientation and time
  const isSectorInSun = (orientation: string | null): boolean => {
    if (!orientation) return true // Unknown = treat as sun
    const hour = new Date().getHours()
    // Simplified sun logic:
    // Morning (6-12): E, SE, S facing walls get sun
    // Afternoon (12-18): S, SW, W facing walls get sun
    // Evening (18-20): W, NW facing walls get sun
    const sunnyOrientations: Record<string, string[]> = {
      morning: ['E', 'SE', 'S', 'NE'],
      afternoon: ['S', 'SW', 'W', 'SE'],
      evening: ['W', 'NW', 'SW'],
    }
    let period = 'morning'
    if (hour >= 12 && hour < 18) period = 'afternoon'
    else if (hour >= 18) period = 'evening'

    return sunnyOrientations[period].includes(orientation)
  }

  /**
   * Calculate comprehensive score for each sector based on:
   * 1. Weather conditions (meteo) - 25% weight
   * 2. Routes in user's grade range - 35% weight  
   * 3. Applied filters match (orientation, topo) - 20% weight
   * 4. Route quality (avg stars) - 20% weight
   */
  const filteredAndSortedSectors = useMemo(() => {
    // Calculate comprehensive score for each sector
    const sectorsWithScore = allSectors.map((sectorResult) => {
      const sector = sectorResult.sector
      const routesInRange = sectorResult.routesInUserRange || 0
      const totalRoutes = sector.routeCount || sector.routes?.length || 1
      
      // 1. WEATHER SCORE (0-100) - 25% weight
      // Use conditions.weatherScore if available, otherwise estimate from isGoodDay
      let weatherScore = 50 // Default neutral
      if (sectorResult.conditions) {
        weatherScore = sectorResult.conditions.weatherScore || 
                       (sectorResult.conditions.isGoodDay ? 80 : 40)
      }
      
      // 2. ROUTES IN RANGE SCORE (0-100) - 35% weight
      // Normalize: more routes in range = higher score
      // Use logarithmic scale to avoid extreme values
      const routesScore = routesInRange > 0 
        ? Math.min(100, Math.log10(routesInRange + 1) * 50 + (routesInRange / totalRoutes) * 50)
        : 0
      
      // 3. FILTERS MATCH SCORE (0-100) - 20% weight
      let filtersScore = 50 // Base score
      
      // Orientation match bonus
      if (sunPreference !== 'any') {
        const inSun = isSectorInSun(sector.orientation)
        const matchesPreference = 
          (sunPreference === 'sun' && inSun) || 
          (sunPreference === 'shade' && !inSun)
        filtersScore += matchesPreference ? 30 : -20
      }
      
      // Topo availability bonus
      if (withTopo && (sector.hasTopo || sector.headerImageUrl)) {
        filtersScore += 20
      } else if (!withTopo && (sector.hasTopo || sector.headerImageUrl)) {
        filtersScore += 10 // Small bonus even if not required
      }
      
      // Clamp to 0-100
      filtersScore = Math.max(0, Math.min(100, filtersScore))
      
      // 4. QUALITY SCORE (0-100) - 20% weight
      // Based on average stars (0-5 scale)
      const avgStars = sector.avgStars || 0
      const qualityScore = avgStars > 0 ? (avgStars / 5) * 100 : 50 // Default to neutral if no ratings
      
      // COMBINED WEIGHTED SCORE
      const calculatedScore = 
        (weatherScore * 0.25) +
        (routesScore * 0.35) +
        (filtersScore * 0.20) +
        (qualityScore * 0.20)
      
      return {
        ...sectorResult,
        calculatedScore,
        scoreBreakdown: {
          weather: weatherScore,
          routes: routesScore,
          filters: filtersScore,
          quality: qualityScore,
        },
      }
    })

    // Apply hard filters (these exclude sectors entirely)
    const filtered = sectorsWithScore.filter((sectorResult) => {
      const sector = sectorResult.sector

      // Filter by sun preference (hard filter)
      if (sunPreference !== 'any') {
        const inSun = isSectorInSun(sector.orientation)
        if (sunPreference === 'sun' && !inSun) return false
        if (sunPreference === 'shade' && inSun) return false
      }

      // Filter by minimum routes in range (hard filter)
      if (minRoutes > 0 && sectorResult.routesInUserRange < minRoutes) {
        return false
      }

      // Filter by with topo (hard filter)
      if (withTopo) {
        if (!sector.hasTopo && !sector.headerImageUrl) {
          return false
        }
      }

      return true
    })

    // Sort by combined score - highest first
    return filtered.sort((a, b) => b.calculatedScore - a.calculatedScore)
  }, [
    allSectors,
    sunPreference,
    minRoutes,
    withTopo,
  ])

  // Alias for backwards compatibility with template
  const filteredSectors = filteredAndSortedSectors

  // Count active filters (grade range always counts since it's used for scoring)
  const activeFiltersCount = useMemo(() => {
    let count = 1 // Grade range is always active (used for scoring)
    if (sunPreference !== 'any') count++
    if (minRoutes > 0) count++
    if (withTopo) count++
    return count
  }, [sunPreference, minRoutes, withTopo])

  // Clear all filters (except grade range which is global)
  const clearFilters = () => {
    setSunPreference('any')
    setMinRoutes(0)
    setWithTopo(false)
  }

  const handleGetDirections = () => {
    if (crag?.latitude && crag?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${crag.latitude},${crag.longitude}`
      Linking.openURL(url)
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

    // Add header image if available (sector image, or fallback to crag image)
    if (sector.headerImageUrl) {
      params.set('headerImageUrl', sector.headerImageUrl)
    } else if (crag?.headerImageUrl) {
      // Fallback to crag header image if sector doesn't have one
      params.set('headerImageUrl', crag.headerImageUrl)
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
        subtitle={
          crag.region ? `${crag.region}, ${crag.country}` : crag.country
        }
        imageUrl={crag.headerImageUrl}
        theCragUrl={crag.theCragUrl}
        rockType={primaryRockType}
        icon="layers"
        onBack={() => router.back()}
        stats={[
          { label: 'sectors', value: crag.totalSectors, icon: 'grid' },
          { label: 'routes', value: crag.totalRoutes, icon: 'git-branch' },
          ...(crag.totalRoutesInRange > 0 &&
          crag.totalRoutesInRange !== crag.totalRoutes
            ? [
                {
                  label: 'in range',
                  value: crag.totalRoutesInRange,
                  icon: 'checkmark-circle' as const,
                },
              ]
            : []),
          ...(distanceParam
            ? [
                {
                  label: 'km',
                  value:
                    Number(distanceParam) < 1
                      ? `${Math.round(Number(distanceParam) * 1000)}m`
                      : Number(distanceParam).toFixed(1),
                  icon: 'location' as const,
                },
              ]
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
        {/* Weather Card - Full Width */}
        {todayForecast && (
          <Pressable
            onPress={() => router.push(`/crag/weather/${id}`)}
            style={[
              styles.weatherCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.weatherCardLeft}>
              <Ionicons
                name={getWeatherIcon(todayForecast.weatherCode)}
                size={48}
                color={colors.primary}
              />
              <View style={styles.weatherCardInfo}>
                <Text style={[styles.weatherCardTemp, { color: colors.text }]}>
                  {Math.round(todayForecast.temperature?.mean || 0)}°C
                </Text>
                <Text
                  style={[
                    styles.weatherCardRange,
                    { color: colors.textSecondary },
                  ]}
                >
                  {Math.round(todayForecast.temperature?.min || 0)}° /{' '}
                  {Math.round(todayForecast.temperature?.max || 0)}°
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
                  {Math.round(todayForecast.precipitation?.probability || 0)}%
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
                  {Math.round(todayForecast.wind?.mean || 0)} m/s
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}

        {/* Action Buttons Row - Full Width */}
        <View style={styles.actionButtonsRow}>
          {/* Directions Button */}
          {crag.latitude && crag.longitude && (
            <Pressable
              onPress={handleGetDirections}
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="navigate" size={22} color="#10B981" />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Directions
              </Text>
            </Pressable>
          )}

          {/* Info Button */}
          {(crag.description || crag.approach) && (
            <Pressable
              onPress={() => router.push(`/crag/info/${id}`)}
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

          {/* Filters Button */}
          <Pressable
            onPress={() => {
              const params = new URLSearchParams()
              // Grade range comes from global context, no need to pass it
              if (sunPreference !== 'any') {
                params.set('sunPreference', sunPreference)
              }
              if (minRoutes > 0) {
                params.set('minRoutes', minRoutes.toString())
              }
              if (withTopo) {
                params.set('withTopo', 'true')
              }
              router.push(`/crag/filters/${id}?${params.toString()}`)
            }}
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="options" size={22} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Filters
            </Text>
            {activeFiltersCount > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Active Filters Chips */}
        {activeFiltersCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersContent}
            style={styles.activeFiltersRow}
          >
            {/* Grade range chip - always shown since it affects scoring */}
            <View
              style={[
                styles.filterChip,
                { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              ]}
            >
              <Ionicons
                name="trending-up-outline"
                size={12}
                color={colors.primary}
              />
              <Text style={[styles.filterChipText, { color: colors.primary }]}>
                {globalGradeRange.min} - {globalGradeRange.max}
              </Text>
            </View>
            {sunPreference !== 'any' && (
              <View
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name={sunPreference === 'sun' ? 'sunny' : 'moon'}
                  size={12}
                  color={colors.primary}
                />
                <Text style={[styles.filterChipText, { color: colors.text }]}>
                  {sunPreference === 'sun' ? 'Sun' : 'Shade'}
                </Text>
              </View>
            )}
            {minRoutes > 0 && (
              <View
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="git-branch-outline"
                  size={12}
                  color={colors.primary}
                />
                <Text style={[styles.filterChipText, { color: colors.text }]}>
                  {minRoutes}+ routes
                </Text>
              </View>
            )}
            {withTopo && (
              <View
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Ionicons name="map-outline" size={12} color={colors.primary} />
                <Text style={[styles.filterChipText, { color: colors.text }]}>
                  With Topo
                </Text>
              </View>
            )}
            <Pressable
              onPress={clearFilters}
              style={[styles.clearFiltersChip, { borderColor: colors.border }]}
            >
              <Ionicons
                name="close-circle"
                size={12}
                color={colors.destructive}
              />
              <Text
                style={[styles.clearFiltersText, { color: colors.destructive }]}
              >
                Clear
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Sectors (sorted by combined score) */}
        {filteredSectors.length > 0 ? (
          <View style={styles.sectorsContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Sectors
                </Text>
                <Text style={[styles.sortIndicator, { color: colors.textSecondary }]}>
                  sorted by relevance
                </Text>
              </View>
              <Text
                style={[styles.sectorCount, { color: colors.textSecondary }]}
              >
                {filteredSectors.length}
                {filteredSectors.length !== allSectors.length ? ` of ${allSectors.length}` : ''}
              </Text>
            </View>
            <View style={styles.sectorsList}>
              {filteredSectors.map((sectorResult) => {
                const sector = sectorResult.sector
                const isGoodDay = sectorResult.conditions?.isGoodDay

                // Get sector stats
                const totalRoutes =
                  sector.routeCount || sector.routes?.length || 0
                const routesInRange = sectorResult.routesInUserRange
                const avgGrade = sector.avgGrade
                const avgHeight = sector.avgHeight
                const maxHeight = sector.maxHeight
                const hasTopo = sector.hasTopo || sector.headerImageUrl
                const orientation = sector.orientation
                const rockType = sector.rockType

                // Determine current sun status
                const inSun = isSectorInSun(orientation)

                return (
                  <Pressable
                    key={sector.id}
                    style={[
                      styles.sectorCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSectorPress(sectorResult)}
                  >
                    {/* Header row with name and score */}
                    <View style={styles.sectorHeader}>
                      <View style={styles.sectorTitleArea}>
                        <Text
                          style={[styles.sectorName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {sector.name}
                        </Text>
                        {isGoodDay && (
                          <View style={styles.idealBadge}>
                            <Ionicons
                              name="sparkles"
                              size={10}
                              color="#FFFFFF"
                            />
                            <Text style={styles.idealBadgeText}>Ideal</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.sectorHeaderRight}>
                        {/* Show combined score badge */}
                        {sectorResult.calculatedScore > 0 && (
                          <View
                            style={[
                              styles.scoreBadge,
                              {
                                backgroundColor: getScoreColor(sectorResult.calculatedScore),
                              },
                            ]}
                          >
                            <Text style={styles.scoreText}>
                              {Math.round(sectorResult.calculatedScore)}
                            </Text>
                          </View>
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </View>
                    </View>

                    {/* Stats row */}
                    <View style={styles.sectorStats}>
                      {/* Total routes */}
                      <View style={styles.statItem}>
                        <Ionicons
                          name="git-branch-outline"
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={[styles.statText, { color: colors.text }]}>
                          {totalRoutes}
                        </Text>
                        <Text
                          style={[
                            styles.statLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          routes
                        </Text>
                      </View>

                      {/* Routes in grade range */}
                      <View style={styles.statItem}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={14}
                          color="#10B981"
                        />
                        <Text style={[styles.statText, { color: '#10B981' }]}>
                          {routesInRange}
                        </Text>
                        <Text
                          style={[
                            styles.statLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          in range
                        </Text>
                      </View>

                      {/* Average grade */}
                      {avgGrade && (
                        <View style={styles.statItem}>
                          <Ionicons
                            name="speedometer-outline"
                            size={14}
                            color="#F59E0B"
                          />
                          <Text
                            style={[styles.statText, { color: colors.text }]}
                          >
                            {avgGrade}
                          </Text>
                          <Text
                            style={[
                              styles.statLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            avg
                          </Text>
                        </View>
                      )}

                      {/* Height info: avg / max */}
                      {(avgHeight || maxHeight) && (
                        <View style={styles.statItem}>
                          <Ionicons
                            name="resize-outline"
                            size={14}
                            color="#8B5CF6"
                          />
                          {avgHeight && (
                            <>
                              <Text
                                style={[
                                  styles.statText,
                                  { color: colors.text },
                                ]}
                              >
                                {Math.round(avgHeight)}m
                              </Text>
                              <Text
                                style={[
                                  styles.statLabel,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                avg
                              </Text>
                            </>
                          )}
                          {avgHeight && maxHeight && (
                            <Text
                              style={[
                                styles.statLabel,
                                { color: colors.textSecondary },
                              ]}
                            >
                              /
                            </Text>
                          )}
                          {maxHeight && (
                            <>
                              <Text
                                style={[
                                  styles.statText,
                                  { color: colors.text },
                                ]}
                              >
                                {Math.round(maxHeight)}m
                              </Text>
                              <Text
                                style={[
                                  styles.statLabel,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                max
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Secondary stats row */}
                    <View style={styles.sectorSecondaryStats}>
                      {/* Orientation with sun/shade indicator */}
                      {orientation && (
                        <View
                          style={[
                            styles.secondaryStatChip,
                            { backgroundColor: colors.muted },
                          ]}
                        >
                          <Ionicons
                            name={inSun ? 'sunny-outline' : 'moon-outline'}
                            size={12}
                            color={inSun ? '#F59E0B' : '#6366F1'}
                          />
                          <Text
                            style={[
                              styles.secondaryStatText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {orientation}
                          </Text>
                        </View>
                      )}

                      {/* Rock type */}
                      {rockType && (
                        <View
                          style={[
                            styles.secondaryStatChip,
                            { backgroundColor: colors.muted },
                          ]}
                        >
                          <Text
                            style={[
                              styles.secondaryStatText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {rockType}
                          </Text>
                        </View>
                      )}

                      {/* Topo indicator */}
                      {hasTopo && (
                        <View
                          style={[styles.secondaryStatChip, styles.topoChip]}
                        >
                          <Ionicons
                            name="map-outline"
                            size={12}
                            color="#10B981"
                          />
                          <Text
                            style={[
                              styles.secondaryStatText,
                              { color: '#10B981' },
                            ]}
                          >
                            Topo
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No sectors match filters
            </Text>
            <Text
              style={[
                styles.emptyStateMessage,
                { color: colors.textSecondary },
              ]}
            >
              Try adjusting your filters to see more results
            </Text>
            <Pressable
              onPress={clearFilters}
              style={[
                styles.emptyStateButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
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
  // Weather Card
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
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
  // Action Buttons Row
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
  // Filter Badge
  filterBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Active Filters Row
  activeFiltersRow: {
    marginBottom: 12,
  },
  activeFiltersContent: {
    gap: 8,
    paddingRight: 8,
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
  clearFiltersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  content: {
    padding: 16,
  },
  // Sectors container
  sectorsContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'column',
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sortIndicator: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  sectorCount: {
    fontSize: 14,
  },
  sectorsList: {
    gap: 10,
  },
  // Sector Card
  sectorCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectorTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  idealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idealBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectorHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    justifyContent: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // Stats row
  sectorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
  },
  // Secondary stats row
  sectorSecondaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  secondaryStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  secondaryStatText: {
    fontSize: 11,
    fontWeight: '500',
  },
  topoChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
})
