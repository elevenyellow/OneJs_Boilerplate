import { useState, useCallback } from 'react'
import { colors } from '@/theme/colors'
import type {
  RouteDto,
  SectorPhotoWithAreasDto,
  GradeCategory,
} from '@/types/api'
import type {
  SectorRouteSelectionState,
  SectorRouteSelectionHandlers,
} from '@/components/sector/types'

type GradeColorKey = 'easy' | 'medium' | 'hard' | 'extreme'

function isGradeColorKey(category: GradeCategory): category is GradeColorKey {
  return category !== 'unknown'
}

interface UseSectorRouteSelectionProps {
  routes: RouteDto[]
  photos: SectorPhotoWithAreasDto[] | null
}

interface UseSectorRouteSelectionReturn
  extends SectorRouteSelectionState,
    SectorRouteSelectionHandlers {}

export function useSectorRouteSelection({
  routes,
  photos,
}: UseSectorRouteSelectionProps): UseSectorRouteSelectionReturn {
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>()
  const [selectedRouteExternalId, setSelectedRouteExternalId] = useState<
    string | undefined
  >()
  const [selectedRouteColor, setSelectedRouteColor] = useState<
    string | undefined
  >()
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  const hasTopoPhotos = photos && photos.length > 0

  // Find which photo contains a specific route
  const findPhotoIndexForRoute = useCallback(
    (routeId: string, routeExternalId?: string): number => {
      if (!hasTopoPhotos || !photos?.length) return -1

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        if (
          photo.routeLines?.some(
            (line) =>
              line.routeId === routeId ||
              line.id === routeId ||
              (routeExternalId && line.externalRouteId === routeExternalId),
          )
        ) {
          return i
        }
      }
      return -1
    },
    [hasTopoPhotos, photos],
  )

  // Handle photo change - clear route selection when changing photos
  const handlePhotoChange = useCallback((index: number) => {
    setSelectedPhotoIndex(index)
    setSelectedRouteId(undefined)
    setSelectedRouteExternalId(undefined)
    setSelectedRouteColor(undefined)
  }, [])

  // Handle route selection - switch to the photo containing the route
  const handleRouteSelect = useCallback(
    (
      routeId: string,
      routeExternalId?: string,
      gradeCategory?: GradeCategory,
    ) => {
      setSelectedRouteId(routeId)
      setSelectedRouteExternalId(routeExternalId)

      // Set the color based on the route's gradeCategory
      if (gradeCategory && isGradeColorKey(gradeCategory)) {
        setSelectedRouteColor(colors.grade[gradeCategory])
      } else {
        setSelectedRouteColor(undefined)
      }

      // Find and switch to the photo that contains this route
      const photoIndex = findPhotoIndexForRoute(routeId, routeExternalId)
      if (photoIndex !== -1 && photoIndex !== selectedPhotoIndex) {
        setSelectedPhotoIndex(photoIndex)
      }
    },
    [findPhotoIndexForRoute, selectedPhotoIndex],
  )

  // Handle route selection from topo viewer
  const handleRoutePress = useCallback(
    (routeId: string) => {
      // Find the route to get its external ID and grade category
      const route = routes.find(
        (r) => r.id === routeId || r.externalId === routeId,
      )

      if (route) {
        setSelectedRouteId(route.id)
        setSelectedRouteExternalId(route.externalId)

        // Set the color based on the route's gradeCategory
        if (route.gradeCategory && isGradeColorKey(route.gradeCategory)) {
          setSelectedRouteColor(colors.grade[route.gradeCategory])
        } else {
          setSelectedRouteColor(undefined)
        }
      } else {
        // Fallback if route not found in list (might be matching by annotation ID or external ID)
        // Set both IDs to the same value to maximize matching chances
        setSelectedRouteId(routeId)
        setSelectedRouteExternalId(routeId)
        setSelectedRouteColor(undefined)
      }
    },
    [routes],
  )

  return {
    // State
    selectedRouteId,
    selectedRouteExternalId,
    selectedRouteColor,
    selectedPhotoIndex,
    // Handlers
    handleRouteSelect,
    handleRoutePress,
    handlePhotoChange,
  }
}
