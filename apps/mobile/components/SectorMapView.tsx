import { Colors } from '@/constants/Colors'
import type { CragWithSectors, SearchSectorResult } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  Platform,
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

interface SectorMapViewProps {
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
}

export function SectorMapView({
  crags,
  userLocation,
  initialRegion,
  onSectorPress,
  style,
}: SectorMapViewProps) {
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  // Calculate region based on crags or user location
  const getInitialRegion = () => {
    if (initialRegion) return initialRegion

    // If we have crags, center on them
    if (crags.length > 0) {
      // Get all coordinates from crags and sectors
      const allCoords: { lat: number; lon: number }[] = []

      for (const cragWithSectors of crags) {
        const { crag, sectors } = cragWithSectors

        // Add crag coordinates if available
        if (crag.latitude && crag.longitude) {
          allCoords.push({ lat: crag.latitude, lon: crag.longitude })
        }

        // Add sector coordinates
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

        // Add padding to deltas
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

    // Default to user location if available
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

  // Get color based on relevance score
  const getMarkerColor = (score: number): string => {
    if (score >= 75) return '#22C55E' // green
    if (score >= 50) return '#F59E0B' // amber
    if (score >= 25) return '#EF4444' // red
    return '#9CA3AF' // gray
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

        // Use sector coordinates if available, otherwise fall back to crag coordinates
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

  // Count total sectors for display
  const totalSectors = crags.reduce((sum, crag) => sum + crag.sectors.length, 0)

  // Fallback for web or when maps not available
  if (!MapViewComponent || Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.fallbackContainer,
          { backgroundColor: colors.muted },
          style,
        ]}
      >
        <Ionicons name="map-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
          Mapa no disponible en esta plataforma
        </Text>
        <Text
          style={[styles.fallbackSubtext, { color: colors.mutedForeground }]}
        >
          {totalSectors} sectors in {crags.length} zones
        </Text>
      </View>
    )
  }

  const handleMarkerPress = (sectorResult: SearchSectorResult) => {
    if (onSectorPress) {
      onSectorPress(sectorResult)
    } else {
      router.push(`/sector/${sectorResult.sector.id}`)
    }
  }

  return (
    <View style={[styles.container, style]}>
      <MapViewComponent
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation
        showsMyLocationButton
      >
        {sectorsWithCoords.map(({ sectorResult, coordinates }) => {
          const { sector, relevanceScore } = sectorResult
          const markerColor = getMarkerColor(relevanceScore)

          return (
            <MarkerComponent
              key={sector.id}
              coordinate={coordinates}
              onCalloutPress={() => handleMarkerPress(sectorResult)}
              tracksViewChanges={false}
            >
              <TouchableOpacity
                onPress={() => handleMarkerPress(sectorResult)}
                style={[styles.customMarker, { backgroundColor: markerColor }]}
                activeOpacity={0.8}
              >
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </MarkerComponent>
          )
        })}
      </MapViewComponent>

      {/* Map stats overlay */}
      <View
        style={[styles.statsOverlay, { backgroundColor: colors.card + 'E6' }]}
      >
        <Text style={[styles.statsText, { color: colors.text }]}>
          {sectorsWithCoords.length} sectors on map
        </Text>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    gap: 12,
    padding: 24,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  fallbackSubtext: {
    fontSize: 14,
    textAlign: 'center',
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
