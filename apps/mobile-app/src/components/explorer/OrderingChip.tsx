/**
 * Ordering Chip
 *
 * A tappable chip that cycles through sort options for explorer results.
 * Styled consistently with FiltersBar chips.
 */

import { Text, TouchableOpacity } from 'react-native'
import { useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { SORT_OPTIONS, type SortOption } from './types'

interface OrderingChipProps {
  /**
   * Current sort option
   */
  currentSort: SortOption

  /**
   * Callback when sort option changes
   */
  onSortChange: (sort: SortOption) => void

  /**
   * Size variant for the chip
   */
  size?: 'sm' | 'md'
}

/**
 * Get icon name for each sort option
 */
function getSortIcon(sort: SortOption): keyof typeof Ionicons.glyphMap {
  switch (sort) {
    case 'bestMatch':
      return 'star'
    case 'distance':
      return 'location'
    case 'quality':
      return 'ribbon'
    case 'popularity':
      return 'trending-up'
    case 'routeCount':
      return 'git-branch'
    case 'name':
      return 'text'
    default:
      return 'swap-vertical'
  }
}

function OrderingChipComponent({
  currentSort,
  onSortChange,
  size = 'sm',
}: OrderingChipProps) {
  const { t } = useTranslation()

  const chipHeight = size === 'sm' ? 'h-8' : 'h-10'
  const chipPadding = size === 'sm' ? 'px-3' : 'px-4'
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'
  const iconSize = size === 'sm' ? 14 : 16

  // Cycle to next sort option
  const handleCycle = useCallback(() => {
    const currentIndex = SORT_OPTIONS.indexOf(currentSort)
    const nextIndex =
      currentIndex === -1 || currentIndex >= SORT_OPTIONS.length - 1
        ? 0
        : currentIndex + 1
    onSortChange(SORT_OPTIONS[nextIndex])
  }, [currentSort, onSortChange])

  // Get display label for current sort
  const sortLabel = useMemo(() => {
    return t(`sorting.${currentSort}`)
  }, [currentSort, t])

  // Get icon for current sort
  const sortIcon = useMemo(() => {
    return getSortIcon(currentSort)
  }, [currentSort])

  return (
    <TouchableOpacity
      onPress={handleCycle}
      className={`${chipHeight} ${chipPadding} bg-card border border-border rounded-full flex-row items-center`}
      activeOpacity={0.7}
    >
      <Ionicons
        name="swap-vertical"
        size={iconSize}
        color={colors.accent.DEFAULT}
      />
      <Ionicons
        name={sortIcon}
        size={iconSize - 2}
        color={colors.text.secondary}
        style={{ marginLeft: 4 }}
      />
      <Text className={`${textSize} text-white font-medium ml-1.5`}>
        {sortLabel}
      </Text>
    </TouchableOpacity>
  )
}

// Memoized to prevent unnecessary re-renders
export const OrderingChip = memo(OrderingChipComponent)
