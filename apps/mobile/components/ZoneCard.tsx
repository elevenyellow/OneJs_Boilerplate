import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ClimbingTypeColors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import type { Zone } from '@/lib/api';

interface ZoneCardProps {
  zone: Zone;
}

const climbingTypeLabels: Record<string, string> = {
  sport: 'Deportiva',
  trad: 'Clásica',
  boulder: 'Boulder',
  'multi-pitch': 'Largo',
  mixed: 'Mixta',
};

export function ZoneCard({ zone }: ZoneCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatDistance = (km?: number) => {
    if (km === undefined) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <Pressable
      onPress={() => router.push(`/zone/${zone.id}`)}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {zone.imageUrl ? (
          <Image source={{ uri: zone.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Ionicons name="location" size={40} color={colors.mutedForeground} />
          </View>
        )}
        
        {/* Distance badge */}
        {zone.distance !== undefined && (
          <View style={[styles.distanceBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.distanceText, { color: colors.text }]}>
              {formatDistance(zone.distance)}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {zone.name}
        </Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
            {zone.region}, {zone.country}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="git-branch-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {zone.totalRoutes} routes
            </Text>
          </View>
        </View>

        {/* Climbing types */}
        <View style={styles.typesRow}>
          {zone.climbingTypes.slice(0, 3).map((type) => {
            const typeColor = ClimbingTypeColors[type as keyof typeof ClimbingTypeColors];
            return (
              <View
                key={type}
                style={[
                  styles.typeBadge,
                  { backgroundColor: typeColor?.[colorScheme] ?? colors.muted },
                ]}
              >
                <Text style={styles.typeText}>
                  {climbingTypeLabels[type] || type}
                </Text>
              </View>
            );
          })}
          {zone.climbingTypes.length > 3 && (
            <View style={[styles.typeBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.typeText, { color: colors.textSecondary }]}>
                +{zone.climbingTypes.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});




