import { View, Text, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

interface AuthEmailInputProps {
  value: string
  onChangeText: (text: string) => void
  editable?: boolean
}

export function AuthEmailInput({
  value,
  onChangeText,
  editable = true,
}: AuthEmailInputProps) {
  const { t } = useTranslation()

  return (
    <View className="mb-4">
      <Text className="text-gray-400 text-sm mb-2">{t('auth.email')}</Text>
      <View className="flex-row items-center bg-card border border-border rounded-xl px-4">
        <Ionicons
          name="mail-outline"
          size={20}
          color={colors.text.muted}
          style={{ marginRight: 12 }}
        />
        <TextInput
          className="flex-1 py-4 text-white text-base"
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor={colors.text.muted}
          value={value}
          onChangeText={onChangeText}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
        />
      </View>
    </View>
  )
}
