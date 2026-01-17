/**
 * Grade Evaluation Chips
 *
 * Single-select chips for grade evaluation: Soft, Normal, Hard
 * Each option has a distinct color and icon to indicate the evaluation.
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import type { GradeEvaluation } from './types'

interface GradeEvaluationChipsProps {
  value: GradeEvaluation
  onValueChange: (value: GradeEvaluation) => void
}

const GRADE_EVALUATIONS: {
  id: GradeEvaluation
  color: string
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { id: 'soft', color: colors.grade.easy, icon: 'chevron-down-outline' },
  { id: 'normal', color: colors.text.secondary, icon: 'remove-outline' },
  { id: 'hard', color: colors.grade.hard, icon: 'chevron-up-outline' },
]

export function GradeEvaluationChips({
  value,
  onValueChange,
}: GradeEvaluationChipsProps) {
  const { t } = useTranslation()

  return (
    <View className="px-4 mb-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        {t('logAscent.sections.gradeEvaluation')}
      </Text>
      <View className="flex-row bg-card-elevated rounded-xl overflow-hidden border border-border">
        {GRADE_EVALUATIONS.map((evaluation, index) => {
          const isSelected = value === evaluation.id
          const isLast = index === GRADE_EVALUATIONS.length - 1
          return (
            <TouchableOpacity
              key={evaluation.id}
              onPress={() => onValueChange(evaluation.id)}
              className={`flex-1 flex-row py-3 items-center justify-center ${
                isSelected ? 'bg-card' : ''
              } ${!isLast ? 'border-r border-border' : ''}`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={evaluation.icon}
                size={18}
                color={isSelected ? evaluation.color : colors.text.muted}
              />
              <Text
                className="text-sm font-medium capitalize ml-1"
                style={{
                  color: isSelected ? evaluation.color : colors.text.muted,
                }}
              >
                {t(`logAscent.gradeEvaluations.${evaluation.id}`)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
