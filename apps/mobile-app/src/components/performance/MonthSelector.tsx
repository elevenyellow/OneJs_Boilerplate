import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ChevronBackIcon, ChevronForwardIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'

interface MonthSelectorProps {
  monthLabel: string
  year: number
  onPrevious: () => void
  onNext: () => void
  onMonthPress: () => void
  canGoNext?: boolean
}

export function MonthSelector({
  monthLabel,
  year,
  onPrevious,
  onNext,
  onMonthPress,
  canGoNext = true,
}: MonthSelectorProps) {
  const { t } = useTranslation()

  return (
    <View className="bg-card rounded-2xl mx-4 mt-4 py-3 px-4">
      <Text className="text-accent text-xs font-semibold text-center mb-1">
        {t('performance.selectMonth')}
      </Text>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={onPrevious}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronBackIcon size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMonthPress}
          className="py-1 px-3 rounded-lg active:bg-surface"
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Text className="text-white text-lg font-bold">
            {monthLabel.toUpperCase()} {year}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={!canGoNext}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronForwardIcon
            size={20}
            color={canGoNext ? colors.text.primary : colors.text.muted}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}
