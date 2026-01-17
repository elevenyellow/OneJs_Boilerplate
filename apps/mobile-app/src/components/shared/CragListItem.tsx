import { memo, useMemo } from 'react'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useUnits } from '@/hooks/useUnits'
import type { SectorUI, ZoneSectorUI } from '@/types/ui'
import { BaseLocationCard } from './BaseLocationCard'
import { SeasonBadge } from './SeasonBadge'
import { ClimbingStyleBadge } from './ClimbingStyleBadge'
import { TopoBadge } from './TopoBadge'
import { StarRating } from './StarRating'
import { WeatherIndicatorsCompact } from './WeatherIndicatorsCompact'
import {
  TrophyIcon,
  LocationOutlineIcon,
  CompassOutlineIcon,
  WalkOutlineIcon,
  HappyOutlineIcon,
  WarningOutlineIcon,
  SpeedometerOutlineIcon,
  RadarOutlineIcon,
} from './icons'
import { colors } from '@/theme/colors'

/**
 * Get color for score values (0-1 scale)
 */
function getScoreColor(score: number): string {
  if (score >= 0.8) return colors.status.success // Excellent
  if (score >= 0.6) return colors.accent.DEFAULT // Good
  if (score >= 0.4) return colors.status.warning // Fair
  return colors.status.error // Poor
}

interface CragListItemProps {
  /** Accepts SectorUI for basic display, ZoneSectorUI for extended info */
  crag: SectorUI | ZoneSectorUI
  isSelected?: boolean
  onPress?: () => void
  /** Show extended info (aspect, walkTime, family, crowds) - requires ZoneSectorUI */
  showExtendedInfo?: boolean
}

/**
 * Memoized crag list item component.
 * Optimized for FlatList rendering.
 */
