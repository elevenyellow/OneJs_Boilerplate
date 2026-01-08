const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

// Tipos que puede tener un nodo
type NodeType = 'Region' | 'Area' | 'Crag' | 'Sector' | 'Cliff'

interface Route {
  id: number
  name: string
  grade?: string
  gradeIndex?: number
  height?: unknown
  pitches?: number | null
  quality?: number | null
  stars?: number | null
  ascents?: number | null
  subType?: string
  bolts?: number | null
  firstAscent?: string | null
  tags?: unknown
  warnings?: unknown
}

interface Geometry {
  lat: number
  long: number
  center?: [number, number]
  bbox?: [string, string, string, string]
  boundary?: number[][][]
  areasize?: number
  point?: [string, string]
}

interface BetaItem {
  name: string
  markdown: string
}

interface NodeInfo {
  // Coordenadas y geometría
  geometry?: Geometry
  googleMapsUrl?: string
  // Metadata
  seasonality?: number[]
  tags?: Record<string, unknown>
  // Beta (approach, description, etc.)
  beta?: BetaItem[]
  // Estadísticas
  ascentCount?: number
  averageHeight?: number
  displayAverageHeight?: string
  numberRoutes?: number
  numberPhotos?: number
  numberTopos?: number
  hasTopo?: boolean
  subAreaCount?: number
  totalFavorites?: number
  kudos?: number
  maxPop?: number
  // Info adicional
  altNames?: string[]
  description?: string
  approach?: string
  siblingLabel?: string
  priceCategory?: string
  permitNode?: unknown
  locatedness?: number
  // URLs
  urlStub?: string
  urlAncestorStub?: string
  urlShortestStub?: string
  urlShortestAncestorStub?: string
  redirectStubs?: string[]
  // PDF
  lastPDFSize?: number
  lastPDFStaticDate?: string
  lastPDFStaticSize?: number
  // Flags
  isTLC?: boolean
  hide?: boolean
  hasUnarchivedChildren?: boolean
  unique?: boolean
}

interface CragNode {
  id: number
  name: string
  type: string
  info?: NodeInfo
  children: CragNode[]
  routes?: Route[]
}

async function curlRequest(url: string): Promise<string> {
  const proc = Bun.spawn([
    'curl',
    url,
    '--globoff',
    '--compressed',
    '-s',
    '-H',
    'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
    '-H',
    'Accept: */*',
    '-H',
    'Accept-Language: en-US,en;q=0.5',
    '-H',
    'Accept-Encoding: gzip, deflate, br, zstd',
    '-H',
    'Referer: https://www.thecrag.com/en/climbing/world',
    '-H',
    'X-Requested-With: XMLHttpRequest',
    '-H',
    'Connection: keep-alive',
    '-H',
    `Cookie: ${COOKIE}`,
    '-H',
    'Sec-Fetch-Dest: empty',
    '-H',
    'Sec-Fetch-Mode: cors',
    '-H',
    'Sec-Fetch-Site: same-origin',
    '-H',
    'TE: trailers',
  ])

  return await new Response(proc.stdout).text()
}

async function getChildren(nodeId: number | string): Promise<unknown[][]> {
  // Añadimos todos los campos posibles incluyendo imágenes
  const url = `https://www.thecrag.com/api/node/id/${nodeId}/children/area?flatten=data[id,name,urlStub,urlAncestorStub,subAreaCount,subType,asciiName,approach,map,geo,location,geolocation,geometry,lat,lng,latitude,longitude,image,images,photo,photos,coverImage,thumbnail,media,numberPhotos]&expires=10`
  const output = await curlRequest(url)

  try {
    const parsed = JSON.parse(output)
    return parsed[0] ?? []
  } catch {
    console.error(`Error parsing children for node ${nodeId}`)
    return []
  }
}

async function getRoutes(nodeId: number | string): Promise<unknown[][]> {
  const url = `https://www.thecrag.com/api/node/id/${nodeId}/children/route?flatten=data[id,name,grade,gradeIndex,height,pitches,quality,stars,ascents,subType,bolts,firstAscent,tags,warnings]&expires=10`
  const output = await curlRequest(url)

  try {
    const parsed = JSON.parse(output)
    return parsed[0] ?? []
  } catch {
    console.error(`Error parsing routes for node ${nodeId}`)
    return []
  }
}

