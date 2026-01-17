import {
  View,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native'
import {
  useCallback,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

interface SearchInputProps extends Omit<TextInputProps, 'onChange'> {
  /** Current search value */
  value: string
  /** Callback when value changes */
  onChangeText: (text: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether to autofocus the input */
  autoFocus?: boolean
  /** Callback when clear button is pressed */
  onClear?: () => void
  /** Callback when submit/search is triggered */
  onSubmit?: () => void
}

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChangeText,
      placeholder = 'Search...',
      autoFocus = false,
      onClear,
      onSubmit,
      ...textInputProps
    },
    ref,
  ) {
    const inputRef = useRef<TextInput>(null)

    // Expose focus method to parent via ref
    useImperativeHandle(ref, () => inputRef.current as TextInput, [])

    // Handle autofocus with slight delay for smooth animation
    useEffect(() => {
      if (autoFocus) {
        const timer = setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
      }
    }, [autoFocus])

    const handleClear = useCallback(() => {
      onChangeText('')
      onClear?.()
      inputRef.current?.focus()
    }, [onChangeText, onClear])

    const showClearButton = value.length > 0

    return (
      <View className="flex-1 flex-row items-center bg-card rounded-xl px-3 h-11">
        {/* Search icon */}
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.text.muted}
          style={{ marginRight: 8 }}
        />

        {/* Text input */}
        <TextInput
          ref={inputRef}
          className="flex-1 text-white text-base"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          {...textInputProps}
        />

        {/* Clear button */}
        {showClearButton && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="ml-2"
          >
            <Ionicons name="close-circle" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>
    )
  },
)
