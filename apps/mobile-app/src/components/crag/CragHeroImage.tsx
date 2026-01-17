import { View, Text, Dimensions } from 'react-native'
import { ImagesOutlineIcon } from '@/components/shared/icons'
import { OptimizedImage } from '@/components/shared/OptimizedImage'
import { colors } from '@/theme/colors'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
export const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.25

interface CragHeroImageProps {
  imageUrl: string
  showGenericBadge: boolean
}

export function CragHeroImage({
  imageUrl,
  showGenericBadge,
}: CragHeroImageProps) {
  return (
    <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}>
      <OptimizedImage
        source={imageUrl}
        width={SCREEN_WIDTH}
        height={IMAGE_HEIGHT}
        contentFit="cover"
        placeholder="skeleton"
      />

      {showGenericBadge && (
        <View className="absolute bottom-8 left-4 flex-row items-center bg-black/70 px-2.5 py-1.5 rounded-lg gap-1.5">
          <ImagesOutlineIcon size={14} color={colors.text.secondary} />
          <Text className="text-gray-400 text-xs font-medium">
            Imagen de la zona
          </Text>
        </View>
      )}
    </View>
  )
}
