/**
 * Setting Select
 *
 * A setting row that displays current value and opens a selection modal on press.
 */

import { useState, useCallback } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native'
import { SettingRow } from './SettingRow'
import { haptics } from '@/services/haptics'
import type { ReactNode } from 'react'

export interface SelectOption<T extends string> {
  id: T
  label: string
  description?: string
}

interface SettingSelectProps<T extends string> {
  /**
   * Setting label
   */
  label: string

  /**
   * Optional description text
   */
  description?: string

  /**
   * Current selected value
   */
  value: T

  /**
   * Available options
   */
  options: SelectOption<T>[]

  /**
   * Handler for value changes
   */
  onValueChange: (value: T) => void

  /**
   * Modal title
   */
  modalTitle?: string

  /**
   * Icon to display on the left
   */
  leftIcon?: ReactNode

  /**
   * Whether this is the last row in a section
   */
  isLast?: boolean

  /**
   * Whether the select is disabled
   */
  disabled?: boolean
}

export function SettingSelect<T extends string>({
  label,
  description,
  value,
  options,
  onValueChange,
  modalTitle,
  leftIcon,
  isLast = false,
  disabled = false,
}: SettingSelectProps<T>) {
  const [isModalVisible, setIsModalVisible] = useState(false)

  const selectedOption = options.find((opt) => opt.id === value)

  const handleOpen = useCallback(() => {
    haptics.light()
    setIsModalVisible(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsModalVisible(false)
  }, [])

  const handleSelect = useCallback(
    (optionId: T) => {
      haptics.light()
      onValueChange(optionId)
      setIsModalVisible(false)
    },
    [onValueChange],
  )

  return (
    <>
      <SettingRow
        label={label}
        description={description}
        leftIcon={leftIcon}
        isLast={isLast}
        disabled={disabled}
        onPress={handleOpen}
        showChevron
        rightContent={
          <Text className="text-gray-300 text-base">
            {selectedOption?.label ?? value}
          </Text>
        }
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View className="flex-1 bg-surface">
          {/* Header - more compact with pill indicator */}
          <View className="items-center pt-2 pb-3">
            <View className="w-10 h-1 bg-border rounded-full mb-3" />
            <Text className="text-lg font-semibold text-white">
              {modalTitle ?? label}
            </Text>
          </View>

          {/* Options - full width, no card wrapper for cleaner look */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {options.map((option, index) => {
              const isSelected = option.id === value
              const isLastOption = index === options.length - 1

              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelect(option.id)}
                  className={`flex-row items-center px-5 py-4 ${
                    !isLastOption ? 'border-b border-border-muted' : ''
                  } ${isSelected ? 'bg-accent/10' : ''}`}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  {/* Radio indicator */}
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-4 items-center justify-center ${
                      isSelected ? 'border-accent bg-accent' : 'border-border'
                    }`}
                  >
                    {isSelected && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`text-base ${
                        isSelected ? 'text-white font-medium' : 'text-gray-300'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {option.description && (
                      <Text className="text-sm text-gray-400 mt-0.5">
                        {option.description}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </ScrollView>

          {/* Done button at bottom */}
          <View className="px-4 pb-8 pt-2 bg-surface border-t border-border-muted">
            <TouchableOpacity
              onPress={handleClose}
              className="bg-accent rounded-xl py-3.5 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}
