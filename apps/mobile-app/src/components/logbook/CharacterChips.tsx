/**
 * Character Chips
 *
 * Multi-select chips for route characteristics: Cruxy, Athletic, Slopers, etc.
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import type { RouteCharacteristic } from './types'

interface CharacterChipsProps {
  value: RouteCharacteristic[]
  onValueChange: (value: RouteCharacteristic[]) => void
}

const CHARACTERISTICS: {
  id: RouteCharacteristic
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { id: 'cruxy', icon: 'flash-outline' },
  { id: 'athletic', icon: 'barbell-outline' },
  { id: 'slopers', icon: 'hand-left-outline' },
  { id: 'endurance', icon: 'fitness-outline' },
  { id: 'technical', icon: 'footsteps-outline' },
  { id: 'crimpy', icon: 'finger-print-outline' },
]

export function CharacterChips({ value, onValueChange }: CharacterChipsProps) {
  const { t } = useTranslation()

  const handleToggle = (characteristic: RouteCharacteristic) => {
    if (value.includes(characteristic)) {
      onValueChange(value.filter((c) => c !== characteristic))
    } else {
      onValueChange([...value, characteristic])
    }
  }

  return (
    <View className="px-4 mb-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        {t('logAscent.sections.character')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {CHARACTERISTICS.map((characteristic) => {
          const isSelected = value.includes(characteristic.id)
          return (
            <TouchableOpacity
              key={characteristic.id}
              onPress={() => handleToggle(characteristic.id)}
              className={`flex-row items-center px-3 py-2.5 rounded-lg border ${
                isSelected
                  ? 'bg-accent/10 border-accent'
                  : 'bg-card-elevated border-border'
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={characteristic.icon}
                size={16}
                color={isSelected ? colors.accent.DEFAULT : colors.text.muted}
              />
              <Text
                className={`text-sm font-medium capitalize ml-1.5 ${
                  isSelected ? 'text-accent' : 'text-gray-300'
                }`}
              >
                {t(`logAscent.characteristics.${characteristic.id}`)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
