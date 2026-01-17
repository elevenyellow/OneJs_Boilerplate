/**
 * Quality Stars
 *
 * Interactive star rating component for route quality.
 * Tap on a star to set the rating (1-5).
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

interface QualityStarsProps {
  value: number
  maxStars?: number
  onValueChange: (value: number) => void
}

export function QualityStars({
  value,
  maxStars = 5,
  onValueChange,
}: QualityStarsProps) {
  const { t } = useTranslation()

  const handleStarPress = (starIndex: number) => {
    // If tapping the same star that's already the value, toggle it off
    if (starIndex === value) {
      onValueChange(0)
    } else {
      onValueChange(starIndex)
    }
  }

  return (
    <View className="px-4 mb-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        {t('logAscent.sections.quality')}
      </Text>
      <View className="flex-row justify-between">
        {Array.from({ length: maxStars }, (_, index) => {
          const starNumber = index + 1
          const isFilled = starNumber <= value
          return (
            <TouchableOpacity
              key={starNumber}
              onPress={() => handleStarPress(starNumber)}
              className="flex-1 items-center py-2"
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFilled ? 'star' : 'star-outline'}
                size={36}
                color={isFilled ? colors.grade.medium : colors.text.muted}
              />
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
