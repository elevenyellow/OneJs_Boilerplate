import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { StarRating } from '@/components/shared/StarRating'
import { MapOutlineIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import { SectorConditionsRow } from './SectorConditionsRow'
import type { SectorWithPhoto } from './types'

interface SectorInfoCardProps {
  sector: SectorWithPhoto | null
  fallbackName: string
}

export function SectorInfoCard({ sector, fallbackName }: SectorInfoCardProps) {
  const { t } = useTranslation()
  const hasRating = sector?.starRating && sector.starRating > 0

  return (
    <View className="bg-card mx-4 -mt-6 rounded-2xl p-4 z-10">
      {/* Header with name and rating */}
      <View className="flex-row justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-white text-xl font-bold mb-1">
            {sector?.name || fallbackName}
          </Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center gap-0.5">
            <StarRating
              rating={sector?.starRating || 0}
              maxStars={3}
              size={16}
              color={colors.accent.DEFAULT}
            />
          </View>
          <Text
            className={`text-[9px] tracking-wider ${hasRating ? 'text-gray-500' : 'text-gray-500'}`}
          >
            {hasRating ? t('sector.quality') : t('sector.notRated')}
          </Text>
        </View>
      </View>

      {/* Conditions row */}
      <SectorConditionsRow
        aspectLabel={sector?.aspectLabel ?? null}
        walkInTimeLabel={sector?.walkInTimeLabel ?? null}
        averageHeight={sector?.averageHeight ?? null}
        minGradeBand={sector?.minGradeBand ?? null}
        maxGradeBand={sector?.maxGradeBand ?? null}
        climbingStyle={sector?.climbingStyle ?? null}
      />

      {/* Has topo badge */}
      {sector?.hasTopo && (
        <View className="flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-border">
          <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/30">
            <MapOutlineIcon size={14} color={colors.accent.DEFAULT} />
            <Text className="text-accent text-xs font-medium">
              {t('sector.hasTopo')}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
