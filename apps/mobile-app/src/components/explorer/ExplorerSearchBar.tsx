import { View, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  SearchInput,
  CloseIcon,
  SearchIcon,
  OptionsIcon,
  ScreenHeader,
} from '@/components/shared'
import { colors } from '@/theme/colors'

interface ExplorerSearchBarProps {
  isSearchMode: boolean
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onCloseSearch: () => void
  onToggleSearch: () => void
  onOpenFilters: () => void
  isEmpty: boolean
  sectorsCount: number
}

export function ExplorerSearchBar({
  isSearchMode,
  searchQuery,
  onSearchQueryChange,
  onCloseSearch,
  onToggleSearch,
  onOpenFilters,
  isEmpty,
  sectorsCount,
}: ExplorerSearchBarProps) {
  const { t } = useTranslation()

  if (isSearchMode) {
    return (
      <View className="flex-row items-center px-4 py-3 gap-3">
        <View className="flex-1">
          <SearchInput
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder={t('search.searchCrags')}
            autoFocus
          />
        </View>
        <TouchableOpacity
          onPress={onCloseSearch}
          className="h-10 w-10 items-center justify-center rounded-full bg-card"
          activeOpacity={0.8}
        >
          <CloseIcon size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScreenHeader
      title={
        isEmpty
          ? t('explorer.noResults')
          : t('explorer.sectorsFound', { count: sectorsCount })
      }
      showBackButton={false}
      rightActions={
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
            onPress={onToggleSearch}
            activeOpacity={0.8}
          >
            <SearchIcon size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
            onPress={onOpenFilters}
            activeOpacity={0.8}
          >
            <OptionsIcon />
          </TouchableOpacity>
        </View>
      }
    />
  )
}
