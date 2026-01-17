/**
 * Tries Counter Component
 *
 * Stepper control to set the number of attempts for a route.
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

interface TriesCounterProps {
  value: number
  onValueChange: (value: number) => void
}

export function TriesCounter({ value, onValueChange }: TriesCounterProps) {
  const { t } = useTranslation()

  const handleDecrement = () => {
    if (value > 1) {
      onValueChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < 999) {
      onValueChange(value + 1)
    }
  }

  return (
    <View className="px-4 mb-6">
      <Text className="text-gray-400 text-sm mb-3 uppercase tracking-wide">
        {t('logAscent.sections.tries')}
      </Text>
      <View className="flex-row items-center bg-card-elevated rounded-xl border border-border px-4 py-2">
        <TouchableOpacity
          onPress={handleDecrement}
          disabled={value <= 1}
          className="h-10 w-10 items-center justify-center rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons
            name="remove-circle-outline"
            size={28}
            color={value <= 1 ? colors.text.muted : colors.accent.DEFAULT}
          />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-white text-2xl font-bold">{value}</Text>
        </View>

        <TouchableOpacity
          onPress={handleIncrement}
          disabled={value >= 999}
          className="h-10 w-10 items-center justify-center rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons
            name="add-circle-outline"
            size={28}
            color={value >= 999 ? colors.text.muted : colors.accent.DEFAULT}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}
