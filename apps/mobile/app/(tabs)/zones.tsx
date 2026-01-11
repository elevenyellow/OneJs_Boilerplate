import { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
} from 'react-native'
import { useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
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

  const [searchQuery, setSearchQuery] = useState('')
  const [sectorFilters, setSectorFilters] = useState<SearchSectorsDto | null>(
    null,
  )
  const [locationPickerVisible, setLocationPickerVisible] = useState(false)

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
  
  // Debug logging
  console.log('[Zones] State:', {
    locationLoading,
    latitude,
    longitude,
    hasSectorFilters: !!sectorFilters,
    isLoadingSectors,
    sectorsError: sectorsError?.message,
    resultsCount: sectorsData?.pages?.length ?? 0,
  })

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View
          style={[styles.searchInputContainer, { backgroundColor: colors.muted }]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search zones..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* Location selector button */}
        <Pressable
          style={[styles.locationButton, { backgroundColor: colors.primary }]}
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

      {/* Current location indicator */}
      <Pressable
        style={[styles.locationIndicator, { backgroundColor: colors.muted }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          setLocationPickerVisible(true)
        }}
      >
        <Ionicons 
          name={isCustomLocation ? 'location' : 'locate'} 
          size={16} 
          color={colors.primary} 
        />
        <Text 
          style={[styles.locationIndicatorText, { color: colors.text }]}
          numberOfLines={1}
        >
          {locationName}
        </Text>
        {isCustomLocation && (
          <Pressable
            style={styles.resetLocationBtn}
            onPress={async (e) => {
              e.stopPropagation()
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              await resetToGPS()
            }}
          >
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </Pressable>

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <View style={styles.infoRow}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {totalSectors} sectors • {cragResults.length} zones
          </Text>
          {sectorFilters?.gradeRange && (
            <View
              style={[
                styles.gradeBadge,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Text style={[styles.gradeText, { color: colors.primary }]}>
                {sectorFilters.gradeRange.min} - {sectorFilters.gradeRange.max}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Map content */}
      <View style={styles.mapContainer}>
        {locationLoading || isLoadingSectors ? (
          <View
            style={[styles.loadingContainer, { backgroundColor: colors.muted }]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {locationLoading ? 'Getting location...' : 'Searching sectors...'}
            </Text>
          </View>
        ) : cragResults.length === 0 ? (
          <View
            style={[styles.emptyMapContainer, { backgroundColor: colors.muted }]}
          >
            <Ionicons name="map-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyMapText, { color: colors.textSecondary }]}>
              {searchQuery ? `No zones found for "${searchQuery}"` : 'No sectors found'}
            </Text>
            <Text
              style={[styles.emptyMapSubtext, { color: colors.mutedForeground }]}
            >
              {searchQuery ? 'Try a different search' : 'Adjust filters in the search screen'}
            </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
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
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 24,
  },
  emptyMapText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyMapSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  locationIndicatorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  resetLocationBtn: {
    padding: 2,
  },
})
