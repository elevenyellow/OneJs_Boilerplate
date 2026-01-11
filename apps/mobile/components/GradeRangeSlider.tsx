import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useColorScheme } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '@/constants/Colors'

interface GradeRangeSliderProps {
  label: string
  minValue: string
  maxValue: string
  onChange: (min: string, max: string) => void
}

// Simplified grade list for UI
const GRADE_OPTIONS = [
  '4a',
  '4c',
  '5a',
  '5b',
  '5c',
  '6a',
  '6a+',
  '6b',
  '6b+',
  '6c',
  '6c+',
  '7a',
  '7a+',
  '7b',
  '7b+',
  '7c',
  '7c+',
  '8a',
  '8a+',
  '8b',
]

// Grade difficulty color mapping
const getGradeColor = (index: number, colorScheme: 'light' | 'dark') => {
  const totalGrades = GRADE_OPTIONS.length
  const ratio = index / totalGrades
  
  if (ratio < 0.25) return colorScheme === 'dark' ? '#34D399' : '#10B981' // Emerald - Easy
  if (ratio < 0.5) return colorScheme === 'dark' ? '#FBBF24' : '#F59E0B'  // Amber - Moderate
  if (ratio < 0.75) return colorScheme === 'dark' ? '#FB923C' : '#F97316' // Orange - Hard
  return colorScheme === 'dark' ? '#F87171' : '#EF4444' // Red - Very Hard
}

export function GradeRangeSlider({
  label,
  minValue,
  maxValue,
  onChange,
}: GradeRangeSliderProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const [selectingMin, setSelectingMin] = useState(true)

  const minIndex = GRADE_OPTIONS.indexOf(minValue)
  const maxIndex = GRADE_OPTIONS.indexOf(maxValue)

  const handleGradeSelect = (grade: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (selectingMin) {
      // If selected min is greater than current max, adjust max too
      if (index > maxIndex && maxIndex !== -1) {
        onChange(grade, grade)
      } else {
        onChange(grade, maxValue)
      }
      setSelectingMin(false)
    } else {
      // If selected max is less than current min, adjust min too
      if (index < minIndex && minIndex !== -1) {
        onChange(grade, grade)
      } else {
        onChange(minValue, grade)
      }
      setSelectingMin(true)
    }
  }

  const isInRange = (index: number) => {
    const min = minIndex !== -1 ? minIndex : 0
    const max = maxIndex !== -1 ? maxIndex : GRADE_OPTIONS.length - 1
    return index >= min && index <= max
  }

  const minColor = getGradeColor(minIndex !== -1 ? minIndex : 0, colorScheme)
  const maxColor = getGradeColor(maxIndex !== -1 ? maxIndex : GRADE_OPTIONS.length - 1, colorScheme)

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>

      {/* Range display with gradient */}
      <View style={styles.rangeDisplay}>
        <LinearGradient
          colors={[minColor, maxColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rangeGradient}
        >
          <View style={styles.rangeBadge}>
            <Ionicons name="arrow-down" size={14} color="#FFF" />
            <Text style={styles.rangeBadgeText}>{minValue}</Text>
          </View>
          <View style={styles.rangeConnector}>
            <View style={styles.connectorLine} />
          </View>
          <View style={styles.rangeBadge}>
            <Ionicons name="arrow-up" size={14} color="#FFF" />
            <Text style={styles.rangeBadgeText}>{maxValue}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Selection hint */}
      <View style={styles.hintContainer}>
        <View
          style={[
            styles.hintIndicator,
            {
              backgroundColor: selectingMin ? minColor : maxColor,
            },
          ]}
        />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {selectingMin ? 'Tap to select minimum' : 'Tap to select maximum'}
        </Text>
      </View>

      {/* Grade chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gradesContainer}
      >
        {GRADE_OPTIONS.map((grade, index) => {
          const inRange = isInRange(index)
          const isMin = grade === minValue
          const isMax = grade === maxValue
          const gradeColor = getGradeColor(index, colorScheme)

          return (
            <Pressable
              key={grade}
              style={({ pressed }) => [
                styles.gradeChipWrapper,
                pressed && styles.gradeChipPressed,
              ]}
              onPress={() => handleGradeSelect(grade, index)}
            >
              <View
                style={[
                  styles.gradeChip,
                  {
                    backgroundColor: inRange ? gradeColor : colors.muted,
                    borderColor: isMin || isMax ? colors.text : 'transparent',
                    borderWidth: isMin || isMax ? 2.5 : 0,
                  },
                ]}
              >
                {(isMin || isMax) && (
                  <View style={styles.endpointMarker}>
                    <Ionicons
                      name={isMin ? 'arrow-down' : 'arrow-up'}
                      size={10}
                      color={inRange ? '#FFF' : colors.text}
                    />
                  </View>
                )}
                <Text
                  style={[
                    styles.gradeText,
                    {
                      color: inRange ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isMin || isMax ? '800' : '600',
                    },
                  ]}
                >
                  {grade}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Difficulty legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getGradeColor(0, colorScheme) }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Easy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getGradeColor(5, colorScheme) }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getGradeColor(12, colorScheme) }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hard</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getGradeColor(18, colorScheme) }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Very hard</Text>
        </View>
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
  rangeDisplay: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rangeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  rangeBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rangeConnector: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  connectorLine: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  hintIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  gradesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  gradeChipWrapper: {
    borderRadius: 14,
  },
  gradeChipPressed: {
    transform: [{ scale: 0.94 }],
  },
  gradeChip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endpointMarker: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  gradeText: {
    fontSize: 14,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
})
