/**
 * Comments Input
 *
 * Text area for adding beta, conditions, or thoughts about the ascent.
 */

import { View, Text, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '@/theme/colors'

interface CommentsInputProps {
  value: string
  onValueChange: (value: string) => void
}

export function CommentsInput({ value, onValueChange }: CommentsInputProps) {
  const { t } = useTranslation()

  return (
    <View className="px-4 mb-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        {t('logAscent.sections.comments')}
      </Text>
      <View className="bg-card-elevated rounded-xl border border-border overflow-hidden">
        <TextInput
          value={value}
          onChangeText={onValueChange}
          placeholder={t('logAscent.commentsPlaceholder')}
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="text-white text-base p-4 min-h-[120px]"
          style={{ color: colors.text.primary }}
        />
      </View>
    </View>
  )
}
