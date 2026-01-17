/**
 * Log Ascent Screen
 *
 * Screen for logging a climbing ascent with details like style, grade evaluation,
 * wall type, characteristics, quality rating, and comments.
 */

import { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { ScreenHeader } from '@/components/shared'
import {
  RouteHeaderCard,
  AscentStyleChips,
  DateRepeatRow,
  TriesCounter,
  GradeEvaluationChips,
  WallTypeSelector,
  CharacterChips,
  SafetyConcernsChips,
  QualityStars,
  CommentsInput,
  DEFAULT_LOG_ASCENT_FORM,
} from '@/components/logbook'
import type {
  LogAscentFormState,
  AscentStyle,
  GradeEvaluation,
  WallType,
  RouteCharacteristic,
  SafetyConcern,
} from '@/components/logbook'
import { haptics } from '@/services/haptics'
import { devLog } from '@/utils/logger'
import { colors } from '@/theme/colors'
import type { RootStackParamList } from '@/navigation/types'
import { createAscent } from '@/services/api'
import { ApiError } from '@/services/api'
import { notify } from '@/services/notifications'

type LogAscentScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'LogAscent'
>

export function LogAscentScreen({ navigation, route }: LogAscentScreenProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const {
    routeId,
    routeName,
    routeGrade,
    routeGradeBand,
    routeGradeSecondary,
    routeImage,
    location,
  } = route.params

  const [formState, setFormState] = useState<LogAscentFormState>(
    DEFAULT_LOG_ASCENT_FORM,
  )
  const [isLoading, setIsLoading] = useState(false)

  // Form update handlers
  const handleStyleChange = useCallback((style: AscentStyle) => {
    haptics.selection()
    setFormState((prev) => ({ ...prev, style }))
  }, [])

  const handleDateChange = useCallback((date: Date) => {
    setFormState((prev) => ({ ...prev, date }))
  }, [])

  const handleRepeatChange = useCallback((isRepeat: boolean) => {
    haptics.selection()
    setFormState((prev) => ({ ...prev, isRepeat }))
  }, [])

  const handleTriesChange = useCallback((tries: number) => {
    haptics.selection()
    setFormState((prev) => ({ ...prev, tries }))
  }, [])

  const handleGradeEvaluationChange = useCallback(
    (gradeEvaluation: GradeEvaluation) => {
      haptics.selection()
      setFormState((prev) => ({ ...prev, gradeEvaluation }))
    },
    [],
  )

  const handleWallTypeChange = useCallback((wallType: WallType) => {
    haptics.selection()
    setFormState((prev) => ({ ...prev, wallType }))
  }, [])

  const handleCharacteristicsChange = useCallback(
    (characteristics: RouteCharacteristic[]) => {
      haptics.selection()
      setFormState((prev) => ({ ...prev, characteristics }))
    },
    [],
  )

  const handleSafetyConcernsChange = useCallback(
    (safetyConcerns: SafetyConcern[]) => {
      haptics.selection()
      setFormState((prev) => ({ ...prev, safetyConcerns }))
    },
    [],
  )

  const handleQualityChange = useCallback((quality: number) => {
    haptics.selection()
    setFormState((prev) => ({ ...prev, quality }))
  }, [])

  const handleCommentsChange = useCallback((comments: string) => {
    setFormState((prev) => ({ ...prev, comments }))
  }, [])

  const handleLogAscent = useCallback(async () => {
    if (isLoading) return

    devLog.log('🚀 handleLogAscent called')
    devLog.log('routeGradeBand:', routeGradeBand)

    // Validate routeGradeBand is present
    if (!routeGradeBand || routeGradeBand <= 0) {
      devLog.warn('⚠️ Missing or invalid routeGradeBand')
      notify.error(
        t('logAscent.missingGradeBand') || 'Route grade band is required',
      )
      haptics.error()
      return
    }

    setIsLoading(true)
    haptics.selection()

    try {
      devLog.log('📝 Logging ascent:', {
        routeId,
        routeName,
        routeGradeBand,
        ...formState,
      })

      const result = await createAscent(formState, routeId, routeGradeBand)
      devLog.log('✅ Ascent API response:', result)

      // Invalidate user ascents cache to refresh route indicators
      queryClient.invalidateQueries({ queryKey: ['user-ascents'] })
      devLog.log('🔄 Invalidated user-ascents cache')

      haptics.success()
      devLog.log('✅ Ascent logged successfully')

      const successMessage =
        t('logAscent.success') || 'Ascent logged successfully!'
      devLog.log('🎉 Showing success notification:', successMessage)
      notify.success(successMessage)

      // Navigate back after a short delay to allow notification to be visible
      setTimeout(() => {
        devLog.log('🔙 Navigating back')
        navigation.goBack()
      }, 2000)
    } catch (error) {
      haptics.error()
      devLog.error('❌ Error logging ascent:', error)

      let errorMessage =
        t('logAscent.errorMessage') || 'Failed to log ascent. Please try again.'

      if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }

      devLog.error('🔥 Showing error notification:', errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
      devLog.log('✨ handleLogAscent finished')
    }
  }, [
    formState,
    routeId,
    routeName,
    routeGradeBand,
    navigation,
    isLoading,
    t,
    queryClient,
  ])

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScreenHeader
          title={t('logAscent.title')}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Route Info Header */}
          <View className="mt-4">
            <RouteHeaderCard
              routeName={routeName}
              routeGrade={routeGrade}
              routeGradeSecondary={routeGradeSecondary}
              routeImage={routeImage}
              location={location}
            />
          </View>

          {/* Ascent Style */}
          <AscentStyleChips
            value={formState.style}
            onValueChange={handleStyleChange}
          />

          {/* Date and Repeat */}
          <DateRepeatRow
            date={formState.date}
            isRepeat={formState.isRepeat}
            onDateChange={handleDateChange}
            onRepeatChange={handleRepeatChange}
          />

          {/* Tries Counter */}
          <TriesCounter
            value={formState.tries}
            onValueChange={handleTriesChange}
          />

          {/* Grade Evaluation */}
          <GradeEvaluationChips
            value={formState.gradeEvaluation}
            onValueChange={handleGradeEvaluationChange}
          />

          {/* Wall Type */}
          <WallTypeSelector
            value={formState.wallType}
            onValueChange={handleWallTypeChange}
          />

          {/* Route Characteristics */}
          <CharacterChips
            value={formState.characteristics}
            onValueChange={handleCharacteristicsChange}
          />

          {/* Safety Concerns */}
          <SafetyConcernsChips
            value={formState.safetyConcerns}
            onValueChange={handleSafetyConcernsChange}
          />

          {/* Quality Rating */}
          <QualityStars
            value={formState.quality}
            onValueChange={handleQualityChange}
          />

          {/* Comments */}
          <CommentsInput
            value={formState.comments}
            onValueChange={handleCommentsChange}
          />

          {/* Log Ascent Button */}
          <View className="px-4 pt-6 pb-4">
            <TouchableOpacity
              onPress={handleLogAscent}
              disabled={isLoading}
              className={`bg-accent rounded-xl py-4 flex-row items-center justify-center ${
                isLoading ? 'opacity-50' : ''
              }`}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text.primary} size="small" />
              ) : (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.text.primary}
                />
              )}
              <Text className="text-white text-lg font-semibold ml-2">
                {isLoading
                  ? t('common.loading') || 'Loading...'
                  : t('logAscent.logButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
