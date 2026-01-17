// ===== Tipos comunes =====

export interface AltName {
  name: string
  type: string
}

export type HeightTuple = [number | string, string]

export interface HideFlags {
  [key: string]: unknown
}

export interface NodeReference {
  node: {
    id: string | number
  }
}

export interface BaseQuery {
  entity: string
  id: string
  request: string
}

export interface NodeInfoQuery extends BaseQuery {
  show: string[]
}

export interface ChildrenQuery extends BaseQuery {
  arg: string
}

// ===== Beta (Approach, Description, etc.) =====

export interface BetaItem {
  markdown: string
  name: string
  inheritedFrom?: {
    id: string
    urlAncestorStub: string
  }
}

// ===== Geometry =====

export interface Geometry {
  areasize?: number
  bbox?: string[]
  boundary?: number[][][]
  center?: number[]
  lat?: number
  long?: number
  point?: string[]
}

// ===== Styles =====

export interface StyleInfo {
  gradeBand: number[]
  label: string
  style: string
  total: number
  translate_stub: string
}

// ===== Tags =====

export interface TagItem {
  id: number
  name: string
  hasIcon?: number
}

export type TagsMap = Record<string, Record<string, TagItem>>

// ===== NodeInfo =====

export interface NodeInfoData {
  // Identificación
  id: string | number
  name: string
  asciiName?: string
  altNames?: AltName[]
  type: string
  subType: string
  urlStub?: string
  urlAncestorStub?: string
  unique?: string

  // Jerarquía
  parentID?: number
  childIDs?: (string | number)[]
  depth?: number
  siblingLabel?: number
  subAreaCount?: number // Solo si tiene sub-áreas

  // Ubicación
  geometry?: Geometry

  // Estadísticas
  numberRoutes?: number
  numberPhotos?: number
  numberTopos?: number
  ascentCount?: number
  totalFavorites?: number
  kudos?: number
  maxPop?: number
  locatedness?: number

  // Grados y estilos
  averageHeight?: HeightTuple
  displayAverageHeight?: HeightTuple
  gbAscents?: number[]
  gbRoutes?: number[]
  styles?: StyleInfo[]

  // Contenido
  beta?: BetaItem[]
  tags?: TagsMap

  // Metadatos
  seasonality?: number[]
  hasTopo?: number
  hasUnarchivedChildren?: number
  hide?: HideFlags
  isTLC?: number
  priceCategory?: string
  routeCountEstimate?: number

  // Referencias
  permitNode?: NodeReference
  tlc?: NodeReference

  // PDF
  lastPDFSize?: string
  lastPDFStaticDate?: string
  lastPDFStaticSize?: string

  // Otros
  redirectStubs?: unknown[]
}

export interface NodeInfoResponse {
  data: NodeInfoData
  query: NodeInfoQuery
}

// ===== NodeChildren (flatten response) =====

// La respuesta de /children/area y /children/route con flatten
// viene como array de arrays: [[[campo1, campo2, ...], [campo1, campo2, ...], ...]]
export type FlattenResponse = unknown[][][]

// Para tipar los campos parseados de un área
export interface ParsedAreaChild {
  id: string | number
  name: string
  urlStub?: string | null
  urlAncestorStub?: string | null
  subAreaCount?: number | null
  subType: string
  asciiName?: string
  approach?: string | null
  geometry?: Geometry | null
  numberPhotos?: number | null
  type: string
  depth?: number
  numberRoutes?: number | null
  ascentCount?: number | null
  numberTopos?: number | null
  kudos?: number | null
  averageHeight?: HeightTuple | null
}

// ===== ScrapedRoute: Tipo unificado para rutas (32 campos API + 11 campos HTML) =====

export interface ScrapedRoute {
  // ─────────────────────────────────────
  // Campos de la API (32 campos)
  // ─────────────────────────────────────

  // Identificación
  id: string | number
  name: string
  type: string

  // Grado
  grade: string | null
  gradeAtom: GradeAtom | null
  gradeBand: number
  gradeStyle: string
  gradeInContext: string | null
  rawGrade: [number, number] | null

  // Dimensiones
  height: HeightTuple | null
  displayHeight: HeightTuple | null
  pitches: number | null

  // Calidad
  qualityScore: number | null
  stars: number | null

  // Ascensiones
  ascents: number | null
  ascentCount: number | null

