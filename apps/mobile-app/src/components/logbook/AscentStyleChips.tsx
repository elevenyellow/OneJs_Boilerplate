/**
 * Ascent Style Chips
 *
 * Single-select chips for ascent style: Onsight, Flash, Redpoint, Go, Toprope
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import type { AscentStyle } from './types'

interface AscentStyleChipsProps {
  value: AscentStyle
  onValueChange: (value: AscentStyle) => void
}

const ASCENT_STYLES: {
  id: AscentStyle
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { id: 'onsight', icon: 'eye-outline' },
  { id: 'flash', icon: 'flash-outline' },
  { id: 'redpoint', icon: 'checkmark-circle-outline' },
  { id: 'go', icon: 'trending-up-outline' },
  { id: 'toprope', icon: 'arrow-up-outline' },
]

export function AscentStyleChips({
  value,
  onValueChange,
}: AscentStyleChipsProps) {
  const { t } = useTranslation()

  return (
    <View className="px-4 mb-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        {t('logAscent.sections.style')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {ASCENT_STYLES.map((style) => {
          const isSelected = value === style.id
          return (
            <TouchableOpacity
              key={style.id}
              onPress={() => onValueChange(style.id)}
              className={`flex-row items-center px-3 py-2.5 rounded-lg border ${
                isSelected
                  ? 'bg-accent border-accent'
                  : 'bg-card-elevated border-border'
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={style.icon}
                size={16}
                color={isSelected ? colors.text.primary : colors.text.secondary}
              />
              <Text
                className={`text-sm font-medium capitalize ml-1.5 ${
                  isSelected ? 'text-white' : 'text-gray-300'
                }`}
              >
                {t(`logAscent.ascentStyles.${style.id}`)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
