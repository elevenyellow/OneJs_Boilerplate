import { View, Text } from 'react-native'
import { colors } from '@/theme/colors'

interface StatItemProps {
  value: string | number
  label: string
  valueColor?: string
}

export function StatItem({
  value,
  label,
  valueColor = colors.text.primary,
}: StatItemProps) {
  return (
    <View className="items-center flex-1">
      <Text style={{ color: valueColor }} className="text-3xl font-bold">
        {value}
      </Text>
      <Text className="text-gray-400 text-[10px] text-center mt-1 uppercase">
        {label}
      </Text>
    </View>
  )
}
