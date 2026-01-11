import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useColorScheme } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '@/constants/Colors'

interface DistanceSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

const DISTANCE_OPTIONS = [
  { value: 25, label: '25', icon: 'walk-outline' as const, description: 'Very close' },
  { value: 50, label: '50', icon: 'bicycle-outline' as const, description: 'Close' },
  { value: 75, label: '75', icon: 'car-outline' as const, description: 'Accessible' },
  { value: 100, label: '100', icon: 'car-sport-outline' as const, description: 'Short trip' },
  { value: 150, label: '150', icon: 'bus-outline' as const, description: 'Day trip' },
  { value: 200, label: '200', icon: 'airplane-outline' as const, description: 'Adventure' },
]

export function DistanceSlider({
  label,
  value,
  onChange,
}: DistanceSliderProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const handleSelect = (distance: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(distance)
  }

  // Find closest option to current value
  const closestOption = DISTANCE_OPTIONS.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  )

  const selectedOption = DISTANCE_OPTIONS.find(opt => opt.value === closestOption.value)

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>

      {/* Selected value display */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? [colors.primary, '#6366F1']
            : [colors.primary, '#4338CA']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.selectedDisplay}
      >
        <View style={styles.selectedIconContainer}>
          <Ionicons
            name={selectedOption?.icon || 'location'}
            size={28}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedValue}>{value} km</Text>
          <Text style={styles.selectedDescription}>
            {selectedOption?.description || 'Search radius'}
          </Text>
        </View>
        <Ionicons name="navigate" size={20} color="rgba(255,255,255,0.7)" />
      </LinearGradient>

      {/* Options grid */}
      <View style={styles.optionsGrid}>
        {DISTANCE_OPTIONS.map((option, index) => {
          const isSelected = closestOption.value === option.value
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.optionWrapper,
                pressed && styles.optionPressed,
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <View
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={isSelected ? colors.primaryForeground : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.optionValue,
                    {
                      color: isSelected ? colors.primaryForeground : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionUnit,
                    {
                      color: isSelected
                        ? 'rgba(255,255,255,0.7)'
                        : colors.textSecondary,
                    },
                  ]}
                >
                  km
                </Text>
                {isSelected && (
                  <View style={styles.selectedCheck}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.primaryForeground}
                    />
                  </View>
                )}
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  selectedDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionWrapper: {
    width: '31%',
    borderRadius: 14,
  },
  optionPressed: {
    transform: [{ scale: 0.96 }],
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  selectedCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
})
