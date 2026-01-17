import { View, Text } from 'react-native'

interface GradeBarProps {
  count: number
  maxCount: number
  color: string
}

export function GradeBar({ count, maxCount, color }: GradeBarProps) {
  const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0

  return (
    <View className="items-center flex-1">
      <Text className="text-white text-xs font-bold mb-1">{count}</Text>
      <View
        style={{
          backgroundColor: color,
          height: Math.max(heightPercent, 8),
        }}
        className="w-10 rounded-t-md"
      />
    </View>
  )
}
