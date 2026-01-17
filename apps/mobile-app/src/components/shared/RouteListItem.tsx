import { memo, useCallback, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { haptics } from '@/services/haptics'
import { usePreferences } from '@/contexts/PreferencesContext'
import { GradeConverter, type GradeSystem } from '@climb-zone/grades'
import type { RouteDto } from '@/types/api'
import { colors, getGradeColor } from '@/theme/colors'
import { getProtectionIconAndColor } from '@/utils/icons'
import { StarIcon, ChevronForwardIcon } from './icons'
import { RouteGradeBadge, RouteStatsRow, RouteWarningBadges } from './route'
import { DOUBLE_TAP_DELAY } from './topo/constants'

interface RouteListItemProps {
  route: RouteDto
  isSelected?: boolean
  onPress?: () => void
  /** Called when user double-taps the route item (e.g., to log ascent) */
  onDoubleTap?: () => void
  /** Number of times this route has been climbed */
  ascentCount?: number
}

/**
 * Memoized route list item component.
 * Optimized for FlatList rendering with stable callbacks.
 */
export const RouteListItem = memo(function RouteListItem({
  route,
  isSelected,
  onPress,
  onDoubleTap,
  ascentCount,
}: RouteListItemProps) {
  const { preferences } = usePreferences()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem
  const lastTapRef = useRef<number>(0)

  // Memoize derived values
  const { gradeLabel, gradeColor, displayNumber, protectionInfo, isClosed } =
    useMemo(() => {
      const label =
        route.gradeBand > 0
          ? (GradeConverter.fromIndex(route.gradeBand, gradeSystem) ?? '?')
          : '?'

      const color = getGradeColor(route.gradeCategory ?? 'unknown')
      const number = route.topoNumber || route.siblingLabel?.toString()
      const protection = getProtectionIconAndColor(route.protectionRating)

      return {
        gradeLabel: label,
        gradeColor: color,
        displayNumber: number,
        protectionInfo: protection,
        isClosed: route.isClosed,
      }
    }, [
      route.gradeBand,
      route.gradeCategory,
      route.topoNumber,
      route.siblingLabel,
      route.protectionRating,
      route.isClosed,
      gradeSystem,
    ])

  // Stable callback for press handler with double-tap detection
  const handlePress = useCallback(() => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current

    if (timeSinceLastTap < DOUBLE_TAP_DELAY && onDoubleTap) {
      // Double tap detected
      haptics.success()
      onDoubleTap()
      lastTapRef.current = 0
    } else {
      // Single tap
      haptics.selection()
      onPress?.()
      lastTapRef.current = now
    }
  }, [onPress, onDoubleTap])

  // Protection info
  const showProtection =
    route.protectionRating &&
    route.protectionRating !== 'unknown' &&
    route.protectionRating !== 'normal'

  const { Icon: ProtectionIcon, color: protectionColor } = protectionInfo

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isClosed}
      className={`bg-card rounded-2xl p-4 mb-3 border ${
        isSelected ? 'border-accent/60' : 'border-gray-800'
      } ${isClosed ? 'opacity-50' : ''}`}
    >
      <View className="flex-row items-center">
        {/* Grade box with topo number */}
        <RouteGradeBadge
          gradeLabel={gradeLabel}
          gradeColor={gradeColor}
          gradeStyle={route.gradeStyle}
          displayNumber={displayNumber}
          ascentCount={ascentCount}
        />

        {/* Route details */}
        <View className="flex-1">
          {/* Route name */}
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-lg font-semibold flex-1 ${isClosed ? 'text-gray-500' : 'text-white'}`}
              numberOfLines={1}
            >
              {displayNumber ? `${displayNumber}. ` : ''}
              {route.name}
            </Text>
            {route.isClassic && (
              <View className="bg-yellow-500/20 p-1 rounded-full ml-2">
                <StarIcon size={14} color={colors.grade.medium} />
              </View>
            )}
          </View>

          {/* Stats row: stars, height, bolts, style */}
          <RouteStatsRow
            isClosed={isClosed}
            warningText={route.warningText}
            stars={route.stars}
            height={route.height}
            bolts={route.bolts}
            primaryStyle={route.primaryStyle}
            isMultiPitch={route.isMultiPitch}
            pitches={route.pitches}
          />

          {/* Protection & warning badges row */}
          {!isClosed && (
            <RouteWarningBadges
              showProtection={showProtection}
              protectionIcon={ProtectionIcon}
              protectionColor={protectionColor}
              boltSpacing={route.boltSpacing}
              hasWarning={route.hasWarning}
              warningText={route.warningText}
              needsMaintenanceReview={route.needsMaintenanceReview}
              equipmentAgeYears={route.equipmentAgeYears}
            />
          )}

          {/* Description / Beta */}
          {!isClosed && route.description && (
            <Text
              className="text-gray-400 text-xs mt-1 italic"
              numberOfLines={2}
            >
              {route.description}
            </Text>
          )}
        </View>

        {!isClosed && <ChevronForwardIcon />}
      </View>
    </TouchableOpacity>
  )
})
