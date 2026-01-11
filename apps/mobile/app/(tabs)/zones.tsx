import { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ZoneSectorsMapView } from '@/components/ZoneSectorsMapView'
import { LocationPicker } from '@/components/LocationPicker'
import { useSectorSearch } from '@/hooks/useSectorSearch'
import { useUserLocation, type CustomLocation } from '@/hooks/useUserLocation'
import { Colors } from '@/constants/Colors'
import { getMergedFilters } from '@/utils/filterStorage'
import type { SearchSectorsDto } from '@/lib/api'

export default function ZonesScreen() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const [searchQuery, setSearchQuery] = useState('')
  const [sectorFilters, setSectorFilters] = useState<SearchSectorsDto | null>(null)
  const [locationPickerVisible, setLocationPickerVisible] = useState(false)
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard')

  // Get user location for sector search (supports custom locations)
  const { 
    latitude, 
    longitude, 
    locationName,
    isCustomLocation,
    loading: locationLoading,
    setLocation,
    resetToGPS,
    gpsLocation,
  } = useUserLocation()

  // Load sector filters when location is available
  useEffect(() => {
    if (latitude && longitude && !sectorFilters) {
      getMergedFilters({ lat: latitude, lon: longitude }).then(
        (mergedFilters) => {
          const cleanedFilters = {
            ...mergedFilters,
            maxDistance: mergedFilters.maxDistance || 500,
            limit: 100, // More sectors to show on map
          }
          delete cleanedFilters.rockTypes
          delete cleanedFilters.climbingStyles
          setSectorFilters(cleanedFilters)
        },
      )
    }
  }, [latitude, longitude, sectorFilters])

  // Update filters when location changes
  useEffect(() => {
    if (latitude && longitude && sectorFilters) {
      const currentLat = sectorFilters.userLocation?.lat
      const currentLon = sectorFilters.userLocation?.lon
      
      if (currentLat !== latitude || currentLon !== longitude) {
        setSectorFilters(prev => prev ? {
          ...prev,
          userLocation: { lat: latitude, lon: longitude },
        } : null)
      }
    }
  }, [latitude, longitude, sectorFilters])

  const handleLocationChange = async (location: CustomLocation) => {
    await setLocation(location)
  }

  // Search for sectors to show on the map
  const { data: sectorsData, isLoading: isLoadingSectors, error: sectorsError } = useSectorSearch(
    sectorFilters,
    !!sectorFilters,
  )

  // Get crag results for the map
  const allCragResults = sectorsData?.pages?.flatMap((page) => page.results) || []

  // Filter crags by search query (client-side filtering)
  const cragResults = searchQuery.trim()
    ? allCragResults.filter((cragWithSectors) => {
        const query = searchQuery.toLowerCase().trim()
        return (
          cragWithSectors.crag.name.toLowerCase().includes(query) ||
          cragWithSectors.sectors.some((s) =>
            s.sector.name.toLowerCase().includes(query),
          )
        )
      })
    : allCragResults

  const totalSectors = cragResults.reduce(
    (sum, crag) => sum + crag.sectors.length,
    0,
  )

  const clearSearch = () => {
    setSearchQuery('')
  }

  const toggleMapStyle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setMapStyle(prev => prev === 'standard' ? 'satellite' : 'standard')
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradientAccent}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Text style={styles.headerTitle}>Map</Text>
            <Text style={styles.headerSubtitle}>
              {totalSectors} sectors • {cragResults.length} zones
            </Text>
          </View>
          
          {/* Map style toggle */}
          <Pressable
            style={styles.mapStyleButton}
            onPress={toggleMapStyle}
          >
            <Ionicons 
              name={mapStyle === 'standard' ? 'earth' : 'map'} 
              size={20} 
              color="#FFFFFF" 
            />
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search zones..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={clearSearch}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="rgba(255,255,255,0.6)"
                />
              </Pressable>
            )}
          </View>

          {/* Location selector button */}
          <Pressable
            style={styles.locationButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setLocationPickerVisible(true)
            }}
          >
            <Ionicons 
              name={isCustomLocation ? 'location' : 'locate'} 
              size={20} 
              color="#FFFFFF" 
            />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Location indicator */}
      <Pressable
        style={[styles.locationIndicator, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          setLocationPickerVisible(true)
        }}
      >
        <View style={[styles.locationIconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons 
            name={isCustomLocation ? 'location' : 'locate'} 
            size={16} 
            color={colors.primary} 
          />
        </View>
        <Text 
          style={[styles.locationIndicatorText, { color: colors.text }]}
          numberOfLines={1}
        >
          {locationName}
        </Text>
        {isCustomLocation && (
          <Pressable
            style={[styles.resetLocationBtn, { backgroundColor: colors.destructive + '15' }]}
            onPress={async (e) => {
              e.stopPropagation()
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              await resetToGPS()
            }}
          >
            <Ionicons name="close" size={14} color={colors.destructive} />
          </Pressable>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </Pressable>

      {/* Grade badge */}
      {sectorFilters?.gradeRange && (
        <View style={styles.gradeBadgeContainer}>
          <View
            style={[
              styles.gradeBadge,
              { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' },
            ]}
          >
            <Ionicons name="trending-up" size={14} color={colors.primary} />
            <Text style={[styles.gradeText, { color: colors.primary }]}>
              {sectorFilters.gradeRange.min} - {sectorFilters.gradeRange.max}
            </Text>
          </View>
        </View>
      )}

      {/* Map content */}
      <View style={styles.mapContainer}>
        {locationLoading || isLoadingSectors ? (
          <View
            style={[styles.loadingContainer, { backgroundColor: colors.muted }]}
          >
            <View style={[styles.loadingIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {locationLoading ? 'Getting your location...' : 'Loading climbing spots...'}
            </Text>
            <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
              This may take a moment
            </Text>
          </View>
        ) : cragResults.length === 0 ? (
          <View
            style={[styles.emptyMapContainer, { backgroundColor: colors.muted }]}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="map-outline" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyMapText, { color: colors.text }]}>
              {searchQuery ? `No zones found for "${searchQuery}"` : 'No sectors found nearby'}
            </Text>
            <Text
              style={[styles.emptyMapSubtext, { color: colors.textSecondary }]}
            >
              {searchQuery ? 'Try a different search term' : 'Adjust filters in the Explore tab'}
            </Text>
            {searchQuery && (
              <Pressable
                style={[styles.clearSearchButton, { backgroundColor: colors.primary }]}
                onPress={clearSearch}
              >
                <Text style={styles.clearSearchButtonText}>Clear search</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <ZoneSectorsMapView
            crags={cragResults}
            userLocation={
              latitude && longitude ? { latitude, longitude } : undefined
            }
            showLegend={true}
            style={styles.map}
          />
        )}
      </View>

      {/* Map Legend */}
      {cragResults.length > 0 && (
        <View style={[styles.legend, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Best match</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Good match</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>You</Text>
          </View>
        </View>
      )}

      {/* Location Picker Modal */}
      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleLocationChange}
        currentLocation={isCustomLocation ? {
          lat: latitude ?? 0,
          lon: longitude ?? 0,
          name: locationName,
        } : null}
        gpsLocation={gpsLocation}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 4,
  },
  mapStyleButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    gap: 10,
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIndicatorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  resetLocationBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    margin: 0,
    marginTop: 8,
    borderRadius: 0,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
  },
  emptyMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    padding: 32,
  },
  emptyIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMapText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMapSubtext: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
  },
  clearSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
})
