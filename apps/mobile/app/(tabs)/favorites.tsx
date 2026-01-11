import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, type Zone } from '@/lib/api';
import { Colors, getScoreColor } from '@/constants/Colors';

const STORAGE_KEY = 'climbzone-favorites';

interface FavoriteItem {
  id: string;
  type: 'zone' | 'sector' | 'route';
  name: string;
  subtitle?: string;
  savedAt: string;
  data?: Zone;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'zones' | 'sectors'>('all');

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
  const fetchFavorites = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const zone = await api.zones.getById(id);
            return {
              id,
              type: 'zone' as const,
              name: zone.name,
              subtitle: `${zone.region}, ${zone.country}`,
              savedAt: new Date().toISOString(),
              data: zone,
            };
          } catch {
            return null;
          }
        })
      );
      const validFavorites = results.filter((f): f is FavoriteItem => f !== null);
      setFavorites(validFavorites);
    } catch (e) {
      console.error('Error fetching favorites:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites().then(fetchFavorites);
  }, [loadFavorites, fetchFavorites]);

  const handleRefresh = useCallback(async () => {
    const ids = await loadFavorites();
    await fetchFavorites(ids);
  }, [loadFavorites, fetchFavorites]);

  const handleRemoveFavorite = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newIds = favoriteIds.filter((fid) => fid !== id);
    setFavoriteIds(newIds);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
  };

  const renderFavoriteCard = ({ item }: { item: FavoriteItem }) => (
    <Pressable
      style={[styles.favoriteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/zone/${item.id}`);
      }}
    >
      <LinearGradient
        colors={colors.gradientAccent}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="location" size={24} color="rgba(255,255,255,0.9)" />
      </LinearGradient>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.subtitle && (
          <View style={styles.cardSubtitleRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
        )}
        {item.data && (
          <View style={styles.cardStats}>
            <View style={[styles.cardStat, { backgroundColor: colors.muted }]}>
              <Ionicons name="git-branch" size={12} color={colors.primary} />
              <Text style={[styles.cardStatText, { color: colors.text }]}>
                {item.data.totalRoutes} routes
              </Text>
            </View>
            {item.data.climbingTypes?.length > 0 && (
              <View style={[styles.cardStat, { backgroundColor: colors.muted }]}>
                <Text style={[styles.cardStatText, { color: colors.textSecondary }]}>
                  {item.data.climbingTypes[0]}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <Pressable
        style={[styles.removeButton, { backgroundColor: colors.destructive + '15' }]}
        onPress={() => handleRemoveFavorite(item.id)}
        hitSlop={8}
      >
        <Ionicons name="heart" size={18} color={colors.destructive} />
      </Pressable>
    </Pressable>
  );

  const filteredFavorites = favorites.filter((f) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'zones') return f.type === 'zone';
    if (activeTab === 'sectors') return f.type === 'sector';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradientCool}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Text style={styles.headerTitle}>Saved</Text>
            <Text style={styles.headerSubtitle}>
              {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
            </Text>
          </View>
          
          {/* Decorative */}
          <View style={styles.headerIcon}>
            <Ionicons name="heart" size={48} color="rgba(255,255,255,0.15)" />
          </View>
        </View>

        {/* Quick Stats */}
        {favorites.length > 0 && (
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Ionicons name="location" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.quickStatValue}>
                {favorites.filter((f) => f.type === 'zone').length}
              </Text>
              <Text style={styles.quickStatLabel}>Zones</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Ionicons name="grid" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.quickStatValue}>
                {favorites.filter((f) => f.type === 'sector').length}
              </Text>
              <Text style={styles.quickStatLabel}>Sectors</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Ionicons name="git-branch" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.quickStatValue}>
                {favorites.reduce((sum, f) => sum + (f.data?.totalRoutes || 0), 0)}
              </Text>
              <Text style={styles.quickStatLabel}>Routes</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Tab Filter */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(['all', 'zones', 'sectors'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {!isLoading && favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={colors.gradientCool}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="heart-outline" size={48} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No saved items yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start exploring and save your favorite climbing spots for quick access.
          </Text>
          <Pressable
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/');
            }}
          >
            <Text style={styles.exploreButtonText}>Start exploring</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
          renderItem={renderFavoriteCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyFilterContainer}>
                <Ionicons name="search" size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyFilterText, { color: colors.textSecondary }]}>
                  No {activeTab === 'all' ? 'items' : activeTab} found
                </Text>
              </View>
            ) : null
          }
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
    paddingBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 4,
  },
  headerIcon: {
    marginRight: -10,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  quickStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 120,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    marginBottom: 0,
    gap: 12,
  },
  cardGradient: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    flex: 1,
  },
  cardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cardStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 300,
    lineHeight: 22,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyFilterContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyFilterText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
