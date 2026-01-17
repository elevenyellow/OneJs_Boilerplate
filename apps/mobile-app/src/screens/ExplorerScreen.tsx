import { View, Text, FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState, SkeletonList } from '@/components/shared'
import {
  ExplorerFiltersModal,
  ExplorerListHeader,
  LocationWarningBanner,
  ExplorerSearchBar,
  ExplorerEmptyState,
  SectorCard,
  SectorCardSkeleton,
} from '@/components/explorer'
import { Ionicons } from '@expo/vector-icons'
import { useCragSearch } from '@/hooks/useCragSearch'
import { useExplorerFilters } from '@/hooks/useExplorerFilters'
import { usePreferences } from '@/contexts/PreferencesContext'
import { colors } from '@/theme/colors'
import { LIST_ITEM_HEIGHTS, FLATLIST_OPTIMIZATION } from '@/constants/layout'
import type { ExplorerNavigationProp } from '@/components/explorer/types'

interface ExplorerScreenProps {
  navigation: ExplorerNavigationProp
}

const LIST_CONTENT_PADDING = { paddingBottom: 100 }

export function ExplorerScreen({ navigation }: ExplorerScreenProps) {
  const { t } = useTranslation()
  const { preferences } = usePreferences()

  // Use preferences for search defaults
  const preferenceDefaults = useMemo(
    () => ({
      radiusKm: preferences.defaultSearchRadiusKm,
    }),
    [preferences.defaultSearchRadiusKm],
  )

  const {
    sectors,
    isLoading,
    isRefetching,
    error,
    isError,
    hasLocationPermission,
    locationError,
    refetch,
    updateSearchParams,
    searchParams,
  } = useCragSearch(undefined, preferenceDefaults)

  const {
    sortBy,
    isSearchMode,
    searchQuery,
    showFiltersModal,
    handleSortChange,
    handleToggleSearch,
    handleCloseSearch,
    handleOpenFilters,
    handleCloseFilters,
    handleApplyFilters,
    handleQuickFilterChange,
    setSearchQuery,
    getSortedSectors,
    getSearchFilteredSectors,
  } = useExplorerFilters({ updateSearchParams })

  // Sort and filter sectors
  const sortedSectors = useMemo(
    () => getSortedSectors(sectors),
    [sectors, getSortedSectors],
  )

  const searchFilteredSectors = useMemo(
    () => getSearchFilteredSectors(sortedSectors),
    [sortedSectors, getSearchFilteredSectors],
  )

  const handleSectorPress = useCallback(
    (sectorId: string, sectorName: string) => {
      navigation.navigate('Crag', {
        zoneId: sectorId,
        zoneName: sectorName,
        originTab: 'Explorer',
      })
    },
    [navigation],
  )

  if (isLoading) {
    return (
      <SkeletonList
        count={4}
        ItemSkeleton={SectorCardSkeleton}
        headerTitle={`${t('explorer.searchingSectors')}...`}
      />
    )
  }

  if (isError && error) {
    return (
      <ErrorState
        title={t('common.error')}
        message={error.message}
        actionLabel={t('common.retry')}
        onAction={refetch}
      />
    )
  }

  const isEmpty = !isLoading && sectors.length === 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ExplorerSearchBar
        isSearchMode={isSearchMode}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onCloseSearch={handleCloseSearch}
        onToggleSearch={handleToggleSearch}
        onOpenFilters={handleOpenFilters}
        isEmpty={isEmpty}
        sectorsCount={sectors.length}
      />

      {!hasLocationPermission && (
        <LocationWarningBanner errorType={locationError} />
      )}

      {/* Subtle loading indicator when refetching with new filters */}
      {isRefetching && (
        <View className="h-0.5 bg-accent/30 overflow-hidden">
          <View className="h-full w-1/3 bg-accent animate-pulse" />
        </View>
      )}

      {isEmpty ? (
        <ExplorerEmptyState
          searchParams={searchParams}
          onFilterChange={handleQuickFilterChange}
          onOpenFilters={handleOpenFilters}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={searchFilteredSectors}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.status.success}
              colors={[colors.status.success]}
            />
          }
          ListHeaderComponent={
            isSearchMode && searchQuery?.trim() ? (
              <View className="px-4 py-2">
                <Text className="text-gray-400 text-sm">
                  {t('search.resultsCount', {
                    count: searchFilteredSectors.length,
                  })}
                </Text>
              </View>
            ) : (
              <ExplorerListHeader
                searchParams={searchParams}
                onFilterChange={handleQuickFilterChange}
                sortBy={sortBy}
                onSortChange={handleSortChange}
              />
            )
          }
          ListEmptyComponent={
            isSearchMode && searchQuery?.trim() ? (
              <View className="flex-1 items-center justify-center px-8 py-16">
                <View className="bg-card rounded-full p-6 mb-6">
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color={colors.text.muted}
                  />
                </View>
                <Text className="text-xl font-semibold text-white text-center mb-2">
                  {t('search.noResults')}
                </Text>
                <Text className="text-gray-400 text-center">
                  {t('search.noResultsMessage', { query: searchQuery })}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <SectorCard
              sector={item}
              onPress={() => handleSectorPress(item.id, item.name)}
            />
          )}
          ListFooterComponent={
            <View className="py-4 items-center">
              <Text className="text-gray-600 text-xs uppercase tracking-wider">
                {t('common.dataFromApi')} ·{' '}
                {new Date().toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          }
          contentContainerStyle={LIST_CONTENT_PADDING}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_data, index) => ({
            length: LIST_ITEM_HEIGHTS.SECTOR_CARD,
            offset: LIST_ITEM_HEIGHTS.SECTOR_CARD * index,
            index,
          })}
          maxToRenderPerBatch={FLATLIST_OPTIMIZATION.MAX_TO_RENDER_PER_BATCH}
          windowSize={FLATLIST_OPTIMIZATION.WINDOW_SIZE}
          initialNumToRender={FLATLIST_OPTIMIZATION.INITIAL_NUM_TO_RENDER}
          removeClippedSubviews={true}
        />
      )}

      <ExplorerFiltersModal
        visible={showFiltersModal}
        onClose={handleCloseFilters}
        searchParams={searchParams}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  )
}
