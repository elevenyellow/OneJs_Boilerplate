import { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ZoneList } from '@/components/ZoneList';
import { useZones } from '@/hooks/useZones';
import { Colors } from '@/constants/Colors';
import type { ZoneFilters } from '@/lib/api';

export default function ZonesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ZoneFilters>({});

  const { data: zones, isLoading, refetch, isRefetching } = useZones({
    ...filters,
    search: searchQuery || undefined,
  });

  const handleSearch = useCallback(() => {
    refetch();
  }, [refetch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters({});
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.muted }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar zonas..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {zones?.length ?? 0} zonas encontradas
        </Text>
      </View>

      {/* Zone list */}
      <ZoneList
        zones={zones || []}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
        emptyMessage={
          searchQuery
            ? `No se encontraron zonas para "${searchQuery}"`
            : 'No hay zonas disponibles'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
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
});




