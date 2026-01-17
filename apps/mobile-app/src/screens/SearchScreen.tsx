import { View, Text, FlatList, TouchableOpacity, Keyboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/navigation/types'
import type { SectorUI } from '@/types/ui'
import { SearchInput, CragListItem, ChevronBackIcon } from '@/components/shared'
import { useRecentSearches } from '@/hooks/useRecentSearches'
import { useSearchFilter } from '@/hooks/useSearchFilter'
import { colors } from '@/theme/colors'

type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>

export function SearchScreen({ route, navigation }: SearchScreenProps) {
  const { t } = useTranslation()
  const { sectors } = route.params
  const [searchQuery, setSearchQuery] = useState('')

  const { recentSearches, addSearch, removeSearch, clearHistory } =
    useRecentSearches()

  // Filter sectors based on search query (client-side)
  const { filteredItems: filteredSectors, hasQuery: hasSearchQuery } =
    useSearchFilter({
      items: sectors,
      query: searchQuery,
      requireQuery: true,
    })

  // Get top suggested crags sorted by match score
  const suggestedCrags = useMemo(() => {
    return sectors
      .slice()
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
      .slice(0, 5)
  }, [sectors])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleCragPress = useCallback(
    (crag: SectorUI) => {
      // Save to recent searches with crag info
      addSearch(crag.name, crag.id, crag.name)

      // Navigate to Crag screen
      navigation.navigate('Crag', {
        zoneId: crag.id,
        zoneName: crag.name,
        originTab: route.params.originTab || 'Explorer',
      })
    },
    [navigation, addSearch, route.params.originTab],
  )

  const handleRecentSearchPress = useCallback(
    (search: { query: string; cragId?: string; cragName?: string }) => {
      if (search.cragId && search.cragName) {
        // If we have crag info, navigate directly
        navigation.navigate('Crag', {
          zoneId: search.cragId,
          zoneName: search.cragName,
          originTab: route.params.originTab || 'Explorer',
        })
      } else {
        // Otherwise, apply the search query
        setSearchQuery(search.query)
      }
    },
    [navigation, route.params.originTab],
  )

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery?.trim()) {
      addSearch(searchQuery.trim())
      Keyboard.dismiss()
    }
  }, [searchQuery, addSearch])

  const showResults = hasSearchQuery
  const showEmptyResults = showResults && filteredSectors.length === 0
  const showRecentAndSuggestions = !hasSearchQuery

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header with search input */}
      <View className="flex-row items-center px-4 py-3 gap-3">
        <TouchableOpacity
          onPress={handleBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-card"
          activeOpacity={0.8}
        >
          <ChevronBackIcon size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('search.searchCrags')}
          autoFocus
          onSubmit={handleSearchSubmit}
        />
      </View>

      {/* Content area */}
      <View className="flex-1">
        {showRecentAndSuggestions && (
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={
              <View>
                {/* Recent Searches Section */}
                {recentSearches.length > 0 && (
                  <View className="mb-6">
                    <View className="flex-row items-center justify-between px-4 mb-3">
                      <Text className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                        {t('search.recentSearches')}
                      </Text>
                      <TouchableOpacity onPress={clearHistory}>
                        <Text className="text-accent text-sm">
                          {t('search.clearHistory')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {recentSearches.map((search) => (
                      <TouchableOpacity
                        key={search.id}
                        className="flex-row items-center px-4 py-3"
                        onPress={() => handleRecentSearchPress(search)}
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3">
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color={colors.text.muted}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-base">
                            {search.cragName ?? search.query}
                          </Text>
                          {search.cragName &&
                            search.query !== search.cragName && (
                              <Text className="text-gray-500 text-sm">
                                {search.query}
                              </Text>
                            )}
                        </View>
                        <TouchableOpacity
                          onPress={() => removeSearch(search.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons
                            name="close"
                            size={20}
                            color={colors.text.muted}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Suggestions Section */}
                {suggestedCrags.length > 0 && (
                  <View>
                    <Text className="text-gray-400 text-sm font-medium uppercase tracking-wide px-4 mb-3">
                      {t('search.suggestions')}
                    </Text>

                    {suggestedCrags.map((crag) => (
                      <CragListItem
                        key={crag.id}
                        crag={crag}
                        onPress={() => handleCragPress(crag)}
                      />
                    ))}
                  </View>
                )}
              </View>
            }
            keyboardShouldPersistTaps="handled"
          />
        )}

        {showResults && !showEmptyResults && (
          <FlatList
            data={filteredSectors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CragListItem crag={item} onPress={() => handleCragPress(item)} />
            )}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Text className="text-gray-400 text-sm px-4 py-2">
                {t('search.resultsCount', { count: filteredSectors.length })}
              </Text>
            }
          />
        )}

        {showEmptyResults && (
          <View className="flex-1 items-center justify-center px-8">
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
        )}
      </View>
    </SafeAreaView>
  )
}
