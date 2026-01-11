import { Colors } from '@/constants/Colors'
import { useFilters } from '@/contexts/FiltersContext'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'

interface GradeRangeBadgeProps {
  /** Compact style for tight spaces */
  compact?: boolean
  /** Show edit icon */
  showEditIcon?: boolean
  /** Custom style override */
  style?: object
}

/**
 * Tappable badge that shows current grade range and opens the global grade picker
 * Can be placed anywhere in the app
 */
export function GradeRangeBadge({ 
  compact = false, 
  showEditIcon = true,
  style 
}: GradeRangeBadgeProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const { gradeRange, showGradePicker } = useFilters()

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    showGradePicker()
  }

  if (compact) {
    return (
      <Pressable
        style={[
          styles.compactBadge,
          { backgroundColor: colors.primary + '20', borderColor: colors.primary },
          style,
        ]}
        onPress={handlePress}
      >
        <Ionicons name="speedometer" size={12} color={colors.primary} />
        <Text style={[styles.compactText, { color: colors.primary }]}>
          {gradeRange.min}-{gradeRange.max}
        </Text>
        {showEditIcon && (
          <Ionicons name="chevron-down" size={12} color={colors.primary} />
        )}
      </Pressable>
    )
  }

  return (
    <Pressable
      style={[
        styles.badge,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
      onPress={handlePress}
    >
      <View style={styles.badgeContent}>
        <Ionicons name="speedometer" size={16} color={colors.primary} />
        <View style={styles.badgeTextContainer}>
          <Text style={[styles.badgeLabel, { color: colors.textSecondary }]}>
            Your range
          </Text>
          <Text style={[styles.badgeValue, { color: colors.text }]}>
            {gradeRange.min} - {gradeRange.max}
          </Text>
        </View>
      </View>
      {showEditIcon && (
        <Ionicons name="pencil" size={14} color={colors.textSecondary} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeTextContainer: {
    gap: 2,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '700',
  },
})
