export interface TopoAnnotationCreateDto {
  id: string
  topoId: string
  routeId?: string | null
  externalRouteId?: string | null
  type: string
  num: string
  order: number
  zindex?: string | null
  points: string
  color?: string | null
  name: string
  grade?: string | null
  gradeClass?: string | null
  stars?: string | null
  style?: string | null
  url?: string | null
}
