/**
 * Approach Info Section
 *
 * Displays approach/access information for a sector including:
 * - Route name and difficulty badge
 * - Stats row: distance, time, elevation gain
 * - Trail description
 * - Action buttons: Open in Google Maps, Download
 */

import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  MapOutlineIcon,
  WalkOutlineIcon,
  TimeOutlineIcon,
  TrendingUpOutlineIcon,
  InformationCircleOutlineIcon,
  CloudDownloadOutlineIcon,
} from '@/components/shared/icons'
import { colors } from '@/theme/colors'

// =============================================================================
// Types
// =============================================================================

export type ApproachDifficulty = 'easy' | 'moderate' | 'hard'

export interface ApproachData {
  /** Name of the approach route */
  routeName?: string
  /** Difficulty level */
  difficulty?: ApproachDifficulty
  /** Distance in kilometers */
  distanceKm?: number
  /** Estimated time in minutes */
  timeMinutes?: number
  /** Elevation gain in meters (positive = uphill) */
  elevationMeters?: number
  /** Description of the trail/approach */
  description?: string
  /** Coordinates for navigation */
  coordinates?: {
    latitude: number
    longitude: number
  }
}

interface ApproachInfoSectionProps {
  approach: ApproachData
  /** Called when download button is pressed */
  onDownload?: () => void
}

// =============================================================================
// Sub-components
// =============================================================================

interface DifficultyBadgeProps {
  difficulty: ApproachDifficulty
}

function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const { t } = useTranslation()

  const config: Record<
    ApproachDifficulty,
    { label: string; bgColor: string; textColor: string }
  > = {
    easy: {
      label: t('approach.difficulty.easy'),
      bgColor: 'rgba(34, 197, 94, 0.15)',
      textColor: colors.status.success,
    },
    moderate: {
      label: t('approach.difficulty.moderate'),
      bgColor: 'rgba(20, 184, 166, 0.15)',
      textColor: colors.accent.DEFAULT,
    },
    hard: {
      label: t('approach.difficulty.hard'),
      bgColor: 'rgba(239, 68, 68, 0.15)',
      textColor: colors.status.error,
    },
  }

  const { label, bgColor, textColor } = config[difficulty]

  return (
    <View
      style={{ backgroundColor: bgColor }}
      className="px-3 py-1 rounded-full"
    >
      <Text
        style={{ color: textColor }}
        className="text-xs font-semibold uppercase"
      >
        {label}
      </Text>
    </View>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View className="flex-1 bg-card border border-border-muted rounded-xl py-4 items-center">
      <View className="mb-2">{icon}</View>
      <Text className="text-white text-lg font-bold">{value}</Text>
      <Text className="text-gray-500 text-[11px] uppercase tracking-wide mt-0.5">
        {label}
      </Text>
    </View>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function ApproachInfoSection({
  approach,
  onDownload,
}: ApproachInfoSectionProps) {
  const { t } = useTranslation()

  const hasStats =
    approach.distanceKm !== undefined ||
    approach.timeMinutes !== undefined ||
    approach.elevationMeters !== undefined

  const hasContent = hasStats || approach.description || approach.routeName

  if (!hasContent) {
    return null
  }

  // Format values
  const distanceValue = approach.distanceKm
    ? `${approach.distanceKm.toFixed(1)} km`
    : undefined
  const timeValue = approach.timeMinutes
    ? `${approach.timeMinutes} min`
    : undefined
  const elevationValue = approach.elevationMeters
    ? `${approach.elevationMeters > 0 ? '+' : ''}${approach.elevationMeters}m`
    : undefined

  // Handle Google Maps navigation
  const handleOpenMaps = () => {
    if (!approach.coordinates) return

    const { latitude, longitude } = approach.coordinates
    const label = encodeURIComponent(approach.routeName || 'Approach')

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    })

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        )
      })
    }
  }

  return (
    <View className="bg-surface rounded-t-3xl px-5 pt-6 pb-8">
      {/* Handle indicator */}
      <View className="items-center mb-4">
        <View className="w-10 h-1 bg-gray-600 rounded-full" />
      </View>

      {/* Header: Title + Difficulty */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-4">
          <Text className="text-white text-xl font-bold">
            {t('approach.title')}
          </Text>
          {approach.routeName && (
            <Text className="text-gray-400 text-sm mt-1">
              {t('approach.route')}: {approach.routeName}
            </Text>
          )}
        </View>
        {approach.difficulty && (
          <View className="items-end">
            <Text className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
              {t('approach.difficultyLabel')}
            </Text>
            <DifficultyBadge difficulty={approach.difficulty} />
          </View>
        )}
      </View>

      {/* Stats Row */}
      {hasStats && (
        <View className="flex-row gap-3 mt-5">
          {distanceValue && (
            <StatCard
              icon={<WalkOutlineIcon size={22} color={colors.accent.DEFAULT} />}
              value={distanceValue}
              label={t('approach.distance')}
            />
          )}
          {timeValue && (
            <StatCard
              icon={<TimeOutlineIcon size={22} color={colors.accent.DEFAULT} />}
              value={timeValue}
              label={t('approach.time')}
            />
          )}
          {elevationValue && (
            <StatCard
              icon={
                <TrendingUpOutlineIcon
                  size={22}
                  color={colors.accent.DEFAULT}
                />
              }
              value={elevationValue}
              label={t('approach.elevation')}
            />
          )}
        </View>
      )}

      {/* Description Section */}
      {approach.description && (
        <View className="bg-card rounded-xl p-4 mt-5">
          <View className="flex-row items-center mb-3">
            <InformationCircleOutlineIcon
              size={16}
              color={colors.accent.DEFAULT}
            />
            <Text className="text-accent text-xs font-semibold uppercase tracking-wider ml-2">
              {t('approach.trailDescription')}
            </Text>
          </View>
          <Text className="text-gray-300 text-sm leading-6">
            {approach.description}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {(approach.coordinates || onDownload) && (
        <View className="flex-row gap-3 mt-6">
          {approach.coordinates && (
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-accent rounded-xl py-4"
              onPress={handleOpenMaps}
              activeOpacity={0.8}
            >
              <MapOutlineIcon size={20} color={colors.text.primary} />
              <Text className="text-white text-[15px] font-semibold ml-2">
                {t('approach.openInMaps')}
              </Text>
            </TouchableOpacity>
          )}
          {onDownload && (
            <TouchableOpacity
              className="w-14 h-14 items-center justify-center bg-card border border-border-muted rounded-xl"
              onPress={onDownload}
              activeOpacity={0.7}
            >
              <CloudDownloadOutlineIcon
                size={24}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}
