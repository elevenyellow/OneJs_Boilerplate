/**
 * Date and Repeat Row
 *
 * Horizontal row with calendar picker modal and repeat toggle.
 * Uses react-native-calendars for Expo Go compatibility.
 */

import { useState } from 'react'
import { View, Text, TouchableOpacity, Switch, Modal } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Calendar } from 'react-native-calendars'
import { CalendarOutlineIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'

interface DateRepeatRowProps {
  date: Date
  isRepeat: boolean
  onDateChange: (date: Date) => void
  onRepeatChange: (isRepeat: boolean) => void
}

function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DateRepeatRow({
  date,
  isRepeat,
  onDateChange,
  onRepeatChange,
}: DateRepeatRowProps) {
  const { t } = useTranslation()
  const [showPicker, setShowPicker] = useState(false)

  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const selectedDateString = formatDateToString(date)
  const todayString = formatDateToString(new Date())

  const handleDatePress = () => {
    setShowPicker(true)
  }

  const handleDayPress = (day: { dateString: string }) => {
    const [year, month, dayNum] = day.dateString.split('-').map(Number)
    const newDate = new Date(year, month - 1, dayNum)
    onDateChange(newDate)
    setShowPicker(false)
  }

  const handlePickerDismiss = () => {
    setShowPicker(false)
  }

  return (
    <View className="px-4 mb-6">
      <View className="flex-row gap-3">
        {/* Date Picker Button */}
        <TouchableOpacity
          onPress={handleDatePress}
          className="flex-1 bg-card-elevated rounded-xl px-4 py-3 flex-row items-center border border-border"
          activeOpacity={0.7}
        >
          <CalendarOutlineIcon size={18} color={colors.accent.DEFAULT} />
          <Text className="text-white text-base ml-3">{formattedDate}</Text>
        </TouchableOpacity>

        {/* Repeat Toggle */}
        <View className="bg-card-elevated rounded-xl px-4 py-3 flex-row items-center border border-border">
          <Text className="text-gray-300 text-base mr-3">
            {t('logAscent.isRepeat')}
          </Text>
          <Switch
            value={isRepeat}
            onValueChange={onRepeatChange}
            trackColor={{
              false: colors.border.default,
              true: colors.accent.dark,
            }}
            thumbColor={
              isRepeat ? colors.accent.DEFAULT : colors.text.secondary
            }
          />
        </View>
      </View>

      {/* Calendar Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={handlePickerDismiss}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-center items-center"
          activeOpacity={1}
          onPress={handlePickerDismiss}
        >
          <View
            className="bg-card mx-4 rounded-2xl overflow-hidden"
            onStartShouldSetResponder={() => true}
          >
            <View className="px-4 py-3 border-b border-border">
              <Text className="text-white text-lg font-semibold text-center">
                {t('logAscent.selectDate')}
              </Text>
            </View>

            <Calendar
              current={selectedDateString}
              maxDate={todayString}
              onDayPress={handleDayPress}
              markedDates={{
                [selectedDateString]: {
                  selected: true,
                  selectedColor: colors.accent.DEFAULT,
                },
              }}
              theme={{
                backgroundColor: colors.bg.card,
                calendarBackground: colors.bg.card,
                textSectionTitleColor: colors.text.secondary,
                selectedDayBackgroundColor: colors.accent.DEFAULT,
                selectedDayTextColor: colors.text.primary,
                todayTextColor: colors.accent.DEFAULT,
                dayTextColor: colors.text.primary,
                textDisabledColor: colors.text.muted,
                arrowColor: colors.accent.DEFAULT,
                monthTextColor: colors.text.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
              }}
              style={{
                borderRadius: 12,
                paddingBottom: 10,
              }}
            />

            <TouchableOpacity
              onPress={handlePickerDismiss}
              className="px-4 py-3 border-t border-border"
            >
              <Text className="text-accent font-semibold text-center">
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
