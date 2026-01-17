import type { NavigatorScreenParams } from '@react-navigation/native'
import type { SectorUI } from '@/types/ui'

/**
 * Tab Navigator param list - main tabs with persistent bottom nav
 */
export type MainTabParamList = {
  Explorer: undefined
  Map: undefined
  Performance: undefined
  Settings: undefined
}

/**
 * Root Stack Navigator param list
 */
export type RootStackParamList = {
  Auth: undefined
  MainTabs: NavigatorScreenParams<MainTabParamList>
  Search: { sectors: SectorUI[]; originTab?: keyof MainTabParamList }
  Crag: { zoneId: string; zoneName: string; originTab?: keyof MainTabParamList }
  Sector: {
    sectorId: string
    sectorName: string
    /** When true, fetches routes from crag endpoint (for virtual sectors) */
    isCragRoutes?: boolean
    originTab?: keyof MainTabParamList
  }
  LogAscent: {
    routeId: string
    routeName: string
    routeGrade: string
    routeGradeBand: number
    routeGradeSecondary?: string
    routeImage?: string
    sectorName: string
    location: string
    originTab?: keyof MainTabParamList
  }
}
