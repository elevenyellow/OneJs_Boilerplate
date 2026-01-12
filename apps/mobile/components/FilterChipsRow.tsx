import React from 'react'
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native'

interface FilterChipsRowProps {
  /** Children components (FilterChip elements) */
  children: React.ReactNode
  /** Optional container style */
  style?: ViewStyle
  /** Compact mode with less vertical spacing */
  compact?: boolean
}

export function FilterChipsRow({
  children,
  style,
  compact,
}: FilterChipsRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={compact ? styles.contentCompact : styles.content}
      style={[compact ? styles.containerCompact : styles.container, style]}
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  containerCompact: {
    marginBottom: 0,
    flexShrink: 1,
  },
  content: {
    gap: 8,
    paddingRight: 8,
  },
  contentCompact: {
    gap: 6,
    paddingRight: 4,
  },
})
