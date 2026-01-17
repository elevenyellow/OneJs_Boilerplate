import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '@/theme/colors'

interface AuthSubmitButtonProps {
  onPress: () => void
  isLoading: boolean
  disabled: boolean
  isSignUp: boolean
  pendingVerification: boolean
  needsSecondFactor: boolean
}

export function AuthSubmitButton({
  onPress,
  isLoading,
  disabled,
  isSignUp,
  pendingVerification,
  needsSecondFactor,
}: AuthSubmitButtonProps) {
  const { t } = useTranslation()

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`bg-accent rounded-xl py-4 flex-row items-center justify-center mb-6 ${
        disabled ? 'opacity-50' : ''
      }`}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : (
        <Text className="text-white text-lg font-semibold">
          {needsSecondFactor
            ? t('auth.verify')
            : pendingVerification
              ? t('auth.verify')
              : isSignUp
                ? t('auth.signUp')
                : t('auth.signIn')}
        </Text>
      )}
    </TouchableOpacity>
  )
}
