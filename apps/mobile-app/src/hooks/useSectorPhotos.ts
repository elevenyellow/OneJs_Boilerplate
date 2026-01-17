import { useMemo } from 'react'
import type { SectorWithPhoto } from '@/components/crag/types'
import type { ZoneOverviewWithSectorsDto, SectorDto } from '@/types/api'

interface UseSectorPhotosResult {
  sectorsWithPhotos: SectorWithPhoto[]
  mainCragImage: string
}

export function useSectorPhotos(
  zoneData: ZoneOverviewWithSectorsDto | null | undefined,
): UseSectorPhotosResult {
  const mainCragImage = useMemo(() => {
    if (!zoneData?.photos?.length) return ''
    const overviewPhoto = zoneData.photos.find((p) => p.isOverview)
    return (
      overviewPhoto?.fullImageUrl ||
      overviewPhoto?.thumbnailUrl ||
      zoneData.photos[0]?.fullImageUrl ||
      zoneData.photos[0]?.thumbnailUrl ||
      ''
    )
  }, [zoneData])

  const sectorsWithPhotos = useMemo<SectorWithPhoto[]>(() => {
    if (!zoneData?.sectors) return []

    const sectors = zoneData.sectors.map((sector: SectorDto) => {
      // Use headerImage directly from sector database field
      const hasOwnPhoto = !!sector.headerImage

      // Fallback to main crag image if sector has no headerImage
      const imageUrl = sector.headerImage || mainCragImage

      return {
        id: sector.id,
        externalId: sector.externalId,
        name: sector.name,
        numberRoutes: sector.numberRoutes ?? 0,
        hasSubSectors: sector.hasSubSectors,
        hasTopo: sector.hasTopo,
        depth: sector.depth,
        imageUrl,
        hasOwnPhoto,
        numberTopos: sector.numberTopos,
        kudos: sector.kudos,
        subAreaCount: sector.subAreaCount,
        averageHeight: sector.averageHeight,
        averageHeightUnit: sector.averageHeightUnit,
        aspect: sector.aspect,
        walkInTime: sector.walkInTime,
        climbingStyle: sector.climbingStyle,
        tagFamily: sector.tagFamily,
        tagWeather: sector.tagWeather,
        tagCrowds: sector.tagCrowds,
        gbRoutes: sector.gbRoutes,
        gbAscents: sector.gbAscents,
        minGradeBand: sector.minGradeBand,
        maxGradeBand: sector.maxGradeBand,
        aspectLabel: sector.aspectLabel,
        walkInTimeLabel: sector.walkInTimeLabel,
        familyLabel: sector.familyLabel,
        weatherLabels: sector.weatherLabels,
        crowdsLabel: sector.crowdsLabel,
        starRating: sector.starRating,
        latitude: sector.latitude,
        longitude: sector.longitude,
        approach: sector.approach,
        beta: sector.beta,
      }
    })

    // Sort by importance criteria
    return sectors.sort((a, b) => {
      // 1. Kudos (higher is better)
      const kudosA = a.kudos || 0
      const kudosB = b.kudos || 0
      if (kudosA !== kudosB) return kudosB - kudosA

      // 2. Number of routes (higher is better)
      if (a.numberRoutes !== b.numberRoutes) {
        return b.numberRoutes - a.numberRoutes
      }

      // 3. Has own photo (true is better)
      if (a.hasOwnPhoto !== b.hasOwnPhoto) {
        return a.hasOwnPhoto ? -1 : 1
      }

      // 4. Has topo (true is better)
      if (a.hasTopo !== b.hasTopo) {
        return a.hasTopo ? -1 : 1
      }

      // 5. Alphabetical by name as final tiebreaker
      return a.name.localeCompare(b.name)
    })
  }, [zoneData, mainCragImage])

  return {
    sectorsWithPhotos,
    mainCragImage,
  }
}
