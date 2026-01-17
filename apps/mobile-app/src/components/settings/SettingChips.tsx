/**
 * Setting Chips
 *
 * A setting row with chip/pill buttons for single or multi-select options.
 */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import type { ReactNode } from 'react'

export interface ChipOption<T extends string> {
  id: T
  label: string
  icon?: ReactNode
}

interface SettingChipsProps<T extends string> {
  /**
   * Setting label
   */
  label: string

  /**
   * Optional description text
   */
  description?: string

  /**
   * Available options
   */
  options: ChipOption<T>[]

  /**
   * Current selected value(s)
   */
  value: T | T[]

  /**
   * Handler for value changes
   */
  onValueChange: (value: T | T[]) => void

  /**
   * Whether multiple selections are allowed
   */
  multiple?: boolean

  /**
   * Whether to use horizontal scroll for many options
   */
  horizontal?: boolean

  /**
   * Whether this is the last row in a section
   */
  isLast?: boolean

  /**
   * Whether the chips are disabled
   */
  disabled?: boolean
}

export function SettingChips<T extends string>({
  label,
  description,
  options,
  value,
  onValueChange,
  multiple = false,
  horizontal = false,
  isLast = false,
  disabled = false,
}: SettingChipsProps<T>) {
  const selectedValues = Array.isArray(value) ? value : [value]

  const handlePress = (optionId: T) => {
    if (disabled) return

    if (multiple) {
      const currentValues = selectedValues as T[]
      if (currentValues.includes(optionId)) {
        onValueChange(currentValues.filter((v) => v !== optionId) as T[])
      } else {
        onValueChange([...currentValues, optionId] as T[])
      }
    } else {
      onValueChange(optionId)
    }
  }

  const renderChips = () => (
    <>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.id)
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => handlePress(option.id)}
            disabled={disabled}
            className={`flex-row items-center justify-center px-4 py-2.5 rounded-lg border ${
              isSelected
                ? 'bg-accent border-accent'
                : 'bg-card-elevated border-border'
            } ${disabled ? 'opacity-50' : ''}`}
            activeOpacity={0.7}
          >
            {option.icon && (
              <View className="mr-2">
                {/* Clone icon with appropriate color */}
                {option.icon}
              </View>
            )}
            <Text
              className={`text-sm font-medium ${
                isSelected ? 'text-white' : 'text-gray-300'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </>
  )

  return (
    <View
      className={`px-4 py-3 ${!isLast ? 'border-b border-border' : ''} ${disabled ? 'opacity-50' : ''}`}
    >
      <View className="mb-3">
        <Text className="text-base text-white font-medium">{label}</Text>
        {description && (
          <Text className="text-sm text-gray-400 mt-0.5">{description}</Text>
        )}
      </View>

      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {renderChips()}
        </ScrollView>
      ) : (
        <View className="flex-row flex-wrap gap-2">{renderChips()}</View>
      )}
    </View>
  )
}
