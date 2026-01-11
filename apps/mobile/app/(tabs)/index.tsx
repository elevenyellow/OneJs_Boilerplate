import { CragGroup } from '@/components/CragGroup'
import { EmptyState } from '@/components/EmptyState'
import { FilterPanel, type FilterPanelRef } from '@/components/FilterPanel'
import { SectorCardSkeleton } from '@/components/Skeleton'
import { Colors } from '@/constants/Colors'
import { useFilters } from '@/contexts/FiltersContext'
import { useUserLocation, type CustomLocation } from '@/hooks/useUserLocation'
import { useSectorSearch } from '@/hooks/useSectorSearch'
import type { CragWithSectors, SearchSectorsDto } from '@/lib/api'
import { getMergedFilters, saveFilters } from '@/utils/filterStorage'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ExploreScreen() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()
  const filterPanelRef = useRef<FilterPanelRef>(null)

  // Use the new hook that supports custom locations
  const {
    latitude,
    longitude,
    locationName,
    isCustomLocation,
    loading: locationLoading,
    error: locationError,
    setLocation,
    resetToGPS,
    gpsLocation,
  } = useUserLocation()

  // Get global filters from context - these sync with other screens
  const { filters: globalFilters, setFilters: setGlobalFilters } = useFilters()

  const [filters, setFilters] = useState<SearchSectorsDto | null>(null)

  // Initialize filters when location is available
  useEffect(() => {
    if (latitude && longitude && !filters) {
      getMergedFilters({ lat: latitude, lon: longitude }).then(
        (defaultFilters) => {
          // Remove rockTypes as it's not populated in DB yet
          const cleanedFilters = { ...defaultFilters }
          delete cleanedFilters.rockTypes
          delete cleanedFilters.climbingStyles
          setFilters(cleanedFilters)
        },
      )
    }
  }, [latitude, longitude, filters])

  // Update filters when location changes (e.g., user selects a different zone)
  useEffect(() => {
    if (latitude && longitude && filters) {
      const currentLat = filters.userLocation?.lat
      const currentLon = filters.userLocation?.lon
      
      // Only update if location actually changed
      if (currentLat !== latitude || currentLon !== longitude) {
        setFilters(prev => prev ? {
          ...prev,
          userLocation: { lat: latitude, lon: longitude },
        } : null)
      }
    }
  }, [latitude, longitude, filters])

  // Sync local filters with global grade range changes
  useEffect(() => {
    if (filters && globalFilters.gradeRange) {
      const currentGrade = filters.gradeRange
      const globalGrade = globalFilters.gradeRange
      
      // Only update if the grade range actually changed
      if (currentGrade?.min !== globalGrade.min || currentGrade?.max !== globalGrade.max) {
        setFilters(prev => prev ? { ...prev, gradeRange: globalGrade } : null)
      }
    }
  }, [globalFilters.gradeRange, filters])

  const {
    data,
    isLoading,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSectorSearch(filters, !!filters)

  const handleFiltersChange = (newFilters: Partial<SearchSectorsDto>) => {
    if (filters) {
      setFilters({ ...filters, ...newFilters })
    }
  }

  const handleApplyFilters = () => {
    if (filters) {
      // Haptic feedback for apply
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      saveFilters(filters)
      
      // Update global context so other screens use the same grade range
      if (filters.gradeRange) {
        setGlobalFilters({ gradeRange: filters.gradeRange })
      }
      
      refetch()
    }
  }

  const handleLocationChange = async (location: CustomLocation) => {
    await setLocation(location)
    // Filters will be automatically updated via the useEffect above
    // and refetch will happen on next render
    refetch()
  }

  const handleResetToGPS = async () => {
    await resetToGPS()
    refetch()
  }

  // Get grouped results (crags with sectors) from all pages
  const cragResults: CragWithSectors[] =
    data?.pages.flatMap((page) => page.results) || []

  // Get metadata from first page
  const firstPage = data?.pages[0]
  const totalCrags = firstPage?.total ?? 0
  const totalSectorsCount = firstPage?.totalSectors ?? 0
  const totalRoutes = firstPage?.totalRoutes ?? 0
  const totalRoutesInRange = firstPage?.totalRoutesInRange ?? 0

  // Count total sectors for display
  const totalSectors = cragResults.reduce(
    (sum, crag) => sum + crag.sectors.length,
    0,
  )

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Build active filters list for display
  const getActiveFiltersList = () => {
    if (!filters) return []

    const activeFilters: {
      key: string
      label: string
      value: string
      icon: keyof typeof Ionicons.glyphMap
    }[] = []

    if (filters.gradeRange) {
      activeFilters.push({
        key: 'grade',
        label: 'Grade',
        value: `${filters.gradeRange.min} - ${filters.gradeRange.max}`,
        icon: 'speedometer-outline',
      })
    }

    if (filters.maxDistance) {
      activeFilters.push({
        key: 'distance',
        label: 'Distance',
        value: `${filters.maxDistance} km`,
        icon: 'navigate-outline',
      })
    }

    if (filters.forceOrientation && filters.forceOrientation !== 'any') {
      activeFilters.push({
        key: 'orientation',
        label: 'Orientation',
        value: filters.forceOrientation === 'sun' ? 'Sun' : 'Shade',
        icon:
          filters.forceOrientation === 'sun' ? 'sunny-outline' : 'moon-outline',
      })
    }

    if (filters.minRoutes && filters.minRoutes > 1) {
      activeFilters.push({
        key: 'routes',
        label: 'Min. routes',
        value: `${filters.minRoutes}+`,
        icon: 'git-branch-outline',
      })
    }

    if (filters.hasTopo) {
      activeFilters.push({
        key: 'topo',
        label: 'Topo',
        value: 'Yes',
        icon: 'map-outline',
      })
    }

    return activeFilters
  }

  const activeFiltersList = getActiveFiltersList()

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Hero Header with Gradient */}
      <LinearGradient
        colors={colors.gradientPrimary}
        style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroTitleSection}>
            <Text style={styles.heroWelcome}>
              {getGreeting()} 👋
            </Text>
            <Text style={styles.heroTitle}>
              Find your next climb
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroLocation} numberOfLines={1}>
                {locationLoading
                  ? 'Detecting location...'
                  : locationError
                    ? 'Location unavailable'
                    : isCustomLocation
                      ? locationName
                      : 'Near your location'}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{totalSectorsCount || totalSectors}</Text>
              <Text style={styles.heroStatLabel}>Sectors</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{totalRoutesInRange}</Text>
              <Text style={styles.heroStatLabel}>Routes</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{totalCrags}</Text>
              <Text style={styles.heroStatLabel}>Zones</Text>
            </View>
          </View>
        </View>

        {/* Decorative elements */}
        <View style={styles.heroDecoration}>
          <Ionicons name="diamond" size={120} color="rgba(255,255,255,0.08)" />
        </View>
      </LinearGradient>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            filterPanelRef.current?.open()
          }}
        >
          <Ionicons name="options" size={18} color="#FFFFFF" />
          <Text style={styles.filterButtonText}>Filters</Text>
          {activeFiltersList.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {activeFiltersList.length}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Active Filters Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersContent}
          style={styles.activeFiltersScroll}
        >
          {activeFiltersList.map((filter) => (
            <View
              key={filter.key}
              style={[
                styles.activeFilterChip,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={filter.icon}
                size={12}
                color={colors.primary}
              />
              <Text
                style={[styles.activeFilterValue, { color: colors.text }]}
              >
                {filter.value}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Weather Info Card */}
      {firstPage?.metadata?.weather && (
        <View
          style={[
            styles.weatherCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.weatherLeft}>
            <View style={[styles.weatherIconContainer, { backgroundColor: getWeatherColor(firstPage.metadata.weather.temperature) + '20' }]}>
              <Ionicons
                name={firstPage.metadata.weather.isGoodForClimbing ? 'sunny' : 'cloud'}
                size={24}
                color={getWeatherColor(firstPage.metadata.weather.temperature)}
              />
            </View>
            <View>
              <Text style={[styles.weatherTemp, { color: colors.text }]}>
                {firstPage.metadata.weather.temperature}°C
              </Text>
              <Text style={[styles.weatherCondition, { color: colors.textSecondary }]}>
                {firstPage.metadata.weather.conditions}
              </Text>
            </View>
          </View>
          
          {firstPage.metadata.weather.isGoodForClimbing && (
            <View style={[styles.goodDayBadge, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.goodDayText, { color: colors.success }]}>
                Great day!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Results Summary */}
      {firstPage && (
        <View style={styles.resultsInfo}>
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            Showing {cragResults.length} zones with {totalSectors} matching sectors
          </Text>
          {firstPage.metadata?.searchTime && (
            <Text
              style={[styles.searchTimeText, { color: colors.mutedForeground }]}
            >
              {firstPage.metadata.searchTime}ms
            </Text>
          )}
        </View>
      )}
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {locationLoading || !filters ? (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>
              Finding climbing spots...
            </Text>
          </LinearGradient>
        </View>
      ) : locationError ? (
        <EmptyState
          icon="location-outline"
          title="Location unavailable"
          message="We need your location to find nearby sectors. Please enable location permissions."
        />
      ) : cragResults.length === 0 && !isLoading ? (
        <View style={styles.container}>
          {renderHeader()}
          <EmptyState
            icon="search"
            title="No sectors found"
            message="Try adjusting the filters to see more results."
            action={
              <Pressable
                style={[
                  styles.emptyActionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  filterPanelRef.current?.open()
                }}
              >
                <Text
                  style={[
                    styles.emptyActionText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Adjust filters
                </Text>
              </Pressable>
            }
          />
        </View>
      ) : isLoading && cragResults.length === 0 ? (
        <ScrollView style={styles.container}>
          {renderHeader()}
          <View style={styles.listContent}>
            <SectorCardSkeleton />
            <SectorCardSkeleton />
            <SectorCardSkeleton />
          </View>
        </ScrollView>
      ) : (
        <FlashList
          data={cragResults}
          renderItem={({ item }) => <CragGroup cragWithSectors={item} />}
          estimatedItemSize={200}
          
          // 🚀 OPTIMIZACIONES DE RENDIMIENTO
          drawDistance={400} // Reducir distancia de renderizado para mejor rendimiento
          estimatedListSize={{ height: 800, width: 400 }} // Tamaño estimado de la lista
          overrideItemLayout={(layout, item) => {
            // Proporcionar tamaño más preciso para mejor reciclaje
            const sectorsHeight = item.sectors.length * 120
            layout.size = sectorsHeight + 120 // header + padding
          }}
          
          // Mejorar reciclaje de componentes
          getItemType={() => 'crag'} // Mismo tipo = mejor reciclaje de celdas
          
          ListHeaderComponent={renderHeader}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : hasNextPage ? (
              <View style={styles.loadMoreContainer}>
                <Pressable
                  style={[styles.loadMoreButton, { backgroundColor: colors.muted }]}
                  onPress={handleLoadMore}
                >
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                    Load more zones
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </Pressable>
              </View>
            ) : cragResults.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <View style={[styles.endBadge, { backgroundColor: colors.muted }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
                    All zones loaded
                  </Text>
                </View>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={refetch}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Filter Panel */}
      {filters && (
        <FilterPanel
          ref={filterPanelRef}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApply={handleApplyFilters}
          locationName={locationName}
          isCustomLocation={isCustomLocation}
          onLocationChange={handleLocationChange}
          onResetToGPS={handleResetToGPS}
          gpsLocation={gpsLocation}
        />
      )}
    </View>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getWeatherColor(temp: number): string {
  if (temp > 30) return '#EF4444'
  if (temp > 25) return '#F59E0B'
  if (temp > 15) return '#22C55E'
  if (temp > 5) return '#3B82F6'
  return '#6366F1'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerContainer: {
    marginBottom: 8,
  },
  heroHeader: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    zIndex: 1,
  },
  heroDecoration: {
    position: 'absolute',
    right: -20,
    top: 20,
    opacity: 0.5,
  },
  heroTitleSection: {
    marginBottom: 16,
  },
  heroWelcome: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
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
  activeFiltersScroll: {
    flex: 1,
  },
  activeFiltersContent: {
    gap: 8,
    paddingRight: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  activeFilterValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: '700',
  },
  weatherCondition: {
    fontSize: 13,
    fontWeight: '500',
  },
  goodDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  goodDayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchTimeText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 100,
  },
  emptyActionButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 6,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  endBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
})
