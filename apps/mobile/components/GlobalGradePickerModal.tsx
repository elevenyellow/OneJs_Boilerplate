import { Colors } from '@/constants/Colors'
import { useFilters } from '@/contexts/FiltersContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import React, { useState, useEffect } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'

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

  if (ratio < 0.25) return colorScheme === 'dark' ? '#34D399' : '#10B981'
  if (ratio < 0.5) return colorScheme === 'dark' ? '#FBBF24' : '#F59E0B'
  if (ratio < 0.75) return colorScheme === 'dark' ? '#FB923C' : '#F97316'
  return colorScheme === 'dark' ? '#F87171' : '#EF4444'
}

/**
 * Global modal for changing grade range from anywhere in the app
 * Integrates with FiltersContext
 */
export function GlobalGradePickerModal() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  
  const { 
    gradeRange, 
    setGradeRange, 
    isGradePickerVisible, 
    hideGradePicker 
  } = useFilters()

  // Local state for selection before applying
  const [localMin, setLocalMin] = useState(gradeRange.min)
  const [localMax, setLocalMax] = useState(gradeRange.max)
  const [selectingMin, setSelectingMin] = useState(true)

  // Sync local state when modal opens
  useEffect(() => {
    if (isGradePickerVisible) {
      setLocalMin(gradeRange.min)
      setLocalMax(gradeRange.max)
      setSelectingMin(true)
    }
  }, [isGradePickerVisible, gradeRange])

  const minIndex = GRADE_OPTIONS.indexOf(localMin)
  const maxIndex = GRADE_OPTIONS.indexOf(localMax)

  const handleGradeSelect = (grade: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (selectingMin) {
      setLocalMin(grade)
      // If selected min is greater than current max, adjust max
      if (index > maxIndex && maxIndex !== -1) {
        setLocalMax(grade)
      }
      setSelectingMin(false)
    } else {
      setLocalMax(grade)
      // If selected max is less than current min, adjust min
      if (index < minIndex && minIndex !== -1) {
        setLocalMin(grade)
      }
      setSelectingMin(true)
    }
  }

  const isInRange = (index: number) => {
    const min = minIndex !== -1 ? minIndex : 0
    const max = maxIndex !== -1 ? maxIndex : GRADE_OPTIONS.length - 1
    return index >= min && index <= max
  }

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setGradeRange({ min: localMin, max: localMax })
    hideGradePicker()
  }

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    hideGradePicker()
  }

  const minColor = getGradeColor(minIndex !== -1 ? minIndex : 0, colorScheme)
  const maxColor = getGradeColor(
    maxIndex !== -1 ? maxIndex : GRADE_OPTIONS.length - 1,
    colorScheme
  )

  return (
    <Modal
      visible={isGradePickerVisible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Your Grade Range
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Routes in this range will be highlighted
            </Text>
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
                <Text style={styles.rangeBadgeText}>{localMin}</Text>
              </View>
              <View style={styles.rangeConnector}>
                <View style={styles.connectorLine} />
              </View>
              <View style={styles.rangeBadge}>
                <Ionicons name="arrow-up" size={14} color="#FFF" />
                <Text style={styles.rangeBadgeText}>{localMax}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Selection hint */}
          <View style={styles.hintContainer}>
            <View
              style={[
                styles.hintIndicator,
                { backgroundColor: selectingMin ? minColor : maxColor },
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
              const isMin = grade === localMin
              const isMax = grade === localMax
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

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
