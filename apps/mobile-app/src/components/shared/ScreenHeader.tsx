import { View, Text, TouchableOpacity } from 'react-native'
import type { ReactNode } from 'react'
import { ChevronBackIcon, SearchIcon, FilterIcon } from './icons'
import { colors } from '@/theme/colors'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  rightActions?: ReactNode
}

export function ScreenHeader({
  title,
  subtitle,
  showBackButton = true,
  onBack,
  rightActions,
}: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-background">
      <View className="flex-row items-center flex-1">
        {showBackButton && (
          <TouchableOpacity
            className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-card"
            onPress={onBack}
          >
            <ChevronBackIcon size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text
            className="text-xl font-bold text-white leading-tight"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-[10px] font-bold text-accent uppercase tracking-wide">
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightActions !== null &&
        (rightActions !== undefined ? (
          <View className="flex-row gap-2">{rightActions}</View>
        ) : (
          <View className="flex-row gap-2">
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-card">
              <SearchIcon size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-card">
              <FilterIcon size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        ))}
    </View>
  )
}
