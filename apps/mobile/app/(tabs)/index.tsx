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
import * as Haptics from 'expo-haptics'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'

export default function ExploreScreen() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
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
      {/* Professional Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Explore
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {locationLoading
                ? 'Detecting location...'
                : locationError
                  ? 'Location unavailable'
                  : isCustomLocation
                    ? `${totalSectorsCount || totalSectors} sectors near ${locationName}`
                    : `${totalSectorsCount || totalSectors} sectors nearby`}
            </Text>
          </View>

          {/* Filter Button - Right aligned */}
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
        </View>

        {/* Active Filters Display - Below the header */}
        {activeFiltersList.length > 0 && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersContent}
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
                    size={14}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.activeFilterLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {filter.label}:
                  </Text>
                  <Text
                    style={[styles.activeFilterValue, { color: colors.text }]}
                  >
                    {filter.value}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Weather Info */}
      {firstPage?.metadata?.weather && (
        <View
          style={[
            styles.weatherInfoContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.weatherInfoRow}>
            {/* Temperature */}
            <View style={styles.weatherInfoItem}>
              <Ionicons
                name="thermometer"
                size={24}
                color={
                  firstPage.metadata.weather.temperature > 25
                    ? '#FF5722'
                    : firstPage.metadata.weather.temperature < 10
                      ? '#2196F3'
                      : '#4CAF50'
                }
              />
              <View>
                <Text
                  style={[
                    styles.weatherInfoLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Temperature
                </Text>
                <Text style={[styles.weatherInfoValue, { color: colors.text }]}>
                  {firstPage.metadata.weather.temperature}°C
                </Text>
              </View>
            </View>

            {/* Conditions */}
            <View style={styles.weatherInfoItem}>
              <Ionicons
                name={
                  firstPage.metadata.weather.isGoodForClimbing
                    ? 'checkmark-circle'
                    : 'warning'
                }
                size={24}
                color={
                  firstPage.metadata.weather.isGoodForClimbing
                    ? '#4CAF50'
                    : '#FF9800'
                }
              />
              <View>
                <Text
                  style={[
                    styles.weatherInfoLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Conditions
                </Text>
                <Text style={[styles.weatherInfoValue, { color: colors.text }]}>
                  {firstPage.metadata.weather.conditions}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Results Info */}
      {firstPage && (
        <View style={styles.resultsInfo}>
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            {totalRoutesInRange}/{totalRoutes} routes • {totalSectorsCount} sectors • {totalCrags} zones
          </Text>
          {firstPage.metadata?.searchTime && (
            <Text
              style={[styles.searchTimeText, { color: colors.textSecondary }]}
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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Preparing search...
          </Text>
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
                <Text
                  style={[styles.loadMoreText, { color: colors.textSecondary }]}
                >
                  Scroll for more
                </Text>
              </View>
            ) : cragResults.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <Text
                  style={[styles.loadMoreText, { color: colors.textSecondary }]}
                >
                  All zones loaded
                </Text>
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
  headerContainer: {
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
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
  activeFiltersContainer: {
    marginTop: 12,
  },
  activeFiltersContent: {
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  activeFilterLabel: {
    fontSize: 12,
  },
  activeFilterValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherInfoContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  weatherInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherInfoLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weatherInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 13,
  },
  searchTimeText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 13,
  },
})
