/**
 * Setting Slider
 *
 * A setting row with a slider for numeric preferences.
 *
 * Uses PanResponder with refs to track gesture state properly.
 * The key insight: gestureState.dx is cumulative from gesture start,
 * so we store the starting position and compute newPosition = startPosition + dx.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native'
import { colors } from '@/theme/colors'

interface SettingSliderProps {
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
  value: number

  /**
   * Minimum value
   */
  minimumValue: number

  /**
   * Maximum value
   */
  maximumValue: number

  /**
   * Step increment
   */
  step?: number

  /**
   * Handler for value changes (called on slide complete)
   */
  onValueChange: (value: number) => void

  /**
   * Format function for displaying the value
   */
  formatValue?: (value: number) => string

  /**
   * Whether this is the last row in a section
   */
  isLast?: boolean

  /**
   * Whether the slider is disabled
   */
  disabled?: boolean

  /**
   * Unit label to show after the value
   */
  unit?: string

  /**
   * Callback to disable parent scroll during sliding
   */
  onSlidingStart?: () => void

  /**
   * Callback to re-enable parent scroll after sliding
   */
  onSlidingEnd?: () => void
}

export function SettingSlider({
  label,
  description,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  formatValue,
  isLast = false,
  disabled = false,
  unit = '',
  onSlidingStart,
  onSlidingEnd,
}: SettingSliderProps) {
  // Local value for display and tracking
  const [localValue, setLocalValue] = useState(value)
  const [isSliding, setIsSliding] = useState(false)
  const [trackWidth, setTrackWidth] = useState(0)
  const trackRef = useRef<View>(null)

  // Refs for PanResponder to access current values
  const localValueRef = useRef(localValue)
  const trackWidthRef = useRef(trackWidth)
  const startPositionRef = useRef(0)

  // Keep refs in sync
  useEffect(() => {
    localValueRef.current = localValue
  }, [localValue])

  useEffect(() => {
    trackWidthRef.current = trackWidth
  }, [trackWidth])

  // Sync from prop only when not sliding and value actually changed externally
  const lastExternalValue = useRef(value)
  useEffect(() => {
    if (!isSliding && value !== lastExternalValue.current) {
      lastExternalValue.current = value
      setLocalValue(value)
    }
  }, [value, isSliding])

  // Calculate position from value (uses refs for PanResponder)
  const getPositionFromValue = useCallback(
    (val: number, width: number) => {
      const range = maximumValue - minimumValue
      if (range === 0) return 0
      return ((val - minimumValue) / range) * width
    },
    [minimumValue, maximumValue],
  )

  // Calculate value from position (uses refs for PanResponder)
  const getValueFromPosition = useCallback(
    (position: number, width: number) => {
      if (width === 0) return minimumValue
      const ratio = Math.max(0, Math.min(1, position / width))
      const rawValue = minimumValue + ratio * (maximumValue - minimumValue)
      // Round to step
      const stepped = Math.round(rawValue / step) * step
      return Math.max(minimumValue, Math.min(maximumValue, stepped))
    },
    [minimumValue, maximumValue, step],
  )

  // Pan responder for thumb dragging - recreate when dependencies change
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (
          _: GestureResponderEvent,
          __: PanResponderGestureState,
        ) => {
          // Store starting position based on current value
          startPositionRef.current = getPositionFromValue(
            localValueRef.current,
            trackWidthRef.current,
          )
          setIsSliding(true)
          onSlidingStart?.()
        },
        onPanResponderMove: (
          _: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ) => {
          // Calculate new position: start + cumulative dx
          const newPosition = startPositionRef.current + gestureState.dx
          const newValue = getValueFromPosition(
            newPosition,
            trackWidthRef.current,
          )
          localValueRef.current = newValue
          setLocalValue(newValue)
        },
        onPanResponderRelease: () => {
          setIsSliding(false)
          lastExternalValue.current = localValueRef.current
          onValueChange(localValueRef.current)
          onSlidingEnd?.()
        },
        onPanResponderTerminate: () => {
          setIsSliding(false)
          onSlidingEnd?.()
        },
      }),
    [
      disabled,
      getPositionFromValue,
      getValueFromPosition,
      onSlidingStart,
      onSlidingEnd,
      onValueChange,
    ],
  )

  // Handle track tap to set value directly
  const handleTrackPress = useCallback(
    (event: { nativeEvent: { locationX: number } }) => {
      if (disabled) return
      const newValue = getValueFromPosition(
        event.nativeEvent.locationX,
        trackWidth,
      )
      setLocalValue(newValue)
      lastExternalValue.current = newValue
      onValueChange(newValue)
    },
    [disabled, getValueFromPosition, onValueChange, trackWidth],
  )

  // Decrement/increment with buttons
  const handleDecrement = useCallback(() => {
    if (disabled) return
    const newValue = Math.max(minimumValue, localValue - step)
    setLocalValue(newValue)
    lastExternalValue.current = newValue
    onValueChange(newValue)
  }, [disabled, localValue, minimumValue, step, onValueChange])

  const handleIncrement = useCallback(() => {
    if (disabled) return
    const newValue = Math.min(maximumValue, localValue + step)
    setLocalValue(newValue)
    lastExternalValue.current = newValue
    onValueChange(newValue)
  }, [disabled, localValue, maximumValue, step, onValueChange])

  const formattedDisplay = formatValue
    ? formatValue(localValue)
    : `${localValue}${unit}`

  const thumbPosition = getPositionFromValue(localValue, trackWidth)
  const fillWidth = trackWidth > 0 ? (thumbPosition / trackWidth) * 100 : 0

  return (
    <View
      className={`px-4 py-3 ${!isLast ? 'border-b border-border' : ''} ${disabled ? 'opacity-50' : ''}`}
    >
      {/* Header row with label and value */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base text-white font-medium">{label}</Text>
          {description && (
            <Text className="text-sm text-gray-400 mt-0.5">{description}</Text>
          )}
        </View>
        <Text className="text-accent text-lg font-semibold ml-3">
          {formattedDisplay}
        </Text>
      </View>

      {/* Custom Slider */}
      <View className="flex-row items-center">
        {/* Decrement button */}
        <TouchableOpacity
          onPress={handleDecrement}
          disabled={disabled || localValue <= minimumValue}
          className="w-8 h-8 items-center justify-center"
          activeOpacity={0.6}
        >
          <Text
            className={`text-xl font-bold ${localValue <= minimumValue ? 'text-gray-600' : 'text-gray-400'}`}
          >
            −
          </Text>
        </TouchableOpacity>

        {/* Track container */}
        <View className="flex-1 mx-2">
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleTrackPress}
            disabled={disabled}
          >
            <View
              ref={trackRef}
              className="h-10 justify-center"
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            >
              {/* Track background */}
              <View className="h-2 bg-border rounded-full overflow-hidden">
                {/* Fill */}
                <View
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${fillWidth}%` }}
                />
              </View>

              {/* Thumb */}
              {trackWidth > 0 && (
                <View
                  {...panResponder.panHandlers}
                  style={{
                    position: 'absolute',
                    left: thumbPosition - 14,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.text.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                    elevation: 5,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: colors.accent.DEFAULT,
                    }}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Increment button */}
        <TouchableOpacity
          onPress={handleIncrement}
          disabled={disabled || localValue >= maximumValue}
          className="w-8 h-8 items-center justify-center"
          activeOpacity={0.6}
        >
          <Text
            className={`text-xl font-bold ${localValue >= maximumValue ? 'text-gray-600' : 'text-gray-400'}`}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Min/Max labels */}
      <View className="flex-row justify-between mt-1 px-8">
        <Text className="text-xs text-gray-500">
          {formatValue ? formatValue(minimumValue) : `${minimumValue}${unit}`}
        </Text>
        <Text className="text-xs text-gray-500">
          {formatValue ? formatValue(maximumValue) : `${maximumValue}${unit}`}
        </Text>
      </View>
    </View>
  )
}
