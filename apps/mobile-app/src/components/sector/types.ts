import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from '@/navigation/types'
import type { GradeCategory } from '@/types/api'

export type ContentMode = 'routes' | 'subsectors'

export interface SectorNavigationProp {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Sector'>
  route: RouteProp<RootStackParamList, 'Sector'>
}

export interface SectorRouteSelectionState {
  selectedRouteId: string | undefined
  selectedRouteExternalId: string | undefined
  selectedRouteColor: string | undefined
  selectedPhotoIndex: number
}

export interface SectorRouteSelectionHandlers {
  handleRouteSelect: (
    routeId: string,
    routeExternalId?: string,
    gradeCategory?: GradeCategory,
  ) => void
  handleRoutePress: (routeId: string) => void
  handlePhotoChange: (index: number) => void
}