  // Estilo
  style: string | null
  styleStub: string | null

  // Equipamiento (API)
  bolts: number | null
  firstAscent: string | null

  // Metadata
  tags: unknown | null
  warnings: unknown | null
  flags: RouteFlags | null

  // Popularidad
  popularity: number | null
  relativePopularity: number | null
  cragScore: number | null

  // Jerarquía
  siblingLabel: number
  parentID: string | number
  depth: number
  context: string

  // URLs
  urlAncestorStub: string | null

  // Descripción (API)
  description: string | null

  // ─────────────────────────────────────
  // Campos del HTML (11 campos)
  // ─────────────────────────────────────

  // Equipamiento (HTML)
  equipper: string | null
  equipDate: string | null

  // Mantenimiento
  maintainer: string | null
  maintDate: string | null

  // Descripción HTML
  descriptionHtml: string | null

  // Nombres alternativos
  akaNames: string[]

  // Estado
  isClosed: boolean
  hasWarning: boolean
  warningText: string | null

  // Topo
  hasTopoHtml: boolean
  topoNumber: string | null
}

// ===== GradeAtom =====

export interface GradeAtom {
  context: string
  grade?: string
  gradeBand: number
  gradeInContext?: string
  gradeStyle: string
  internal?: [number, number]
  type: string
}

// ===== RouteFlags =====

export interface RouteFlags {
  IsFree?: number
  IsSport?: number
  IsTrad?: number
  IsBoulder?: number
  IsAid?: number
  IsAlpine?: number
  IsMixed?: number
  IsIce?: number
  IsTopRope?: number
  [key: string]: number | undefined
}

export type AreaFlattenItem = [
  id: string | number, // 0
  name: string, // 1
  urlStub: string | null, // 2
  urlAncestorStub: string | null, // 3
  subAreaCount: number | null, // 4
  subType: string, // 5
  asciiName: string, // 6
  approach: string | null, // 7
  map: unknown | null, // 8
  geo: unknown | null, // 9
  location: unknown | null, // 10
  geolocation: unknown | null, // 11
  geometry: Geometry | null, // 12
  lat: number | null, // 13
  lng: number | null, // 14
  latitude: number | null, // 15
  longitude: number | null, // 16
  image: string | null, // 17
  images: unknown | null, // 18
  photo: string | null, // 19
  photos: unknown | null, // 20
  coverImage: string | null, // 21
  thumbnail: string | null, // 22
  media: unknown | null, // 23
  numberPhotos: number | null, // 24
  type: string, // 25
  depth: number, // 26
  numberRoutes: number | null, // 27
  ascentCount: number | null, // 28
  numberTopos: number | null, // 29
  kudos: number | null, // 30
  seasonality: number[] | null, // 31
  averageHeight: HeightTuple | null, // 32
  tags: unknown | null, // 33
  hasTopo: number | null, // 34
  parentID: number | null, // 35
  phototopo: unknown | null, // 36
]

export interface NodeChildrenResponse {
  data: [AreaFlattenItem[]] // Array con un elemento: array de áreas
  query: ChildrenQuery
}

// Basado en la query del scraper:
// flatten=data[id,name,grade,gradeAtom,gradeBand,gradeStyle,gradeInContext,rawGrade,height,displayHeight,pitches,qualityScore,stars,ascents,ascentCount,style,styleStub,bolts,firstAscent,tags,warnings,flags,popularity,relativePopularity,cragScore,siblingLabel,parentID,depth,context,type,urlAncestorStub,description]
export type RouteFlattenItem = [
  id: string | number, // 0
  name: string, // 1
  grade: string | null, // 2
  gradeAtom: GradeAtom | null, // 3
  gradeBand: number, // 4
  gradeStyle: string, // 5
  gradeInContext: string | null, // 6
  rawGrade: [number, number] | null, // 7
  height: HeightTuple | null, // 8
  displayHeight: HeightTuple | null, // 9
  pitches: number | null, // 10
  qualityScore: number | null, // 11
  stars: number | null, // 12
  ascents: number | null, // 13
  ascentCount: number | null, // 14
  style: string | null, // 15
  styleStub: string | null, // 16
  bolts: number | null, // 17
  firstAscent: string | null, // 18
  tags: unknown | null, // 19
  warnings: unknown | null, // 20
  flags: RouteFlags | null, // 21
  popularity: number | null, // 22
  relativePopularity: number | null, // 23
  cragScore: number | null, // 24
  siblingLabel: number, // 25
  parentID: string | number, // 26
  depth: number, // 27
  context: string, // 28
  type: string, // 29
  urlAncestorStub: string | null, // 30
  description: string | null, // 31
]

