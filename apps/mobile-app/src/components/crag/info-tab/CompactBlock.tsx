import { View, Text, TouchableOpacity } from 'react-native'
import { colors } from '@/theme/colors'

interface CompactBlockProps {
  icon: React.ReactNode
  value: string | number
  label: string
  onPress?: () => void
}

export function CompactBlock({ icon, value, label, onPress }: CompactBlockProps) {
  const content = (
    <View className="bg-card border border-border-muted rounded-lg py-3 items-center justify-center flex-1">
      <View className="items-center justify-center mb-1.5">{icon}</View>
      <Text className="text-white text-xs font-bold text-center px-1">
        {value}
      </Text>
      {label && (
        <Text className="text-gray-500 text-[8px] uppercase tracking-wide mt-0.5 text-center px-1">
          {label}
        </Text>
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-1"
      >
        {content}
      </TouchableOpacity>
    )
  }

  return <View className="flex-1">{content}</View>
}
