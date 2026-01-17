/**
 * Performance Screen
 *
 * Displays user climbing statistics, grade distribution, and recent activity.
 * Allows navigation between months to view historical performance data.
 */

import { useState, useCallback, useMemo } from 'react'
import { ScrollView, View, TouchableOpacity, Text, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import {
  ScreenHeader,
  ShareOutlineIcon,
  LoadingState,
  ErrorState,
} from '@/components/shared'
import {
  MonthSelector,
  MonthYearPickerModal,
  MonthlyStatsCard,
  GradeDistributionCard,
  ActivityList,
  getMonthKey,
} from '@/components/performance'
import type { SelectedMonth } from '@/components/performance'
import { colors } from '@/theme/colors'
import { useUserPerformance } from '@/hooks/useUserPerformance'

// =============================================================================
// Component
// =============================================================================

export function PerformanceScreen() {
  const { t } = useTranslation()
  const { isLoading, isError, error, refetch, getMonthData } =
    useUserPerformance()

  // ===========================================================================
  // State
  // ===========================================================================

  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(() => {
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  })

  const [isPickerVisible, setIsPickerVisible] = useState(false)

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const handlePreviousMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 }
      }
      return { month: prev.month - 1, year: prev.year }
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 }
      }
      return { month: prev.month + 1, year: prev.year }
    })
  }, [])

  const handleOpenPicker = useCallback(() => {
    setIsPickerVisible(true)
  }, [])

  const handleClosePicker = useCallback(() => {
    setIsPickerVisible(false)
  }, [])

  const handleSelectMonth = useCallback((month: SelectedMonth) => {
    setSelectedMonth(month)
  }, [])

  const handleViewAllActivity = useCallback(() => {
    Alert.alert(
      t('common.comingSoon'),
      t('performance.activityHistoryComingSoon'),
    )
  }, [t])

  // ===========================================================================
  // Derived Data
  // ===========================================================================

  const canGoNext = useMemo(() => {
    const now = new Date()
    return !(
      selectedMonth.year === now.getFullYear() &&
      selectedMonth.month === now.getMonth()
    )
  }, [selectedMonth])

  const monthKey = getMonthKey(selectedMonth.year, selectedMonth.month)
  const monthData = useMemo(
    () => getMonthData(monthKey),
    [getMonthData, monthKey],
  )

  // Get translated month label
  const monthLabel = t(`performance.months.${selectedMonth.month}`)

  // Get comparison month label if data exists
  const comparisonMonthLabel = useMemo(() => {
    if (!monthData?.stats.comparisonMonthKey) return ''
    const [, month] = monthData.stats.comparisonMonthKey.split('-')
    const monthIndex = Number.parseInt(month, 10) - 1
    return t(`performance.months.${monthIndex}`)
  }, [monthData, t])

  // ===========================================================================
  // Loading and Error States
  // ===========================================================================

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScreenHeader
          title={t('performance.title')}
          showBackButton={false}
          rightActions={null}
        />
        <LoadingState
          title={t('performance.title')}
          message={t('common.loading')}
        />
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScreenHeader
          title={t('performance.title')}
          showBackButton={false}
          rightActions={null}
        />
        <ErrorState
          title={t('common.error')}
          message={error?.message || t('common.error')}
          actionLabel={t('common.retry')}
          onAction={refetch}
        />
      </SafeAreaView>
    )
  }

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title={t('performance.title')}
        showBackButton={false}
        rightActions={
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-card">
            <ShareOutlineIcon size={20} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <MonthSelector
          monthLabel={monthLabel}
          year={selectedMonth.year}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
          onMonthPress={handleOpenPicker}
          canGoNext={canGoNext}
        />

        {monthData ? (
          <>
            <MonthlyStatsCard
              stats={monthData.stats}
              monthLabel={monthLabel}
              comparisonMonthLabel={comparisonMonthLabel}
            />
            <GradeDistributionCard
              distribution={monthData.distribution}
              month={monthLabel}
            />
            <ActivityList
              activities={monthData.activities}
              onViewAll={handleViewAllActivity}
            />
          </>
        ) : (
          <View className="bg-card rounded-2xl p-6 mx-4 mt-4 items-center">
            <Text className="text-gray-500 text-center">
              {t('performance.noData', { month: monthLabel })}
            </Text>
          </View>
        )}

        {/* Sync info removed - no real sync data available yet */}
      </ScrollView>

      <MonthYearPickerModal
        visible={isPickerVisible}
        selectedMonth={selectedMonth}
        onSelect={handleSelectMonth}
        onClose={handleClosePicker}
      />
    </SafeAreaView>
  )
}
