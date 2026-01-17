/**
 * Setting Cycle Chip
 *
 * A compact chip that displays the current value and cycles through
 * options on tap. Perfect for quick preference changes.
 */

import { TouchableOpacity, Text, View } from 'react-native'
import type { ReactNode } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

export interface CycleOption<T extends string> {
  id: T
  label: string
  shortLabel?: string
  icon?: ReactNode
}

interface SettingCycleChipProps<T extends string> {
  /**
   * Label to show before the value (optional, for context)
   */
  label?: string

  /**
   * Available options to cycle through
   */
  options: CycleOption<T>[]

  /**
   * Current selected value
   */
  value: T

  /**
   * Handler for value changes
   */
  onValueChange: (value: T) => void

  /**
   * Whether the chip is disabled
   */
  disabled?: boolean

  /**
   * Show a cycle indicator icon
   */
  showCycleIcon?: boolean

  /**
   * Custom icon to show before the label
   */
  icon?: ReactNode

  /**
   * Size variant
   */
  size?: 'sm' | 'md'
}

export function SettingCycleChip<T extends string>({
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  showCycleIcon = true,
  icon,
  size = 'md',
}: SettingCycleChipProps<T>) {
  const currentIndex = options.findIndex((opt) => opt.id === value)
  const currentOption = options[currentIndex]

  const handlePress = () => {
    if (disabled || options.length === 0) return

    const nextIndex = (currentIndex + 1) % options.length
    onValueChange(options[nextIndex].id)
  }

  const displayLabel =
    currentOption?.shortLabel ?? currentOption?.label ?? value

  const paddingClass = size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2'
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      className={`flex-row items-center ${paddingClass} rounded-lg bg-card border border-border ${disabled ? 'opacity-50' : ''}`}
    >
      {icon && <View className="mr-1.5">{icon}</View>}

      {label && (
        <Text className={`${textClass} text-gray-400 mr-1.5`}>{label}</Text>
      )}

      <Text className={`${textClass} font-medium text-white`}>
        {displayLabel}
      </Text>

      {showCycleIcon && options.length > 1 && (
        <Ionicons
          name="chevron-forward"
          size={iconSize}
          color={colors.text.secondary}
          style={{ marginLeft: 4 }}
        />
      )}
    </TouchableOpacity>
  )
}
