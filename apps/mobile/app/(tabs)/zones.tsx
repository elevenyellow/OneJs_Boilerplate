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
import { ZoneSectorsMapView } from '@/components/ZoneSectorsMapView'
import { useSectorSearch } from '@/hooks/useSectorSearch'
import { useLocation } from '@/hooks/useLocation'
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

  // Get user location for sector search
  const { latitude, longitude, loading: locationLoading } = useLocation()

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

  // Search for sectors to show on the map
  const { data: sectorsData, isLoading: isLoadingSectors } = useSectorSearch(
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
      </View>

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
})
