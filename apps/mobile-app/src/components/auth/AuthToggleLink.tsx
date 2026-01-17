import { TouchableOpacity, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

interface AuthToggleLinkProps {
  isSignUp: boolean
  onPress: () => void
  disabled?: boolean
}

export function AuthToggleLink({
  isSignUp,
  onPress,
  disabled = false,
}: AuthToggleLinkProps) {
  const { t } = useTranslation()

  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center py-4"
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text className="text-white text-center">
        {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}{' '}
        <Text className="text-accent font-semibold">
          {isSignUp ? t('auth.signIn') : t('auth.register')}
        </Text>
      </Text>
    </TouchableOpacity>
  )
}
