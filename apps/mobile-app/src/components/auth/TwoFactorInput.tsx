import { View, Text, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '@/theme/colors'

interface TwoFactorInputProps {
  code: string
  onChangeText: (text: string) => void
  editable?: boolean
  strategy?: 'totp' | 'email_code'
}

export function TwoFactorInput({
  code,
  onChangeText,
  editable = true,
  strategy = 'totp',
}: TwoFactorInputProps) {
  const { t } = useTranslation()

  const title =
    strategy === 'email_code'
      ? t('auth.twoFactorEmailTitle')
      : t('auth.twoFactorTitle')
  const subtitle =
    strategy === 'email_code'
      ? t('auth.twoFactorEmailSubtitle')
      : t('auth.twoFactorSubtitle')
  const placeholder =
    strategy === 'email_code'
      ? t('auth.enterEmailCode')
      : t('auth.enterTwoFactorCode')

  return (
    <View className="mb-6">
      <Text className="text-white text-lg font-semibold mb-2">{title}</Text>
      <Text className="text-gray-400 mb-4">{subtitle}</Text>
      <TextInput
        className="bg-card border border-border rounded-xl px-4 py-4 text-white text-lg mb-4"
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={code}
        onChangeText={onChangeText}
        keyboardType={strategy === 'email_code' ? 'default' : 'number-pad'}
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
        maxLength={strategy === 'email_code' ? 8 : 6}
      />
    </View>
  )
}
