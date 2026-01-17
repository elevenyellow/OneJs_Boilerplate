import { View, Text, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '@/theme/colors'

interface VerificationCodeInputProps {
  code: string
  onChangeText: (text: string) => void
  email: string
  editable?: boolean
}

export function VerificationCodeInput({
  code,
  onChangeText,
  email,
  editable = true,
}: VerificationCodeInputProps) {
  const { t } = useTranslation()

  return (
    <View className="mb-6">
      <Text className="text-white text-lg font-semibold mb-2">
        {t('auth.verifyEmail')}
      </Text>
      <Text className="text-gray-400 mb-4">
        {t('auth.verificationCodeSent', { email })}
      </Text>
      <TextInput
        className="bg-card border border-border rounded-xl px-4 py-4 text-white text-lg mb-4"
        placeholder={t('auth.enterVerificationCode')}
        placeholderTextColor={colors.text.muted}
        value={code}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
      />
    </View>
  )
}
