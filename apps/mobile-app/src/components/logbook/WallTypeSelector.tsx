/**
 * Wall Type Selector
 *
 * Single-select buttons for wall angle: Slab, Vertical, Overhang, Roof
 * Each type has a custom icon representing the wall angle.
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import type { WallType } from './types'

interface WallTypeSelectorProps {
  value: WallType | null
  onValueChange: (value: WallType) => void
}

const WALL_TYPES: {
  id: WallType
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { id: 'slab', icon: 'analytics-outline' },
  { id: 'vertical', icon: 'add-outline' },
  { id: 'overhang', icon: 'diamond-outline' },
  { id: 'roof', icon: 'umbrella-outline' },
]

export function WallTypeSelector({
  value,
  onValueChange,
}: WallTypeSelectorProps) {
  const { t } = useTranslation()

  return (
    <View className="px-4 mb-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        {t('logAscent.sections.wallType')}
      </Text>
      <View className="flex-row gap-3">
        {WALL_TYPES.map((wallType) => {
          const isSelected = value === wallType.id
          return (
            <TouchableOpacity
              key={wallType.id}
              onPress={() => onValueChange(wallType.id)}
              className={`flex-1 py-4 rounded-xl items-center justify-center border ${
                isSelected
                  ? 'bg-accent/20 border-accent'
                  : 'bg-card-elevated border-border'
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={wallType.icon}
                size={24}
                color={
                  isSelected ? colors.accent.DEFAULT : colors.text.secondary
                }
              />
              <Text
                className={`text-xs font-medium mt-2 capitalize ${
                  isSelected ? 'text-accent' : 'text-gray-400'
                }`}
              >
                {t(`logAscent.wallTypes.${wallType.id}`)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
