import React from 'react'
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native'

interface FilterChipsRowProps {
  /** Children components (FilterChip elements) */
  children: React.ReactNode
  /** Optional container style */
  style?: ViewStyle
}

export function FilterChipsRow({ children, style }: FilterChipsRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={[styles.container, style]}
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    gap: 8,
    paddingRight: 8,
  },
})
