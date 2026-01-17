/**
 * Setting Toggle
 *
 * A setting row with a Switch control for boolean preferences.
 */

import { Switch } from 'react-native'
import { SettingRow } from './SettingRow'
import { colors } from '@/theme/colors'
import type { ReactNode } from 'react'

interface SettingToggleProps {
  /**
   * Setting label
   */
  label: string

  /**
   * Optional description text
   */
  description?: string

  /**
   * Current toggle value
   */
  value: boolean

  /**
   * Handler for value changes
   */
  onValueChange: (value: boolean) => void

  /**
   * Icon to display on the left
   */
  leftIcon?: ReactNode

  /**
   * Whether this is the last row in a section
   */
  isLast?: boolean

  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean
}

export function SettingToggle({
  label,
  description,
  value,
  onValueChange,
  leftIcon,
  isLast = false,
  disabled = false,
}: SettingToggleProps) {
  return (
    <SettingRow
      label={label}
      description={description}
      leftIcon={leftIcon}
      isLast={isLast}
      disabled={disabled}
      rightContent={
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{
            false: colors.border.default,
            true: colors.accent.DEFAULT,
          }}
          thumbColor={colors.text.primary}
          ios_backgroundColor={colors.border.default}
        />
      }
    />
  )
}
