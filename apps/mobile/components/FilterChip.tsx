import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  type ViewStyle,
} from 'react-native'

interface FilterChipProps {
  /** Label text to display */
  label: string
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap
  /** Whether the chip is in active/selected state */
  isActive?: boolean
  /** Custom active color (defaults to primary) */
  activeColor?: string
  /** Callback when chip is pressed */
  onPress: () => void
  /** Optional container style */
  style?: ViewStyle
}

export function FilterChip({
  label,
  icon,
  isActive = false,
  activeColor,
  onPress,
  style,
}: FilterChipProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const chipColor = activeColor || colors.primary
  const textColor = isActive ? chipColor : colors.textSecondary
  const backgroundColor = isActive ? `${chipColor}20` : colors.muted
  const borderColor = isActive ? chipColor : colors.border

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        { backgroundColor, borderColor },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={12}
          color={textColor}
        />
      )}
      <Text style={[styles.filterChipText, { color: textColor }]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
