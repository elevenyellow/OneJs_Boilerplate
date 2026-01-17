import { View, Text } from 'react-native'

interface AuthErrorBannerProps {
  error: string | null
}

export function AuthErrorBanner({ error }: AuthErrorBannerProps) {
  if (!error) return null

  return (
    <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
      <Text className="text-red-400 text-sm">{error}</Text>
    </View>
  )
}
