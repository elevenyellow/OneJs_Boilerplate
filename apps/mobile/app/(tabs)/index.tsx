import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ZoneMapView } from '@/components/MapView';
import { useLocation } from '@/hooks/useLocation';
import { useNearbyZones, useZones } from '@/hooks/useZones';
import { Colors } from '@/constants/Colors';

export default function MapScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { latitude, longitude, loading: locationLoading, error: locationError } = useLocation();

  // Fetch nearby zones if location available, otherwise fetch all
  const { data: nearbyZones } = useNearbyZones(latitude ?? 0, longitude ?? 0, 100, !!latitude);
  const { data: allZones, isLoading: zonesLoading } = useZones({ limit: 50 });

  const displayZones = nearbyZones || allZones || [];
  const isLoading = locationLoading || zonesLoading;

  const initialRegion = latitude && longitude
    ? {
        latitude,
        longitude,
        latitudeDelta: 2,
        longitudeDelta: 2,
      }
    : {
        latitude: 40.4168,
        longitude: -3.7038,
        latitudeDelta: 5,
        longitudeDelta: 5,
      };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map */}
      <ZoneMapView
        zones={displayZones}
        initialRegion={initialRegion}
        onZonePress={(zone) => router.push(`/zone/${zone.id}`)}
        style={styles.map}
      />

      {/* Status overlay */}
      <View style={[styles.statusBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statusContent}>
          <Ionicons
            name={locationError ? 'location-outline' : 'location'}
            size={20}
            color={locationError ? colors.destructive : colors.primary}
          />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {isLoading
              ? 'Cargando...'
              : locationError
              ? 'Ubicación no disponible'
              : `${displayZones.length} zonas`}
          </Text>
        </View>
        
        {nearbyZones && nearbyZones.length > 0 && (
          <Pressable
            style={[styles.nearbyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/zones')}
          >
            <Text style={[styles.nearbyButtonText, { color: colors.primaryForeground }]}>
              Ver lista
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primaryForeground} />
          </Pressable>
        )}
      </View>

      {/* Nearby zones preview */}
      {nearbyZones && nearbyZones.length > 0 && (
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            Zonas cercanas
          </Text>
          {nearbyZones.slice(0, 3).map((zone) => (
            <Pressable
              key={zone.id}
              style={styles.previewItem}
              onPress={() => router.push(`/zone/${zone.id}`)}
            >
              <View style={styles.previewItemLeft}>
                <Text style={[styles.previewItemName, { color: colors.text }]} numberOfLines={1}>
                  {zone.name}
                </Text>
                <Text style={[styles.previewItemLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                  {zone.region}
                </Text>
              </View>
              <View style={styles.previewItemRight}>
                {zone.distance !== undefined && (
                  <Text style={[styles.previewItemDistance, { color: colors.primary }]}>
                    {zone.distance < 1
                      ? `${Math.round(zone.distance * 1000)} m`
                      : `${zone.distance.toFixed(1)} km`}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statusBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nearbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  nearbyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  previewItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  previewItemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewItemLocation: {
    fontSize: 13,
    marginTop: 2,
  },
  previewItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewItemDistance: {
    fontSize: 13,
    fontWeight: '600',
  },
});




