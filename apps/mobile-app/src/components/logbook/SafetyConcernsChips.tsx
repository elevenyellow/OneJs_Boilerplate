/**
 * Safety Concerns Chips Component
 *
 * Multi-select chips for flagging safety issues on a route.
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import type { SafetyConcern } from './types'

interface SafetyConcernsChipsProps {
  value: SafetyConcern[]
  onValueChange: (value: SafetyConcern[]) => void
}

const SAFETY_CONCERNS: {
  id: SafetyConcern
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { id: 'looseRock', icon: 'warning-outline' },
  { id: 'highFirstBolt', icon: 'arrow-up-outline' },
  { id: 'badBolts', icon: 'construct-outline' },
  { id: 'badAnchor', icon: 'link-outline' },
]

export function SafetyConcernsChips({
  value,
  onValueChange,
}: SafetyConcernsChipsProps) {
  const { t } = useTranslation()

  const handleToggle = (concernId: SafetyConcern) => {
    if (value.includes(concernId)) {
      onValueChange(value.filter((c) => c !== concernId))
    } else {
      onValueChange([...value, concernId])
    }
  }

  return (
    <View className="px-4 mb-6">
      <Text className="text-gray-400 text-sm mb-3 uppercase tracking-wide">
        {t('logAscent.sections.safety')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {SAFETY_CONCERNS.map((concern) => {
          const isSelected = value.includes(concern.id)
          return (
            <TouchableOpacity
              key={concern.id}
              onPress={() => handleToggle(concern.id)}
              className={`flex-row items-center px-3 py-2 rounded-full border ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500'
                  : 'bg-card-elevated border-border'
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={concern.icon}
                size={16}
                color={isSelected ? colors.status.warning : colors.text.muted}
              />
              <Text
                className={`text-sm ml-2 ${
                  isSelected ? 'text-amber-500' : 'text-gray-400'
                }`}
              >
                {t(`logAscent.safetyConcerns.${concern.id}`)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
