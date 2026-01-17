import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { haptics } from '@/services/haptics'
import type { FilterOption } from '@/types/ui'

interface FilterChipsProps {
  options: FilterOption[]
  selectedId: string
  onSelect: (id: string) => void
  scrollable?: boolean
}

export function FilterChips({
  options,
  selectedId,
  onSelect,
  scrollable = true,
}: FilterChipsProps) {
  const content = (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const isSelected = selectedId === option.id
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              haptics.selection()
              onSelect(option.id)
            }}
            className={`flex-row items-center px-4 py-2 rounded-full border ${
              isSelected
                ? 'bg-accent/20 border-accent'
                : 'bg-card border-gray-700'
            }`}
          >
            {option.color && (
              <View
                className="w-2.5 h-2.5 rounded-full mr-2"
                style={{ backgroundColor: option.color }}
              />
            )}
            <Text
              className={`text-sm font-medium ${
                isSelected ? 'text-accent' : 'text-gray-300'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {content}
      </ScrollView>
    )
  }

  return <View className="px-4">{content}</View>
}
