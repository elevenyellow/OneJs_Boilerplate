import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { AuthEmailInput } from './AuthEmailInput'

interface ForgotPasswordFlowProps {
  email: string
  onEmailChange: (text: string) => void
  resetCode: string
  onResetCodeChange: (text: string) => void
  newPassword: string
  onNewPasswordChange: (text: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (text: string) => void
  showPassword: boolean
  onToggleShowPassword: () => void
  resetPasswordSent: boolean
  isLoading: boolean
  onBack: () => void
  onSendResetCode: () => void
  onResetPassword: () => void
}

export function ForgotPasswordFlow({
  email,
  onEmailChange,
  resetCode,
  onResetCodeChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  showPassword,
  onToggleShowPassword,
  resetPasswordSent,
  isLoading,
  onBack,
  onSendResetCode,
  onResetPassword,
}: ForgotPasswordFlowProps) {
  const { t } = useTranslation()

  return (
    <View className="mb-6">
      <TouchableOpacity
        onPress={onBack}
        className="mb-4 flex-row items-center"
        activeOpacity={0.7}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={colors.text.secondary}
          style={{ marginRight: 8 }}
        />
        <Text className="text-gray-400 text-sm">{t('auth.backToSignIn')}</Text>
      </TouchableOpacity>

      <Text className="text-white text-2xl font-bold mb-2">
        {t('auth.resetPasswordTitle')}
      </Text>
      <Text className="text-gray-400 mb-6">
        {resetPasswordSent
          ? t('auth.resetCodeSent', { email })
          : t('auth.resetPasswordSubtitle')}
      </Text>

      {!resetPasswordSent ? (
        <>
          <AuthEmailInput
            value={email}
            onChangeText={onEmailChange}
            editable={!isLoading}
          />

          <TouchableOpacity
            onPress={onSendResetCode}
            disabled={isLoading || !email}
            className={`bg-accent rounded-xl py-4 flex-row items-center justify-center mb-6 ${
              isLoading || !email ? 'opacity-50' : ''
            }`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text className="text-white text-lg font-semibold">
                {t('auth.resetPassword')}
              </Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-2">
              {t('auth.enterResetCode')}
            </Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-4 text-white text-lg"
              placeholder={t('auth.enterResetCode')}
              placeholderTextColor={colors.text.muted}
              value={resetCode}
              onChangeText={onResetCodeChange}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-2">
              {t('auth.newPassword')}
            </Text>
            <View className="flex-row items-center bg-card border border-border rounded-xl px-4">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.text.muted}
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 py-4 text-white text-base"
                placeholder={t('auth.newPassword')}
                placeholderTextColor={colors.text.muted}
                value={newPassword}
                onChangeText={onNewPasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={onToggleShowPassword}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">
              {t('auth.confirmPassword')}
            </Text>
            <View className="flex-row items-center bg-card border border-border rounded-xl px-4">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.text.muted}
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 py-4 text-white text-base"
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor={colors.text.muted}
                value={confirmPassword}
                onChangeText={onConfirmPasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={onResetPassword}
            disabled={
              isLoading || !resetCode || !newPassword || !confirmPassword
            }
            className={`bg-accent rounded-xl py-4 flex-row items-center justify-center mb-6 ${
              isLoading || !resetCode || !newPassword || !confirmPassword
                ? 'opacity-50'
                : ''
            }`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text className="text-white text-lg font-semibold">
                {t('auth.resetPassword')}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}
