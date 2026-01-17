import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

interface AuthHeaderProps {
  isSignUp: boolean
}

export function AuthHeader({ isSignUp }: AuthHeaderProps) {
  const { t } = useTranslation()

  return (
    <View className="items-center mb-8">
      <View
        className="bg-accent rounded-2xl mb-6 items-center justify-center"
        style={{ width: 80, height: 80 }}
      >
        <Ionicons name="layers" size={48} color={colors.text.primary} />
      </View>

      <Text className="text-white text-3xl font-bold mb-2 text-center">
        {t('auth.welcome')}
      </Text>

      <Text className="text-gray-400 text-center text-base px-4">
        {isSignUp ? t('auth.createAccount') : t('auth.welcomeSubtitle')}
      </Text>
    </View>
  )
}
