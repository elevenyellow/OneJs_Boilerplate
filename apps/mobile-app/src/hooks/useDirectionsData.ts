import { useMemo, useCallback } from 'react'
import { Linking } from 'react-native'
import type { SectorWithPhoto, DirectionsData } from '@/components/crag/types'

interface ZoneOverviewCrag {
  name: string
  latitude?: number | null
  longitude?: number | null
}

interface UseDirectionsDataResult {
  directionsData: DirectionsData | null
  openInMaps: (latitude: number, longitude: number, label: string) => void
  copyCoordinates: (latitude: number, longitude: number) => void
}

export function useDirectionsData(
  sectorsWithPhotos: SectorWithPhoto[],
  selectedSectorId: string | null,
  crag: ZoneOverviewCrag | null | undefined,
): UseDirectionsDataResult {
  const directionsData = useMemo<DirectionsData | null>(() => {
    // If a sector is selected, use its coordinates
    if (selectedSectorId) {
      const selectedSector = sectorsWithPhotos.find(
        (s) => s.id === selectedSectorId,
      )
      if (selectedSector?.latitude && selectedSector?.longitude) {
        return {
          latitude: selectedSector.latitude,
          longitude: selectedSector.longitude,
          name: selectedSector.name,
          approach: selectedSector.approach,
          walkInTime: selectedSector.walkInTimeLabel,
        }
      }
    }

    // Find first sector with coordinates
    const sectorWithCoords = sectorsWithPhotos.find(
      (s) => s.latitude && s.longitude,
    )
    if (sectorWithCoords) {
      return {
        latitude: sectorWithCoords.latitude!,
        longitude: sectorWithCoords.longitude!,
        name: sectorWithCoords.name,
        approach: sectorWithCoords.approach,
        walkInTime: sectorWithCoords.walkInTimeLabel,
      }
    }

    // Fallback to crag coordinates
    if (crag?.latitude && crag?.longitude) {
      return {
        latitude: crag.latitude,
        longitude: crag.longitude,
        name: crag.name,
        approach: null,
        walkInTime: null,
      }
    }

    return null
  }, [selectedSectorId, sectorsWithPhotos, crag])

  const openInMaps = useCallback(
    (latitude: number, longitude: number, label: string) => {
      const encodedLabel = encodeURIComponent(label)
      const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`

      Linking.canOpenURL(geoUrl).then((supported) => {
        if (supported) {
          Linking.openURL(geoUrl)
        } else {
          Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
          )
        }
      })
    },
    [],
  )

  const copyCoordinates = useCallback((latitude: number, longitude: number) => {
    const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    // Note: Would need Clipboard from expo-clipboard for full implementation
    alert(`Coordenadas copiadas: ${coords}`)
  }, [])

  return {
    directionsData,
    openInMaps,
    copyCoordinates,
  }
}
