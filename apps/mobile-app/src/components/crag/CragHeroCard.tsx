import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { StarIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import type { SectorWithPhoto } from './types'

interface CragHeroCardProps {
  sector: SectorWithPhoto | null
  cragName: string
  zoneName: string
}

export function CragHeroCard({
  sector,
  cragName,
  zoneName,
}: CragHeroCardProps) {
  const { t } = useTranslation()

  const sectorName = sector?.name || cragName
  const routeCount = sector?.numberRoutes ?? 0
  const starRating = sector?.starRating ?? 0
  const kudos = sector?.kudos ?? 0

  // Build location label: "Crag Name, Zone Name • X vías"
  const locationParts: string[] = []
  if (cragName) {
    locationParts.push(cragName)
  }

  const locationLabel = locationParts.join(', ')
  const routeLabel = routeCount > 0 ? `${routeCount} ${t('crag.routes')}` : ''

  // Display rating only if > 0
  const displayRating = starRating > 0 ? starRating : null

  return (
    <View className="bg-card rounded-t-3xl -mt-6 pt-6 px-5 pb-2">
      {/* Header row: Name + Rating */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-white text-2xl font-bold" numberOfLines={2}>
            {sectorName}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {locationLabel}
            {locationLabel && routeLabel ? ' • ' : ''}
            {routeLabel}
          </Text>
        </View>

        {/* Rating */}
        {displayRating !== null && (
          <View className="items-end">
            <View className="flex-row items-center">
              <Text className="text-white text-xl font-bold mr-1">
                {displayRating.toFixed(1)}
              </Text>
              <StarIcon size={18} color={colors.grade.medium} />
            </View>
            {kudos > 0 && (
              <Text className="text-gray-500 text-xs uppercase">
                {kudos} {t('crag.reviews')}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
