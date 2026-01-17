/**
 * Setting Row
 *
 * Base component for a single setting item.
 * Use specialized components (SettingToggle, SettingSelect) for specific input types.
 */

import { View, Text, TouchableOpacity, type ViewProps } from 'react-native'
import type { ReactNode } from 'react'
import { ChevronRightIcon } from '../shared/icons'
import { colors } from '@/theme/colors'

interface SettingRowProps extends ViewProps {
  /**
   * Setting label
   */
  label: string

  /**
   * Optional description text
   */
  description?: string

  /**
   * Right side content (value display, switch, etc.)
   */
  rightContent?: ReactNode

  /**
   * Handler for row press (for navigation or modal opening)
   */
  onPress?: () => void

  /**
   * Whether to show the chevron indicator
   */
  showChevron?: boolean

  /**
   * Icon to display on the left
   */
  leftIcon?: ReactNode

  /**
   * Whether this is the last row in a section (removes bottom border)
   */
  isLast?: boolean

  /**
   * Whether the row is disabled
   */
  disabled?: boolean
}

export function SettingRow({
  label,
  description,
  rightContent,
  onPress,
  showChevron = false,
  leftIcon,
  isLast = false,
  disabled = false,
  className,
  ...props
}: SettingRowProps) {
  const content = (
    <View
      className={`flex-row items-center px-4 py-3 ${
        !isLast ? 'border-b border-border' : ''
      } ${disabled ? 'opacity-50' : ''} ${className ?? ''}`}
      {...props}
    >
      {leftIcon && <View className="mr-3">{leftIcon}</View>}

      <View className="flex-1">
        <Text className="text-base text-white font-medium">{label}</Text>
        {description && (
          <Text className="text-sm text-gray-400 mt-0.5">{description}</Text>
        )}
      </View>

      {rightContent && <View className="ml-2">{rightContent}</View>}

      {showChevron && <ChevronRightIcon size={20} color={colors.text.muted} />}
    </View>
  )

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}
