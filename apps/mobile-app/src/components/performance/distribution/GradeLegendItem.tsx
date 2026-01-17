import { View, Text } from 'react-native'

interface GradeLegendItemProps {
  color: string
  label: string
}

export function GradeLegendItem({ color, label }: GradeLegendItemProps) {
  return (
    <View className="items-center flex-1">
      <View
        style={{ backgroundColor: color }}
        className="w-3 h-3 rounded-full mb-1"
      />
      <Text className="text-gray-500 text-xs">{label}</Text>
    </View>
  )
}
