import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { ZoneCard } from './ZoneCard';
import { Colors } from '@/constants/Colors';
import type { Zone } from '@/lib/api';

interface ZoneListProps {
  zones: Zone[];
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  emptyMessage?: string;
}

export function ZoneList({
  zones,
  isLoading,
  onRefresh,
  isRefreshing = false,
  emptyMessage = 'No zones found',
}: ZoneListProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (isLoading && zones.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading zones...
        </Text>
      </View>
    );
  }

  if (zones.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={zones}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ZoneCard zone={item} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});




