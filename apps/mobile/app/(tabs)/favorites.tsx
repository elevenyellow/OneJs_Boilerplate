import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ZoneList } from '@/components/ZoneList';
import { api, type Zone } from '@/lib/api';
import { Colors } from '@/constants/Colors';

const STORAGE_KEY = 'climbzone-favorites';

export default function FavoritesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from storage
  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        setFavoriteIds(ids);
        return ids;
      }
      return [];
    } catch (e) {
      console.error('Error loading favorites:', e);
      return [];
    }
  }, []);

  // Fetch zone details for favorites
  const fetchZones = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setZones([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await Promise.all(
        ids.map((id) => api.zones.getById(id).catch(() => null))
      );
      const validZones = results.filter((z): z is Zone => z !== null);
      setZones(validZones);
    } catch (e) {
      console.error('Error fetching zones:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites().then(fetchZones);
  }, [loadFavorites, fetchZones]);

  const handleRefresh = useCallback(async () => {
    const ids = await loadFavorites();
    await fetchZones(ids);
  }, [loadFavorites, fetchZones]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header info */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.destructive + '20' }]}>
          <Ionicons name="heart" size={24} color={colors.destructive} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Favorites</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {zones.length} {zones.length === 1 ? 'saved zone' : 'saved zones'}
        </Text>
      </View>

      {/* Content */}
      {!isLoading && zones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No favorites yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Explore climbing zones and save your favorites for quick access.
          </Text>
          <Pressable
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/zones')}
          >
            <Text style={[styles.exploreButtonText, { color: colors.primaryForeground }]}>
              Explore zones
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      ) : (
        <ZoneList
          zones={zones}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
    lineHeight: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});




