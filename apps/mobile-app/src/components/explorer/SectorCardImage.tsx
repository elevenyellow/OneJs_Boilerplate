import { memo } from 'react'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { OptimizedImage } from '@/components/shared/OptimizedImage'
import { CheckmarkCircleIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'

interface SectorCardImageProps {
  /** Image URL for the sector */
  imageUrl?: string
  /** Whether this sector is the best match */
  isBestMatch?: boolean
}

/**
 * Image section of the SectorCard with optional "Best Match" badge overlay.
 * Displays a 16:10 aspect ratio image with rounded top corners.
 */
export const SectorCardImage = memo(function SectorCardImage({
  imageUrl,
  isBestMatch = false,
}: SectorCardImageProps) {
  const { t } = useTranslation()

  return (
    <View className="relative w-full aspect-[16/10] overflow-hidden rounded-t-2xl bg-card-elevated">
      {imageUrl ? (
        <OptimizedImage
          source={imageUrl}
          width={400}
          height={250}
          contentFit="cover"
          placeholder="skeleton"
          className="w-full h-full"
        />
      ) : (
        <View className="w-full h-full items-center justify-center">
          <Text className="text-gray-600 text-sm">
            {t('sector.noInfoAvailable')}
          </Text>
        </View>
      )}

      {/* Best Match Badge Overlay */}
      {isBestMatch && (
        <View className="absolute top-3 right-3 bg-yellow-400 px-3 py-1.5 rounded-full flex-row items-center">
          <CheckmarkCircleIcon size={14} color={colors.bg.primary} />
          <Text className="text-black text-xs font-bold ml-1">
            {t('explorer.bestMatch')}
          </Text>
        </View>
      )}
    </View>
  )
})
