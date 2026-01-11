import { Colors } from '@/constants/Colors'
import type { CragWithSectors, SearchSectorResult } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'

// Conditional import for react-native-maps (not available on web)
// biome-ignore lint/suspicious/noExplicitAny: Dynamic import for platform-specific module
let MapViewComponent: React.ComponentType<any> | null = null
// biome-ignore lint/suspicious/noExplicitAny: Dynamic import for platform-specific module
let MarkerComponent: React.ComponentType<any> | null = null
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps')
    MapViewComponent = Maps.default
    MarkerComponent = Maps.Marker
  } catch {
    // Maps not available
  }
}

interface ZoneSectorsMapViewProps {
  crags: CragWithSectors[]
  userLocation?: {
    latitude: number
    longitude: number
  }
  initialRegion?: {
    latitude: number
    longitude: number
    latitudeDelta: number
    longitudeDelta: number
  }
  onSectorPress?: (sector: SearchSectorResult) => void
  style?: object
  showLegend?: boolean
}

// Color for suitability based on relevance score
const getSuitabilityColor = (score: number): { color: string; label: string } => {
  if (score >= 75) return { color: '#22C55E', label: 'Excellent' } // green
  if (score >= 50) return { color: '#84CC16', label: 'Good' } // lime
  if (score >= 25) return { color: '#F59E0B', label: 'Fair' } // amber
  return { color: '#EF4444', label: 'Poor' } // red
}

