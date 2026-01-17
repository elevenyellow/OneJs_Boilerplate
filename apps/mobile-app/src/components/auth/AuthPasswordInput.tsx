import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

interface AuthPasswordInputProps {
  value: string
  onChangeText: (text: string) => void
  showPassword: boolean
  onToggleShowPassword: () => void
  editable?: boolean
  showForgotPassword?: boolean
  onForgotPassword?: () => void
}

export function AuthPasswordInput({
  value,
  onChangeText,
  showPassword,
  onToggleShowPassword,
  editable = true,
  showForgotPassword = false,
  onForgotPassword,
}: AuthPasswordInputProps) {
  const { t } = useTranslation()

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-400 text-sm">{t('auth.password')}</Text>
        {showForgotPassword && onForgotPassword && (
          <TouchableOpacity onPress={onForgotPassword} activeOpacity={0.7}>
            <Text className="text-accent text-sm">
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="flex-row items-center bg-card border border-border rounded-xl px-4">
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={colors.text.muted}
          style={{ marginRight: 12 }}
        />
        <TextInput
          className="flex-1 py-4 text-white text-base"
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor={colors.text.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
        />
        <TouchableOpacity onPress={onToggleShowPassword} activeOpacity={0.7}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.text.muted}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}
