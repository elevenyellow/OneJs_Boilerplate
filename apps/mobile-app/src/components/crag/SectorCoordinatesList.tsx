import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { NavigateOutlineIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import type { SectorWithPhoto } from './types'

interface SectorCoordinatesListProps {
  sectors: SectorWithPhoto[]
  onSectorPress: (latitude: number, longitude: number, name: string) => void
}

export function SectorCoordinatesList({
  sectors,
  onSectorPress,
}: SectorCoordinatesListProps) {
  const { t } = useTranslation()
  const sectorsWithCoordinates = sectors.filter(
    (s) => s.latitude && s.longitude,
  )

  if (sectorsWithCoordinates.length === 0) {
    return null
  }

  return (
    <View className="mt-6 px-4">
      <Text className="text-white text-[15px] font-semibold mb-3">
        {t('sector.sectorsWithLocation')}
      </Text>
      {sectorsWithCoordinates.map((sector) => (
        <TouchableOpacity
          key={sector.id}
          className="flex-row items-center bg-card rounded-[10px] p-3.5 mb-2"
          onPress={() =>
            onSectorPress(sector.latitude!, sector.longitude!, sector.name)
          }
        >
          <View className="flex-1">
            <Text className="text-white text-sm font-medium">
              {sector.name}
            </Text>
            <Text
              className="text-gray-500 text-xs mt-0.5"
              style={{
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              }}
            >
              {sector.latitude!.toFixed(4)}, {sector.longitude!.toFixed(4)}
            </Text>
          </View>
          <NavigateOutlineIcon size="md" color={colors.accent.DEFAULT} />
        </TouchableOpacity>
      ))}
    </View>
  )
}
