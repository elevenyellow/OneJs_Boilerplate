import { memo, useCallback, type ReactNode } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { haptics } from '@/services/haptics'
import { StarRating } from './StarRating'
import { OptimizedImage } from './OptimizedImage'

export interface BaseLocationCardProps {
  /** Location name */
  name: string
  /** Optional image URL */
  imageUrl?: string
  /** Whether this card is currently selected */
  isSelected?: boolean
  /** Press handler */
  onPress?: () => void
  /** Star rating (0-3) */
  starRating?: number
  /** Whether to apply horizontal margin (mx-4) */
  hasHorizontalMargin?: boolean
  /** Optional badge to show next to the name */
  nameBadge?: ReactNode
  /** Main content slot (route summary, location, etc.) */
  children?: ReactNode
  /** Icon badges row slot */
  badgesSlot?: ReactNode
  /** Footer row slot (conditions, distance, etc.) */
  footerSlot?: ReactNode
  /** Right-side slot (chevron, action button, etc.) */
  rightSlot?: ReactNode
  /** Optional image overlay (e.g., "generic image" indicator) */
  imageOverlay?: ReactNode
  /** Header right slot (weather indicators, etc.) - displayed between name and nameBadge */
  headerRightSlot?: ReactNode
}

/**
 * Base component for location cards (crags, sectors, zones).
 * Provides consistent styling and layout with customizable slots.
 * Memoized to prevent unnecessary re-renders in lists.
 */
export const BaseLocationCard = memo(function BaseLocationCard({
  name,
  imageUrl,
  isSelected,
  onPress,
  starRating,
  hasHorizontalMargin = true,
  nameBadge,
  children,
  badgesSlot,
  footerSlot,
  rightSlot,
  imageOverlay,
  headerRightSlot,
}: BaseLocationCardProps) {
  const hasImage = Boolean(imageUrl)

  // Stable callback reference
  const handlePress = useCallback(() => {
    haptics.light()
    onPress?.()
  }, [onPress])

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className={`bg-card rounded-2xl p-3 mb-3 border ${
        isSelected ? 'border-accent' : 'border-gray-800'
      } ${hasHorizontalMargin ? 'mx-4' : ''}`}
    >
      <View className="flex-row">
        {/* Image */}
        {hasImage && (
          <View className="w-24 h-24 rounded-xl overflow-hidden">
            <OptimizedImage
              source={imageUrl!}
              width={96}
              height={96}
              contentFit="cover"
              placeholder="skeleton"
            />
            {imageOverlay}
          </View>
        )}

        {/* Main content */}
        <View className={`flex-1 justify-between ${hasImage ? 'ml-3' : ''}`}>
          {/* Header: Name + badges + star rating */}
          <View>
            <View className="flex-row items-center justify-between">
              <Text
                className="text-white text-lg font-bold flex-shrink"
                numberOfLines={1}
              >
                {name}
              </Text>
              {headerRightSlot}
              {nameBadge}
              {starRating !== undefined && starRating > 0 && (
                <View className="ml-2">
                  <StarRating rating={starRating} maxStars={3} size={12} />
                </View>
              )}
            </View>

            {/* Main content slot */}
            {children}
          </View>

          {/* Icon badges row */}
          {badgesSlot}

          {/* Footer row */}
          {footerSlot}
        </View>

        {/* Right slot (chevron, etc.) */}
        {rightSlot}
      </View>
    </TouchableOpacity>
  )
})
