import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { ChevronBackIcon, ChevronForwardIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import type { SelectedMonth } from './types'

interface MonthYearPickerModalProps {
  visible: boolean
  selectedMonth: SelectedMonth
  onSelect: (month: SelectedMonth) => void
  onClose: () => void
  minYear?: number
  maxYear?: number
}

const MONTH_KEYS = [
  'performance.months.january',
  'performance.months.february',
  'performance.months.march',
  'performance.months.april',
  'performance.months.may',
  'performance.months.june',
  'performance.months.july',
  'performance.months.august',
  'performance.months.september',
  'performance.months.october',
  'performance.months.november',
  'performance.months.december',
]

export function MonthYearPickerModal({
  visible,
  selectedMonth,
  onSelect,
  onClose,
  minYear = 2020,
  maxYear,
}: MonthYearPickerModalProps) {
  const { t } = useTranslation()

  const currentDate = useMemo(() => new Date(), [])
  const currentYear = currentDate.getFullYear()
  const currentMonthIndex = currentDate.getMonth()

  const effectiveMaxYear = maxYear ?? currentYear

  const [pickerYear, setPickerYear] = useState(selectedMonth.year)

  const handlePreviousYear = useCallback(() => {
    if (pickerYear > minYear) {
      setPickerYear((prev) => prev - 1)
    }
  }, [pickerYear, minYear])

  const handleNextYear = useCallback(() => {
    if (pickerYear < effectiveMaxYear) {
      setPickerYear((prev) => prev + 1)
    }
  }, [pickerYear, effectiveMaxYear])

  const handleMonthSelect = useCallback(
    (monthIndex: number) => {
      onSelect({ month: monthIndex, year: pickerYear })
      onClose()
    },
    [pickerYear, onSelect, onClose],
  )

  const isMonthDisabled = useCallback(
    (monthIndex: number): boolean => {
      // Disable future months
      if (pickerYear === currentYear && monthIndex > currentMonthIndex) {
        return true
      }
      return false
    },
    [pickerYear, currentYear, currentMonthIndex],
  )

  const isMonthSelected = useCallback(
    (monthIndex: number): boolean => {
      return (
        selectedMonth.month === monthIndex && selectedMonth.year === pickerYear
      )
    },
    [selectedMonth, pickerYear],
  )

  const canGoBack = pickerYear > minYear
  const canGoForward = pickerYear < effectiveMaxYear

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center"
        onPress={onClose}
      >
        <Pressable
          className="bg-card mx-6 rounded-2xl p-4 w-[85%] max-w-[340px]"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <Text className="text-accent text-xs font-semibold text-center mb-4">
            {t('performance.selectMonth')}
          </Text>

          {/* Year Selector */}
          <View className="flex-row items-center justify-between mb-4 px-2">
            <TouchableOpacity
              onPress={handlePreviousYear}
              disabled={!canGoBack}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronBackIcon
                size={20}
                color={canGoBack ? colors.text.primary : colors.text.muted}
              />
            </TouchableOpacity>

            <Text className="text-white text-xl font-bold">{pickerYear}</Text>

            <TouchableOpacity
              onPress={handleNextYear}
              disabled={!canGoForward}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronForwardIcon
                size={20}
                color={canGoForward ? colors.text.primary : colors.text.muted}
              />
            </TouchableOpacity>
          </View>

          {/* Month Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 280 }}
          >
            <View className="flex-row flex-wrap justify-center">
              {MONTH_KEYS.map((monthKey, index) => {
                const disabled = isMonthDisabled(index)
                const selected = isMonthSelected(index)

                return (
                  <TouchableOpacity
                    key={monthKey}
                    onPress={() => handleMonthSelect(index)}
                    disabled={disabled}
                    className={`w-[30%] m-[1.5%] py-3 rounded-xl items-center ${
                      selected
                        ? 'bg-accent'
                        : disabled
                          ? 'bg-card-elevated/50'
                          : 'bg-card-elevated'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected
                          ? 'text-black'
                          : disabled
                            ? 'text-gray-600'
                            : 'text-white'
                      }`}
                    >
                      {t(`performance.months.short.${index}`)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="mt-4 py-3 rounded-xl bg-surface items-center"
          >
            <Text className="text-gray-400 font-medium">
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
