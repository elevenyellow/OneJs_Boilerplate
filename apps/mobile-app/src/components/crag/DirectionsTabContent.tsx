import { View, Text, ScrollView } from 'react-native'
import { NavigateOutlineIcon } from '@/components/shared/icons'
import { LocationCard, WalkTimeCard, ApproachCard } from './DirectionsCard'
import { SectorCoordinatesList } from './SectorCoordinatesList'
import { colors } from '@/theme/colors'
import type { SectorWithPhoto, DirectionsData } from './types'

interface DirectionsTabContentProps {
  directionsData: DirectionsData | null
  sectors: SectorWithPhoto[]
  onOpenMaps: (latitude: number, longitude: number, label: string) => void
  onCopyCoordinates: (latitude: number, longitude: number) => void
}

export function DirectionsTabContent({
  directionsData,
  sectors,
  onOpenMaps,
  onCopyCoordinates,
}: DirectionsTabContentProps) {
  const hasCoordinates = directionsData?.latitude && directionsData?.longitude

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
    >
      {/* Location Card */}
      {hasCoordinates && (
        <LocationCard
          name={directionsData.name}
          latitude={directionsData.latitude}
          longitude={directionsData.longitude}
          onCopyCoordinates={() =>
            onCopyCoordinates(directionsData.latitude, directionsData.longitude)
          }
          onOpenMaps={() =>
            onOpenMaps(
              directionsData.latitude,
              directionsData.longitude,
              directionsData.name,
            )
          }
        />
      )}

      {/* Walk-in Time */}
      {directionsData?.walkInTime && (
        <WalkTimeCard walkInTime={directionsData.walkInTime} />
      )}

      {/* Approach Description */}
      {directionsData?.approach && (
        <ApproachCard approach={directionsData.approach} />
      )}

      {/* Empty state */}
      {!hasCoordinates && !directionsData?.approach && (
        <View className="items-center justify-center py-[60px] px-6">
          <NavigateOutlineIcon size={48} color={colors.text.muted} />
          <Text className="text-white text-base font-semibold mt-4">
            Sin informacion de ubicacion
          </Text>
          <Text className="text-gray-400 text-center mt-2 text-sm">
            No hay datos de coordenadas o acceso disponibles para esta zona.
          </Text>
        </View>
      )}

      {/* Sectors with coordinates list */}
      <SectorCoordinatesList sectors={sectors} onSectorPress={onOpenMaps} />
    </ScrollView>
  )
}
