import { View, Text } from 'react-native'
import { StarRating } from '@/components/shared/StarRating'
import {
  CompassOutlineIcon,
  WalkOutlineIcon,
  ResizeOutlineIcon,
  PeopleOutlineIcon,
} from '@/components/shared/icons'
import { useUnits } from '@/hooks/useUnits'
import { getFamilyIconAndColor } from '@/utils/icons'
import { colors } from '@/theme/colors'

interface SectorInfoBadgesProps {
  aspectLabel?: string | null
  walkInTimeLabel?: string | null
  averageHeight?: number | null
  familyLabel?: string | null
  tagFamily?: string | null
  crowdsLabel?: string | null
  starRating?: number
}

export function SectorInfoBadges({
  aspectLabel,
  walkInTimeLabel,
  averageHeight,
  familyLabel,
  tagFamily,
  crowdsLabel,
  starRating,
}: SectorInfoBadgesProps) {
  const { formatHeight } = useUnits()
  const hasBadges =
    aspectLabel ||
    walkInTimeLabel ||
    familyLabel ||
    crowdsLabel ||
    averageHeight ||
    (starRating && starRating > 0)

  if (!hasBadges) {
    return null
  }

  const { Icon: FamilyIcon, color: familyColor } =
    getFamilyIconAndColor(tagFamily)

  return (
    <View className="px-4 pt-2 pb-1">
      <View className="flex-row flex-wrap gap-2">
        {aspectLabel && (
          <View className="flex-row items-center bg-card px-3 py-1.5 rounded-full">
            <CompassOutlineIcon size={14} color={colors.status.info} />
            <Text className="text-gray-300 text-xs ml-1.5">{aspectLabel}</Text>
          </View>
        )}
        {walkInTimeLabel && (
          <View className="flex-row items-center bg-card px-3 py-1.5 rounded-full">
            <WalkOutlineIcon size={14} color={colors.icon.walk} />
            <Text className="text-gray-300 text-xs ml-1.5">
              {walkInTimeLabel}
            </Text>
          </View>
        )}
        {averageHeight && (
          <View className="flex-row items-center bg-card px-3 py-1.5 rounded-full">
            <ResizeOutlineIcon size={14} color={colors.status.warning} />
            <Text className="text-gray-300 text-xs ml-1.5">
              {formatHeight(averageHeight)}
            </Text>
          </View>
        )}
        {familyLabel && (
          <View className="flex-row items-center bg-card px-3 py-1.5 rounded-full">
            <FamilyIcon size={14} color={familyColor} />
            <Text className="text-gray-300 text-xs ml-1.5">{familyLabel}</Text>
          </View>
        )}
        {crowdsLabel && (
          <View className="flex-row items-center bg-card px-3 py-1.5 rounded-full">
            <PeopleOutlineIcon size={14} color={colors.accent.DEFAULT} />
            <Text className="text-gray-300 text-xs ml-1.5">{crowdsLabel}</Text>
          </View>
        )}
        {starRating !== undefined && starRating > 0 && (
          <View className="flex-row items-center bg-card px-3 py-1.5 rounded-full">
            <StarRating rating={starRating} maxStars={3} size={12} />
          </View>
        )}
      </View>
    </View>
  )
}
