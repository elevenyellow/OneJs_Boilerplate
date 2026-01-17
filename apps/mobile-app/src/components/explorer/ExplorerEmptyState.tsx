import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { FiltersBar } from './FiltersBar'
import { colors } from '@/theme/colors'
import type { ExplorerSearchParams } from './types'

interface ExplorerEmptyStateProps {
  searchParams: ExplorerSearchParams
  onFilterChange: (updates: Partial<ExplorerSearchParams>) => void
  onOpenFilters: () => void
  onRetry: () => void
}

export function ExplorerEmptyState({
  searchParams,
  onFilterChange,
  onOpenFilters,
  onRetry,
}: ExplorerEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-1">
      {/* Filters bar for quick adjustments */}
      <View className="py-3">
        <FiltersBar
          searchParams={searchParams}
          onFilterChange={onFilterChange}
          size="sm"
        />
      </View>

      {/* Empty state content */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-card rounded-full p-6 mb-6">
          <Ionicons name="search-outline" size={48} color={colors.text.muted} />
        </View>
        <Text className="text-xl font-semibold text-white text-center mb-2">
          {t('explorer.noCragsFound')}
        </Text>
        <Text className="text-gray-400 text-center mb-8">
          {t('explorer.adjustFiltersMessage')}
        </Text>

        {/* Action buttons */}
        <View className="w-full gap-3">
          <TouchableOpacity
            onPress={onOpenFilters}
            className="bg-accent py-4 rounded-xl flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              {t('explorer.adjustFilters')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onRetry}
            className="bg-card border border-border py-4 rounded-xl flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh-outline"
              size={20}
              color={colors.text.secondary}
            />
            <Text className="text-gray-300 font-medium ml-2">
              {t('explorer.searchAgain')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
