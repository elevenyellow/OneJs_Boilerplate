/**
 * Setting Section
 *
 * Groups related settings with a title header and optional icon.
 */

import { View, Text, type ViewProps } from 'react-native'
import type { ReactNode } from 'react'
import { colors } from '@/theme/colors'

interface SettingSectionProps extends ViewProps {
  /**
   * Section title displayed above the settings
   */
  title: string

  /**
   * Optional subtitle or description
   */
  subtitle?: string

  /**
   * Optional icon to display next to the title
   */
  icon?: ReactNode

  /**
   * Optional icon color (defaults to accent)
   */
  iconColor?: string

  /**
   * Setting rows to display in this section
   */
  children: ReactNode
}

export function SettingSection({
  title,
  subtitle,
  icon,
  iconColor = colors.accent.DEFAULT,
  children,
  className,
  ...props
}: SettingSectionProps) {
  return (
    <View className={`mb-6 ${className ?? ''}`} {...props}>
      <View className="px-4 mb-2 flex-row items-center">
        {icon && (
          <View
            className="w-7 h-7 rounded-lg items-center justify-center mr-2"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            {icon}
          </View>
        )}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text>
          )}
        </View>
      </View>
      <View className="bg-card rounded-xl mx-4 overflow-hidden border border-border-muted">
        {children}
      </View>
    </View>
  )
}
