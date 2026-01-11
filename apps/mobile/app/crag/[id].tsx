import { HeroHeader } from '@/components/HeroHeader'
import { Colors } from '@/constants/Colors'
import { useGradeRange } from '@/contexts/FiltersContext'
import { useCragDetail } from '@/hooks/useCragDetail'
import type { SearchSectorResult } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState, useEffect } from 'react'
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
    appliedGradeMin,
    appliedGradeMax,
    appliedSunPreference,
    appliedMinRoutes,
    appliedWithTopo,
  } = useLocalSearchParams<{
    id: string
    sectorsData?: string
    avgScore?: string
    distance?: string
    appliedGradeMin?: string
    appliedGradeMax?: string
    appliedSunPreference?: string
    appliedMinRoutes?: string
    appliedWithTopo?: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  // Get global grade range
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

  // Filter state
  const [gradeMin, setGradeMin] = useState('5a')
  const [gradeMax, setGradeMax] = useState('7a')
  const [sunPreference, setSunPreference] = useState<SunPreference>('any')
  const [minRoutes, setMinRoutes] = useState(0)
  const [withTopo, setWithTopo] = useState(false)

  // Check if grade range is modified from default
  const isGradeRangeModified = gradeMin !== '5a' || gradeMax !== '7a'

  // Update filters when returning from filter screen
  useEffect(() => {
    if (appliedGradeMin) {
      setGradeMin(appliedGradeMin)
    }
    if (appliedGradeMax) {
      setGradeMax(appliedGradeMax)
    }
    if (appliedSunPreference) {
      setSunPreference(appliedSunPreference as SunPreference)
    }
    if (appliedMinRoutes) {
      setMinRoutes(parseInt(appliedMinRoutes, 10) || 0)
    }
    if (appliedWithTopo !== undefined) {
      setWithTopo(appliedWithTopo === 'true')
    }
  }, [appliedGradeMin, appliedGradeMax, appliedSunPreference, appliedMinRoutes, appliedWithTopo])

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
      headerImageUrl?: string | null
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

  // Filter sectors based on user selections
  const filteredSectors = useMemo(() => {
    return allSectors.filter((sectorResult) => {
      const sector = sectorResult.sector
      
      // Filter by sun preference
      if (sunPreference !== 'any') {
        const inSun = isSectorInSun(sector.orientation)
        if (sunPreference === 'sun' && !inSun) return false
        if (sunPreference === 'shade' && inSun) return false
      }
      
      // Filter by minimum routes
      if (minRoutes > 0 && sectorResult.routesInUserRange < minRoutes) {
        return false
      }

      // Filter by with topo (check if sector has topo images)
      // For now, we assume sectors have a hasTopo property or we check headerImageUrl
      if (withTopo) {
        // Check if sector has topo - using headerImageUrl as proxy for now
        // In the future, this should check actual topo data
        if (!sector.headerImageUrl) {
          return false
        }
      }
      
      return true
    })
  }, [allSectors, sunPreference, minRoutes, withTopo])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (isGradeRangeModified) count++
    if (sunPreference !== 'any') count++
    if (minRoutes > 0) count++
    if (withTopo) count++
    return count
  }, [isGradeRangeModified, sunPreference, minRoutes, withTopo])

  // Clear all filters
  const clearFilters = () => {
    setGradeMin('5a')
    setGradeMax('7a')
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
          ...(crag.totalRoutesInRange > 0 && crag.totalRoutesInRange !== crag.totalRoutes
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
                <Text style={[styles.weatherCardRange, { color: colors.textSecondary }]}>
                  {Math.round(todayForecast.temperature?.min || 0)}° / {Math.round(todayForecast.temperature?.max || 0)}°
                </Text>
              </View>
            </View>
            <View style={styles.weatherCardRight}>
              <View style={styles.weatherCardDetail}>
                <Ionicons name="water" size={16} color="#3B82F6" />
                <Text style={[styles.weatherCardDetailText, { color: colors.textSecondary }]}>
                  {Math.round(todayForecast.precipitation?.probability || 0)}%
                </Text>
              </View>
              <View style={styles.weatherCardDetail}>
                <Ionicons name="leaf" size={16} color="#10B981" />
                <Text style={[styles.weatherCardDetailText, { color: colors.textSecondary }]}>
                  {Math.round(todayForecast.wind?.mean || 0)} m/s
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
              params.set('gradeMin', gradeMin)
              params.set('gradeMax', gradeMax)
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
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
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
            {isGradeRangeModified && (
              <View style={[styles.filterChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name="trending-up-outline" size={12} color={colors.primary} />
                <Text style={[styles.filterChipText, { color: colors.text }]}>
                  {gradeMin} - {gradeMax}
                </Text>
              </View>
            )}
            {sunPreference !== 'any' && (
              <View style={[styles.filterChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name={sunPreference === 'sun' ? 'sunny' : 'moon'} size={12} color={colors.primary} />
                <Text style={[styles.filterChipText, { color: colors.text }]}>
                  {sunPreference === 'sun' ? 'Sun' : 'Shade'}
                </Text>
              </View>
            )}
            {minRoutes > 0 && (
              <View style={[styles.filterChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name="git-branch-outline" size={12} color={colors.primary} />
                <Text style={[styles.filterChipText, { color: colors.text }]}>
                  {minRoutes}+ routes
                </Text>
              </View>
            )}
            {withTopo && (
              <View style={[styles.filterChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
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
              <Ionicons name="close-circle" size={12} color={colors.destructive} />
              <Text style={[styles.clearFiltersText, { color: colors.destructive }]}>
                Clear
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Sectors (filtered) */}
        {filteredSectors.length > 0 ? (
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
                {filteredSectors.length}{activeFiltersCount > 0 ? ` of ${allSectors.length}` : ''}
              </Text>
            </View>
            <View style={styles.sectorsList}>
              {filteredSectors.map((sectorResult) => {
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
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No sectors match filters
            </Text>
            <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
              Try adjusting your filters to see more results
            </Text>
            <Pressable
              onPress={clearFilters}
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
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
})
