import { StyleSheet, View, Text, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import type { Zone } from '@/lib/api';

// Conditional import for react-native-maps (not available on web)
let MapViewComponent: any = null;
let MarkerComponent: any = null;
let CalloutComponent: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapViewComponent = Maps.default;
    MarkerComponent = Maps.Marker;
    CalloutComponent = Maps.Callout;
  } catch (e) {
    // Maps not available
  }
}

interface ZoneMapViewProps {
  zones: Zone[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onZonePress?: (zone: Zone) => void;
  style?: object;
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
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Fallback for web or when maps not available
  if (!MapViewComponent || Platform.OS === 'web') {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: colors.muted }, style]}>
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
          Mapa no disponible en esta plataforma
        </Text>
        <Text style={[styles.fallbackSubtext, { color: colors.mutedForeground }]}>
          {zones.length} zonas en la lista
        </Text>
      </View>
    );
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
          onPress={() => onZonePress?.(zone)}
        >
          <CalloutComponent>
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{zone.name}</Text>
              <Text style={styles.calloutSubtitle}>
                {zone.region}, {zone.country}
              </Text>
              <Text style={styles.calloutInfo}>{zone.totalRoutes} vías</Text>
            </View>
          </CalloutComponent>
        </MarkerComponent>
      ))}
    </MapViewComponent>
  );
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
  callout: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutInfo: {
    fontSize: 12,
    color: '#8B5A2B',
    fontWeight: '600',
  },
});




