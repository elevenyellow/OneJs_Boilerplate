import type { TopoAnnotationCreateDto } from './topo-annotation-create.dto'

export interface TopoCreateDto {
  id: string
  externalId: string
  thumbnailUrl: string
  fullImageUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  viewScale: number
  isOverview: boolean
  hasRoutes: boolean
  cragId: string | null
  sectorId: string | null
  annotations: TopoAnnotationCreateDto[]
  createdAt: Date
  updatedAt: Date
}
