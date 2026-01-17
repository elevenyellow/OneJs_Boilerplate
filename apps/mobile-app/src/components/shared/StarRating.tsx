import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { StarIcon, StarOutlineIcon } from './icons'
import { colors } from '@/theme/colors'

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: number
  color?: string
}

/**
 * Memoized star rating component.
 * Avoids re-renders when parent updates with same props.
 */
export const StarRating = memo(function StarRating({
  rating,
  maxStars = 3,
  size = 14,
  color = colors.grade.medium,
}: StarRatingProps) {
  // Memoize the stars array to avoid recreation on each render
  const stars = useMemo(() => {
    return Array.from({ length: maxStars }, (_, index) => ({
      key: index,
      filled: index < rating,
    }))
  }, [maxStars, rating])

  return (
    <View className="flex-row">
      {stars.map((star) =>
        star.filled ? (
          <StarIcon key={star.key} size={size} color={color} />
        ) : (
          <StarOutlineIcon
            key={star.key}
            size={size}
            color={colors.text.muted}
          />
        ),
      )}
    </View>
  )
})