export const CragListItem = memo(function CragListItem({
  crag,
  isSelected,
  onPress,
  showExtendedInfo = false,
}: CragListItemProps) {
  const { t } = useTranslation()
  const { formatDistance } = useUnits()

  // Header weather indicators slot
  const headerRightSlot = useMemo(
    () => (
      <WeatherIndicatorsCompact
        temperature={crag.temperature}
        condition={crag.condition}
        weatherConditions={crag.weatherConditions}
      />
    ),
    [crag.temperature, crag.condition, crag.weatherConditions],
  )

  // Best match badge
  const nameBadge = crag.isBestMatch ? (
    <View className="flex-row items-center bg-accent/20 px-2 py-0.5 rounded ml-2">
      <TrophyIcon size={12} />
      <Text className="text-accent text-xs font-semibold ml-1">MATCH</Text>
    </View>
  ) : null

  // Get match score (totalScore) - combined score from distance, routes, weather, etc.
  const matchScore = crag.totalScore
  const matchScoreColor = matchScore
    ? getScoreColor(matchScore)
    : colors.text.muted

  // Get quality star rating (0-3 scale)
  const qualityStarRating = crag.qualityRating ?? crag.overallScore ?? 0

  // Enhanced info badges row (icon-only badges with legend)
  const enhancedInfoSlot = (
    <View className="flex-row flex-wrap items-center gap-1.5 mt-2">
      {/* Match score - overall matching score (distance, routes, weather combined) */}
      {matchScore !== undefined && matchScore > 0 && (
        <View
          className="flex-row items-center px-1.5 py-1 rounded"
          style={{ backgroundColor: `${matchScoreColor}20` }}
        >
          <SpeedometerOutlineIcon size={14} color={matchScoreColor} />
          <Text
            className="text-xs font-bold ml-1"
            style={{ color: matchScoreColor }}
          >
            {Math.round(matchScore * 100)}%
          </Text>
        </View>
      )}

      {/* Quality star rating (based on route stars) */}
      {qualityStarRating > 0 && (
        <View className="flex-row items-center bg-grade-medium/20 px-1.5 py-1 rounded">
          <StarRating
            rating={Math.round(qualityStarRating)}
            maxStars={3}
            size={12}
          />
        </View>
      )}

      {/* Distance badge */}
      {crag.distanceKm !== undefined && (
        <View
          className="flex-row items-center px-1.5 py-1 rounded"
          style={{ backgroundColor: `${colors.text.secondary}20` }}
        >
          <LocationOutlineIcon size={14} color={colors.text.secondary} />
          <Text
            className="text-xs ml-1"
            style={{ color: colors.text.secondary }}
          >
            {formatDistance(crag.distanceKm)}
          </Text>
        </View>
      )}

      {/* Season badge (icon only) */}
      <SeasonBadge seasonality={crag.seasonality} iconOnly />

      {/* Topo badge (icon only) */}
      <TopoBadge hasTopo={crag.hasTopo} iconOnly />

      {/* Climbing style badge (icon only) */}
      <ClimbingStyleBadge type={crag.type} subType={crag.subType} iconOnly />

      {/* Extended info (if showExtendedInfo is true and crag has ZoneSectorUI fields) */}
      {showExtendedInfo && 'aspectLabel' in crag && crag.aspectLabel && (
        <View className="flex-row items-center bg-background/50 px-1.5 py-1 rounded">
          <CompassOutlineIcon size={12} color={colors.text.secondary} />
          <Text className="text-gray-300 text-xs ml-1">{crag.aspectLabel}</Text>
        </View>
      )}
      {showExtendedInfo &&
        'walkInTimeLabel' in crag &&
        crag.walkInTimeLabel && (
          <View className="flex-row items-center bg-background/50 px-1.5 py-1 rounded">
            <WalkOutlineIcon size={12} color={colors.text.secondary} />
            <Text className="text-gray-300 text-xs ml-1">
              {crag.walkInTimeLabel}
            </Text>
          </View>
        )}
      {showExtendedInfo && 'familyLabel' in crag && crag.familyLabel && (
        <View className="flex-row items-center bg-background/50 px-1.5 py-1 rounded">
          {'tagFamily' in crag && crag.tagFamily === 'KID_FRIENDLY' ? (
            <HappyOutlineIcon size={12} color={colors.status.success} />
          ) : (
            <WarningOutlineIcon size={12} color={colors.status.warning} />
          )}
          <Text className="text-gray-300 text-xs ml-1">{crag.familyLabel}</Text>
        </View>
      )}
      {showExtendedInfo && 'crowdsLabel' in crag && crag.crowdsLabel && (
        <View className="flex-row items-center bg-background/50 px-1.5 py-1 rounded">
          <Text className="text-gray-300 text-xs ml-1">{crag.crowdsLabel}</Text>
        </View>
      )}
    </View>
  )

  // Extract starRating if available (ZoneSectorUI field)
  const starRating = 'starRating' in crag ? crag.starRating : undefined

  return (
    <BaseLocationCard
      name={crag.name}
      imageUrl={crag.imageUrl}
      isSelected={isSelected}
      onPress={onPress}
      starRating={starRating}
      nameBadge={nameBadge}
      headerRightSlot={headerRightSlot}
      badgesSlot={enhancedInfoSlot}
    >
      {crag.location && (
        <Text className="text-gray-400 text-sm" numberOfLines={1}>
          {crag.location}
        </Text>
      )}

      <View className="flex-row items-center mt-1">
        {crag.routesInRange !== undefined && crag.routesInRange > 0 ? (
          <>
            <RadarOutlineIcon size={14} color={colors.accent.DEFAULT} />
            <Text className="text-accent text-sm font-medium ml-1">
              {crag.routesInRange}
            </Text>
            <Text className="text-gray-500 text-sm">/{crag.routeCount}</Text>
            <Text className="text-gray-400 text-sm"> · {crag.gradeRange}</Text>
          </>
        ) : (
          <Text className="text-gray-400 text-sm">
            {t('crag.routesSummary', {
              count: crag.routeCount,
              gradeRange: crag.gradeRange,
            })}
          </Text>
        )}
        {/* Star rating for the area */}
        {starRating !== undefined && starRating > 0 && (
          <View className="flex-row items-center ml-2">
            <StarRating rating={starRating} maxStars={3} size={12} />
          </View>
        )}
      </View>
    </BaseLocationCard>
  )
})