export function ZoneSectorsMapView({
  crags,
  userLocation,
  initialRegion,
  onSectorPress,
  style,
  showLegend = true,
}: ZoneSectorsMapViewProps) {
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  // Calculate region based on crags or user location
  const getInitialRegion = () => {
    if (initialRegion) return initialRegion

    // If we have crags, center on them
    if (crags.length > 0) {
      const allCoords: { lat: number; lon: number }[] = []

      for (const cragWithSectors of crags) {
        const { crag, sectors } = cragWithSectors

        if (crag.latitude && crag.longitude) {
          allCoords.push({ lat: crag.latitude, lon: crag.longitude })
        }

        for (const sectorResult of sectors) {
          const sector = sectorResult.sector
          if (sector.latitude && sector.longitude) {
            allCoords.push({ lat: sector.latitude, lon: sector.longitude })
          }
        }
      }

      if (allCoords.length > 0) {
        const latitudes = allCoords.map((c) => c.lat)
        const longitudes = allCoords.map((c) => c.lon)

        const minLat = Math.min(...latitudes)
        const maxLat = Math.max(...latitudes)
        const minLon = Math.min(...longitudes)
        const maxLon = Math.max(...longitudes)

        const centerLat = (minLat + maxLat) / 2
        const centerLon = (minLon + maxLon) / 2

        const latDelta = Math.max((maxLat - minLat) * 1.5, 0.5)
        const lonDelta = Math.max((maxLon - minLon) * 1.5, 0.5)

        return {
          latitude: centerLat,
          longitude: centerLon,
          latitudeDelta: latDelta,
          longitudeDelta: lonDelta,
        }
      }
    }

    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 1,
        longitudeDelta: 1,
      }
    }

    // Default to Spain center
    return {
      latitude: 40.4168,
      longitude: -3.7038,
      latitudeDelta: 5,
      longitudeDelta: 5,
    }
  }

  // Get all sectors with their coordinates for map display
  const getSectorsWithCoordinates = () => {
    const sectorsWithCoords: Array<{
      sectorResult: SearchSectorResult
      cragName: string
      coordinates: { latitude: number; longitude: number }
    }> = []

    for (const cragWithSectors of crags) {
      const { crag, sectors } = cragWithSectors

      for (const sectorResult of sectors) {
        const sector = sectorResult.sector

        const lat = sector.latitude ?? crag.latitude
        const lon = sector.longitude ?? crag.longitude

        if (lat && lon) {
          sectorsWithCoords.push({
            sectorResult,
            cragName: crag.name,
            coordinates: { latitude: lat, longitude: lon },
          })
        }
      }
    }

    return sectorsWithCoords
  }

  const sectorsWithCoords = getSectorsWithCoordinates()
  const totalSectors = crags.reduce((sum, crag) => sum + crag.sectors.length, 0)

  // Count sectors by suitability for legend
  const suitabilityCounts = {
    excellent: sectorsWithCoords.filter((s) => s.sectorResult.relevanceScore >= 75).length,
    good: sectorsWithCoords.filter(
      (s) => s.sectorResult.relevanceScore >= 50 && s.sectorResult.relevanceScore < 75
    ).length,
    fair: sectorsWithCoords.filter(
      (s) => s.sectorResult.relevanceScore >= 25 && s.sectorResult.relevanceScore < 50
    ).length,
    poor: sectorsWithCoords.filter((s) => s.sectorResult.relevanceScore < 25).length,
  }

  // Fallback for web or when maps not available - show interactive list
  if (!MapViewComponent || Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.fallbackContainer,
          { backgroundColor: colors.muted },
          style,
        ]}
      >
        {/* Header with stats */}
        <View style={styles.webHeader}>
          <Ionicons name="map-outline" size={32} color={colors.primary} />
          <Text style={[styles.webHeaderText, { color: colors.text }]}>
            {totalSectors} sectors in {crags.length} zones
          </Text>
        </View>

        {/* Suitability legend */}
        {showLegend && (
          <View style={[styles.webLegend, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Excellent ({suitabilityCounts.excellent})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#84CC16' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Good ({suitabilityCounts.good})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Fair ({suitabilityCounts.fair})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Poor ({suitabilityCounts.poor})
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Scrollable sector list for web */}
        <ScrollView style={styles.webSectorList} showsVerticalScrollIndicator={false}>
          {sectorsWithCoords.slice(0, 20).map(({ sectorResult, cragName }) => {
            const { sector, relevanceScore, distance } = sectorResult
            const { color } = getSuitabilityColor(relevanceScore)

            return (
              <TouchableOpacity
                key={sector.id}
                style={[styles.webSectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  if (onSectorPress) {
                    onSectorPress(sectorResult)
                  } else {
                    handleMarkerPress(sectorResult, cragName)
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sectorColorBar, { backgroundColor: color }]} />
                <View style={styles.sectorCardContent}>
                  <View style={styles.sectorCardHeader}>
                    <Text style={[styles.sectorName, { color: colors.text }]} numberOfLines={1}>
                      {sector.name}
                    </Text>
                    <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.scoreText, { color }]}>{Math.round(relevanceScore)}%</Text>
                    </View>
                  </View>
                  <Text style={[styles.cragName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {cragName}
                  </Text>
                  <View style={styles.sectorMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="navigate-outline" size={12} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {distance.toFixed(1)} km
                      </Text>
                    </View>
                    {sectorResult.routesInUserRange > 0 && (
                      <View style={styles.metaItem}>
                        <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                        <Text style={[styles.metaText, { color: '#22C55E' }]}>
                          {sectorResult.routesInUserRange} in range
                        </Text>
                      </View>
                    )}
                    {sector.routeCount != null && (
                      <View style={styles.metaItem}>
                        <Ionicons name="git-branch-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {sector.routeCount} total
                        </Text>
                      </View>
                    )}
                    {sector.orientation && (
                      <View style={styles.metaItem}>
                        <Ionicons name="compass-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {sector.orientation}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )
          })}
          
          {sectorsWithCoords.length > 20 && (
            <Text style={[styles.moreText, { color: colors.textSecondary }]}>
              +{sectorsWithCoords.length - 20} more sectors...
            </Text>
          )}
        </ScrollView>
      </View>
    )
  }

  const handleMarkerPress = (sectorResult: SearchSectorResult, cragName?: string) => {
    if (onSectorPress) {
      onSectorPress(sectorResult)
    } else {
      const sector = sectorResult.sector
      const params = new URLSearchParams({
        name: sector.name || '',
        cragName: cragName || '',
        orientation: sector.orientation || '',
        sunExposure: sector.sunExposure || '',
        rockType: sector.rockType || '',
      })
      
      // Add header image if available
      if (sector.headerImageUrl) {
        params.set('headerImageUrl', sector.headerImageUrl)
      }
      
      // Add coordinates if available
      if (sector.coordinates?.lat) {
        params.set('latitude', sector.coordinates.lat.toString())
      }
      if (sector.coordinates?.lon) {
        params.set('longitude', sector.coordinates.lon.toString())
      }
      
      router.push(`/sector/${sector.id}?${params.toString()}`)
    }
  }

  return (
    <View style={[styles.container, style]}>
      <MapViewComponent
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation
        showsMyLocationButton
        mapType="standard"
      >
        {sectorsWithCoords.map(({ sectorResult, cragName, coordinates }) => {
          const { sector, relevanceScore } = sectorResult
          const { color } = getSuitabilityColor(relevanceScore)

          return (
            <MarkerComponent
              key={sector.id}
              coordinate={coordinates}
              onCalloutPress={() => handleMarkerPress(sectorResult, cragName)}
              tracksViewChanges={false}
            >
              <TouchableOpacity
                onPress={() => handleMarkerPress(sectorResult, cragName)}
                style={[styles.customMarker, { backgroundColor: color }]}
                activeOpacity={0.8}
              >
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </MarkerComponent>
          )
        })}
      </MapViewComponent>

      {/* Stats overlay */}
      <View
        style={[styles.statsOverlay, { backgroundColor: colors.card + 'E6' }]}
      >
        <Text style={[styles.statsText, { color: colors.text }]}>
          {sectorsWithCoords.length} sectors on map
        </Text>
      </View>

      {/* Legend overlay */}
      {showLegend && (
        <View
          style={[styles.legendOverlay, { backgroundColor: colors.card + 'F2' }]}
        >
          <Text style={[styles.legendTitle, { color: colors.text }]}>
            Suitability
          </Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Excellent ({suitabilityCounts.excellent})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#84CC16' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Good ({suitabilityCounts.good})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Fair ({suitabilityCounts.fair})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Poor ({suitabilityCounts.poor})
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  webHeaderText: {
    fontSize: 18,
    fontWeight: '700',
  },
  webLegend: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-around',
  },
  webSectorList: {
    flex: 1,
    gap: 8,
  },
  webSectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectorColorBar: {
    width: 4,
    height: '100%',
    minHeight: 72,
  },
  sectorCardContent: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  sectorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectorName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cragName: {
    fontSize: 13,
  },
  sectorMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  moreText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  statsOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  legendOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
})