async function getNodeInfo(nodeId: number | string): Promise<NodeInfo | null> {
  // Endpoint con show=info,beta,... para obtener approach, description, etc.
  const url = `https://www.thecrag.com/api/node/id/${nodeId}?show=info,description,approach,access,beta,history,ethics`
  const output = await curlRequest(url)

  try {
    const parsed = JSON.parse(output)
    // Los datos vienen en parsed.data cuando usamos ?show=
    const data = parsed.data || parsed

    // Extraer todos los campos disponibles
    const info: NodeInfo = {}

    // Coordenadas
    if (data.geometry) {
      info.geometry = data.geometry
      if (data.geometry.lat && data.geometry.lng) {
        info.googleMapsUrl = `https://www.google.com/maps?q=${data.geometry.lat},${data.geometry.lng}`
      }
    }

    // Metadata
    if (data.seasonality) info.seasonality = data.seasonality
    if (data.tags) info.tags = data.tags

    // Beta (contiene approach, description, etc.)
    if (data.beta && Array.isArray(data.beta) && data.beta.length > 0) {
      info.beta = data.beta
    }

    // Estadísticas
    if (data.ascentCount) info.ascentCount = data.ascentCount
    if (data.averageHeight) info.averageHeight = data.averageHeight
    if (data.displayAverageHeight)
      info.displayAverageHeight = data.displayAverageHeight
    if (data.numberRoutes) info.numberRoutes = data.numberRoutes
    if (data.numberPhotos) info.numberPhotos = data.numberPhotos
    if (data.numberTopos) info.numberTopos = data.numberTopos
    if (data.hasTopo !== undefined) info.hasTopo = data.hasTopo
    if (data.subAreaCount) info.subAreaCount = data.subAreaCount
    if (data.totalFavorites) info.totalFavorites = data.totalFavorites
    if (data.kudos) info.kudos = data.kudos
    if (data.maxPop) info.maxPop = data.maxPop

    // Info adicional
    if (data.altNames) info.altNames = data.altNames
    if (data.description) info.description = data.description
    if (data.approach) info.approach = data.approach
    if (data.siblingLabel) info.siblingLabel = data.siblingLabel
    if (data.priceCategory) info.priceCategory = data.priceCategory
    if (data.permitNode) info.permitNode = data.permitNode
    if (data.locatedness) info.locatedness = data.locatedness

    // URLs
    if (data.urlStub) info.urlStub = data.urlStub
    if (data.urlAncestorStub) info.urlAncestorStub = data.urlAncestorStub
    if (data.urlShortestStub) info.urlShortestStub = data.urlShortestStub
    if (data.urlShortestAncestorStub)
      info.urlShortestAncestorStub = data.urlShortestAncestorStub
    if (data.redirectStubs) info.redirectStubs = data.redirectStubs

    // PDF
    if (data.lastPDFSize) info.lastPDFSize = data.lastPDFSize
    if (data.lastPDFStaticDate) info.lastPDFStaticDate = data.lastPDFStaticDate
    if (data.lastPDFStaticSize) info.lastPDFStaticSize = data.lastPDFStaticSize

    // Flags
    if (data.isTLC !== undefined) info.isTLC = data.isTLC
    if (data.hide !== undefined) info.hide = data.hide
    if (data.hasUnarchivedChildren !== undefined)
      info.hasUnarchivedChildren = data.hasUnarchivedChildren
    if (data.unique !== undefined) info.unique = data.unique

    return Object.keys(info).length > 0 ? info : null
  } catch {
    console.error(`Error parsing info for node ${nodeId}`)
    return null
  }
}

// Delay para no saturar la API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function traverse(
  nodeId: number | string,
  name: string,
  type: string,
  depth = 0,
  geometryFromParent?: Geometry | null,
): Promise<CragNode> {
  const indent = '  '.repeat(depth)
  console.log(`${indent}📍 ${name} (${type})`)

  const node: CragNode = {
    id: Number(nodeId),
    name,
    type,
    children: [],
  }

  // Solo buscamos hijos si es un tipo que puede tenerlos
  const expandableTypes: NodeType[] = [
    'Region',
    'Area',
    'Crag',
    'Sector',
    'Cliff',
  ]

  if (expandableTypes.includes(type as NodeType)) {
    await delay(100)

    // Obtener info del nodo
    const info = await getNodeInfo(nodeId)
    if (info) {
      node.info = info
    }

    // Si tenemos geometry del parent (viene del endpoint children/area), usarla
    if (geometryFromParent) {
      node.info = node.info || {}
      node.info.geometry = geometryFromParent
      if (geometryFromParent.lat && geometryFromParent.long) {
        node.info.googleMapsUrl = `https://www.google.com/maps?q=${geometryFromParent.lat},${geometryFromParent.long}`
      }
    }

    await delay(100)

    // Obtener sub-áreas
    const areas = await getChildren(nodeId)

    for (const area of areas) {
      // [id, name, urlStub, urlAncestorStub, subAreaCount, subType, asciiName, approach, map, geo, location, geolocation, geometry, lat, lng, latitude, longitude]
      const [childId, childName, , , , childType, , , , , , , geometry] = area
      const childNode = await traverse(
        childId as string | number,
        childName as string,
        childType as string,
        depth + 1,
        geometry as Geometry | null,
      )
      node.children.push(childNode)
    }

    // Obtener rutas (solo para Sector, Cliff, Crag)
    if (['Sector', 'Cliff', 'Crag'].includes(type)) {
      await delay(100)
      const routes = await getRoutes(nodeId)

      if (routes.length > 0) {
        // [id, name, grade, gradeIndex, height, pitches, quality, stars, ascents, subType, bolts, firstAscent, tags, warnings]
        node.routes = routes.map((r) => ({
          id: Number(r[0]),
          name: r[1] as string,
          grade: r[2] as string | undefined,
          gradeIndex: r[3] as number | undefined,
          height: r[4],
          pitches: r[5] as number | null,
          quality: r[6] as number | null,
          stars: r[7] as number | null,
          ascents: r[8] as number | null,
          subType: r[9] as string | undefined,
          bolts: r[10] as number | null,
          firstAscent: r[11] as string | null,
          tags: r[12],
          warnings: r[13],
        }))
        console.log(`${indent}  🧗 ${routes.length} rutas`)
      }
    }
  }

  return node
}

// Chulilla, Valencia, España
const CHULILLA_ID = 102885222

console.log('🧗 Obteniendo datos de Chulilla...\n')

const chulillaData = await traverse(CHULILLA_ID, 'Chulilla', 'Crag')

await Bun.write('chulilla_data.json', JSON.stringify(chulillaData, null, 2))

console.log('\n✅ Datos de Chulilla guardados en chulilla_data.json')
