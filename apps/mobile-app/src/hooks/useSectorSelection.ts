import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  SectorWithPhoto,
  CragNavigationProp,
} from '@/components/crag/types'
import type { MainTabParamList } from '@/navigation/types'

interface UseSectorSelectionResult {
  selectedSectorId: string | null
  currentSector: SectorWithPhoto | null
  handleSectorPress: (sectorId: string) => void
}

export function useSectorSelection(
  sectorsWithPhotos: SectorWithPhoto[],
  navigation: CragNavigationProp,
  originTab?: keyof MainTabParamList,
): UseSectorSelectionResult {
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null)

  // Get current sector based on selection
  const currentSector = useMemo(() => {
    if (!sectorsWithPhotos.length) return null
    if (selectedSectorId) {
      return (
        sectorsWithPhotos.find((s) => s.id === selectedSectorId) ||
        sectorsWithPhotos[0]
      )
    }
    return sectorsWithPhotos[0]
  }, [sectorsWithPhotos, selectedSectorId])

  // Ensure a sector is always selected
  useEffect(() => {
    if (sectorsWithPhotos.length > 0) {
      if (!selectedSectorId) {
        setSelectedSectorId(sectorsWithPhotos[0].id)
      } else {
        const selectedExists = sectorsWithPhotos.some(
          (s) => s.id === selectedSectorId,
        )
        if (!selectedExists) {
          setSelectedSectorId(sectorsWithPhotos[0].id)
        }
      }
    }
  }, [sectorsWithPhotos, selectedSectorId])

  // Handle sector press - single tap selects, double tap navigates
  const handleSectorPress = useCallback(
    (sectorId: string) => {
      if (selectedSectorId === sectorId) {
        // Second tap - navigate
        const sector = sectorsWithPhotos.find((s) => s.id === sectorId)
        if (sector) {
          if (sector.hasSubSectors) {
            navigation.push('Crag', {
              zoneId: sector.id,
              zoneName: sector.name,
              originTab,
            })
          } else {
            navigation.navigate('Sector', {
              sectorId: sector.id,
              sectorName: sector.name,
              originTab,
            })
          }
        }
      } else {
        // First tap - select
        setSelectedSectorId(sectorId)
      }
    },
    [selectedSectorId, sectorsWithPhotos, navigation, originTab],
  )

  return {
    selectedSectorId,
    currentSector,
    handleSectorPress,
  }
}
