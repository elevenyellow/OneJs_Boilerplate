import { Colors } from '@/constants/Colors'
import type { Zone } from '@/lib/api'
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

interface ZoneMapViewProps {
  zones: Zone[]
  initialRegion?: {
    latitude: number
    longitude: number
    latitudeDelta: number
    longitudeDelta: number
  }
  onZonePress?: (zone: Zone) => void
  style?: object
}

export function ZoneMapView({
  zones,
  initialRegion = {
    latitude: 40.4168,
    longitude: -3.7038,
    latitudeDelta: 5,
    longitudeDelta: 5,
  },
  onZonePress,
  style,
}: ZoneMapViewProps) {
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const handleZonePress = (zone: Zone) => {
    if (onZonePress) {
      onZonePress(zone)
    } else {
      // Navigate directly to zone detail page
      router.push(`/zone/${zone.id}`)
    }
  }

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
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
          Mapa no disponible en esta plataforma
        </Text>
        <Text
          style={[styles.fallbackSubtext, { color: colors.mutedForeground }]}
        >
          {zones.length} zones in list
        </Text>
      </View>
    )
  }

  return (
    <MapViewComponent
      style={[styles.map, style]}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton
    >
      {zones.map((zone) => (
        <MarkerComponent
          key={zone.id}
          coordinate={{
            latitude: zone.coordinates.latitude,
            longitude: zone.coordinates.longitude,
          }}
          tracksViewChanges={false}
        >
          <TouchableOpacity
            onPress={() => handleZonePress(zone)}
            style={styles.customMarker}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </MarkerComponent>
      ))}
    </MapViewComponent>
  )
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
})
