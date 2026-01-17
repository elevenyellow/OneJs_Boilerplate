/**
 * Setting Input
 *
 * A setting row with text input for string preferences.
 */

import { useState, useCallback } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { SettingRow } from './SettingRow'
import { colors } from '@/theme/colors'
import { haptics } from '@/services/haptics'
import type { ReactNode } from 'react'

interface SettingInputProps {
  /**
   * Setting label
   */
  label: string

  /**
   * Optional description text
   */
  description?: string

  /**
   * Current value
   */
  value: string

  /**
   * Handler for value changes
   */
  onValueChange: (value: string) => void

  /**
   * Placeholder text for empty input
   */
  placeholder?: string

  /**
   * Modal title
   */
  modalTitle?: string

  /**
   * Keyboard type for the input
   */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'

  /**
   * Whether to mask the input (password-style)
   */
  secureTextEntry?: boolean

  /**
   * Maximum character length
   */
  maxLength?: number

  /**
   * Icon to display on the left
   */
  leftIcon?: ReactNode

  /**
   * Whether this is the last row in a section
   */
  isLast?: boolean

  /**
   * Whether the input is disabled
   */
  disabled?: boolean

  /**
   * Text to show when value is empty
   */
  emptyText?: string
}

export function SettingInput({
  label,
  description,
  value,
  onValueChange,
  placeholder = '',
  modalTitle,
  keyboardType = 'default',
  secureTextEntry = false,
  maxLength,
  leftIcon,
  isLast = false,
  disabled = false,
  emptyText,
}: SettingInputProps) {
  const { t } = useTranslation()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  const displayEmptyText = emptyText ?? t('settings.safety.notSet')

  const handleOpen = useCallback(() => {
    haptics.light()
    setInputValue(value)
    setIsModalVisible(true)
  }, [value])

  const handleClose = useCallback(() => {
    setIsModalVisible(false)
  }, [])

  const handleSave = useCallback(() => {
    haptics.light()
    onValueChange(inputValue)
    setIsModalVisible(false)
  }, [inputValue, onValueChange])

  const displayValue = value || displayEmptyText

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
          <Text
            className={`text-base ${value ? 'text-gray-300' : 'text-gray-500'}`}
            numberOfLines={1}
          >
            {displayValue}
          </Text>
        }
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-surface"
        >
          {/* Header - more compact with pill indicator */}
          <View className="items-center pt-2 pb-3">
            <View className="w-10 h-1 bg-border rounded-full mb-3" />
            <Text className="text-lg font-semibold text-white">
              {modalTitle ?? label}
            </Text>
          </View>

          {/* Input */}
          <View className="px-5 mt-4 flex-1">
            <Text className="text-sm text-gray-400 mb-2 uppercase tracking-wide">
              {label}
            </Text>
            <View className="bg-card rounded-xl px-4 py-3 border border-border-muted">
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={placeholder}
                placeholderTextColor={colors.text.muted}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                maxLength={maxLength}
                autoFocus
                className="text-white text-base"
                style={{ minHeight: 24 }}
              />
            </View>
            {description && (
              <Text className="text-sm text-gray-400 mt-2 px-1">
                {description}
              </Text>
            )}
          </View>

          {/* Action buttons at bottom */}
          <View className="px-5 pb-8 pt-2 bg-surface border-t border-border-muted flex-row gap-3">
            <TouchableOpacity
              onPress={handleClose}
              className="flex-1 bg-card rounded-xl py-3.5 items-center border border-border"
              activeOpacity={0.8}
            >
              <Text className="text-gray-300 text-base font-medium">
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-accent rounded-xl py-3.5 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}