export interface NodeRoutesResponse {
  data: [RouteFlattenItem[]] // Array con un elemento: array de rutas
  query: ChildrenQuery
}

// ===== Tipo principal para el objeto completo =====

export interface ScrapedNode {
  id: string | number
  info: NodeInfoData
  areas: ParsedAreaChild[]
  routes: ScrapedRoute[]
  children: ScrapedNode[]
}

// ===== Versión parseada =====

export interface ParsedNodeData {
  nodeInfo: NodeInfoResponse
  nodeChildren: FlattenResponse
  nodeRoutes: FlattenResponse
}

export interface TopoImageData {
  topoId: string
  width: number
  height: number
  viewScale: number
  thumbnailUrl: string
  fullImageUrl: string
  originalWidth: number
  originalHeight: number
  routes: TopoRouteAnnotation[]
}

export interface TopoRouteAnnotation {
  id: number
  type: 'route' | 'area'
  num: string
  grade: string
  gradeClass: string
  zindex: string
  name: string
  stars: string
  style: string
  order: number
  url: string
  points: string // SVG path points
}

export interface ProcessedArea {
  // Identificación
  id: string | number
  name: string
  asciiName: string
  type: string
  subType: string

  // URLs
  urlStub: string | null
  urlAncestorStub: string | null

  // Jerarquía
  parentID: number | null
  depth: number
  subAreaCount: number | null

  // Ubicación
  geometry: Geometry | null
  approach: string | null
  lat: number | null
  lng: number | null
  latitude: number | null
  longitude: number | null
  map: unknown | null
  geo: unknown | null
  location: unknown | null
  geolocation: unknown | null

  // Imágenes (de API flatten)
  image: string | null
  images: unknown | null
  photo: string | null
  photos: unknown | null
  coverImage: string | null
  thumbnail: string | null
  media: unknown | null
  numberPhotos: number | null
  phototopo: unknown | null

  // Estadísticas
  numberRoutes: number | null
  ascentCount: number | null
  numberTopos: number | null
  kudos: number | null
  averageHeight: HeightTuple | null
  totalFavorites: number | null
  maxPop: number | null

  // Metadata
  seasonality: number[] | null
  tags: TagsMap | null
  hasTopo: number | null

  // Información detallada (de NodeInfo API)
  beta: BetaItem[] | null
  styles: StyleInfo[] | null
  altNames: AltName[] | null
  gbAscents: number[] // Now calculated from routes, never null
  gbRoutes: number[] // Now calculated from routes, never null

  // Datos HTML (scraped)
  topos: TopoImageData[]
  headerImage: string | null

  // Relaciones
  routes?: ScrapedRoute[]
  subAreas?: ProcessedArea[]
}

export interface ParentNode {
  id: string
  name: string
  href: string // URL completa
  urlStub: string // Última parte de la URL
  position: number // Posición en jerarquía
  type?: string // Tipo inferido (opcional)
}

export interface ScrapedCrag {
  id: string
  name: string
  type: string
  info: NodeInfoData
  parents?: ParentNode[] // Jerarquía completa de padres
  cragTopos?: TopoImageData[] // Para crags con sectores
  topos?: TopoImageData[] // Para crags planos
  headerImage: string | null
  areas?: ProcessedArea[] // Para crags con sectores
  routes?: ScrapedRoute[] // Para crags planos
  gbRoutes?: number[] // Grade distribution using universal grading system
  gbAscents?: number[] // Ascent distribution using universal grading system
}

export interface RouteTableInfo {
  id: string | number

  // Equipamiento
  equipper?: string | null
  equipDate?: string | null

  // Mantenimiento
  maintainer?: string | null
  maintDate?: string | null

  // Descripción
  description?: string | null

  // Nombres alternativos
  akaNames?: string[]

  // Estado
  isClosed?: boolean
  hasWarning?: boolean
  warningText?: string | null

  // Topo
  hasTopo?: boolean
  topoNumber?: string | null
}
