import type { GeometryData } from '@climb-zone/shared'
import { Injectable, logger } from '@OneJs/core'
import type {
  ScrapedCragNode,
  ScrapedNodeInfo,
  ScrapedRouteData,
} from '@scraper-thecrag/domain/dtos/scraped-node.dto'

// Node types that can have children
type NodeType = 'Region' | 'Area' | 'Crag' | 'Sector' | 'Cliff'

interface RawChildData {
  id: number
  name: string
  type: string
  geometry?: GeometryData
  [key: string]: unknown
}

/**
 * TheCrag API Scraper
 * Extracts climbing data from TheCrag's internal API
 */
@Injectable()
export class TheCragApiScraper {
  private readonly BASE_URL = 'https://www.thecrag.com'
  private readonly USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'

  private cookie: string = ''
  private delayMs: number = 50

  /**
   * Set authentication cookie for API requests
   */
  setCookie(cookie: string): void {
    this.cookie = cookie
  }

  /**
   * Set delay between requests (rate limiting)
   */
  setDelay(ms: number): void {
    this.delayMs = ms
  }

  /**
   * Scrape a complete crag with all children and routes
   */
  async scrapeCrag(
    cragId: number,
    name: string,
    type = 'Crag',
  ): Promise<ScrapedCragNode> {
    return this.traverse(cragId, name, type, 0, null)
  }

  /**
   * Recursively traverse the crag hierarchy
   */
  private async traverse(
    nodeId: number,
    name: string,
    type: string,
    depth: number,
    geometryFromParent: GeometryData | null,
  ): Promise<ScrapedCragNode> {
    const node: ScrapedCragNode = {
      id: nodeId,
      name,
      type,
      children: [],
    }

    logger.info('scraper:thecrag', `Traversing node: ${name} (type: ${type})`)

    // Only expand nodes that can have children
    const expandableTypes: NodeType[] = [
      'Region',
      'Area',
      'Crag',
      'Sector',
      'Cliff',
    ]

    if (expandableTypes.includes(type as NodeType)) {
      await this.delay()

      // Paralelizar las 3 llamadas principales
      const needsRoutes = ['Sector', 'Cliff', 'Crag'].includes(type)
      const [info, children, routes] = await Promise.all([
        this.getNodeInfo(nodeId),
        this.getChildren(nodeId),
        needsRoutes ? this.getRoutes(nodeId) : Promise.resolve([]),
      ])

      logger.debug('scraper:thecrag', `Info: ${JSON.stringify(info)}`)
      logger.debug('scraper:thecrag', `Children: ${JSON.stringify(children)}`)
      logger.debug('scraper:thecrag', `Routes: ${JSON.stringify(routes)}`)

      if (info) {
        node.info = info
      }

      // Use geometry from parent if available (from children/area endpoint)
      if (geometryFromParent) {
        node.info = node.info || {}
        node.info.geometry = geometryFromParent
        if (geometryFromParent.lat && geometryFromParent.long) {
          node.info.googleMapsUrl = `https://www.google.com/maps?q=${geometryFromParent.lat},${geometryFromParent.long}`
        }
      }

      // Procesar hijos en paralelo (con límite de concurrencia)
      node.children = await this.traverseChildrenInBatches(children, depth)

      // Asignar rutas si las hay
      if (routes.length > 0) {
        node.routes = routes
      }
    }

    return node
  }

  /**
   * Traverse children in parallel batches to avoid overwhelming the server
   */
  private async traverseChildrenInBatches(
    children: RawChildData[],
    depth: number,
  ): Promise<ScrapedCragNode[]> {
    const BATCH_SIZE = 3 // Procesar 3 nodos en paralelo
    const results: ScrapedCragNode[] = []

    for (let i = 0; i < children.length; i += BATCH_SIZE) {
      const batch = children.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map((child) =>
          this.traverse(
            child.id,
            child.name,
            child.type,
            depth + 1,
            child.geometry ?? null,
          ),
        ),
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Get children of a node (sub-areas)
   */
  async getChildren(nodeId: number): Promise<RawChildData[]> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId}/children/area?flatten=data[id,name,urlStub,urlAncestorStub,subAreaCount,subType,asciiName,approach,map,geo,location,geolocation,geometry,lat,lng,latitude,longitude,image,images,photo,photos,coverImage,thumbnail,media,numberPhotos]&expires=10`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed[0] ?? []

    // Parse array format: [id, name, urlStub, urlAncestorStub, subAreaCount, subType, asciiName, approach, map, geo, location, geolocation, geometry, ...]
    return data.map((item: unknown[]) => ({
      id: item[0] as number,
      name: item[1] as string,
      type: (item[5] as string) || 'Area',
      geometry: item[12] as GeometryData | undefined,
    }))
  }

  /**
   * Get routes for a node
   */
  async getRoutes(nodeId: number): Promise<ScrapedRouteData[]> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId}/children/route?flatten=data[id,name,grade,gradeIndex,height,pitches,quality,stars,ascents,subType,bolts,firstAscent,tags,warnings]&expires=10`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed[0] ?? []

    // Parse array format: [id, name, grade, gradeIndex, height, pitches, quality, stars, ascents, subType, bolts, firstAscent, tags, warnings]
    return data.map((r: unknown[]) => ({
      id: Number(r[0]),
      name: r[1] as string,
      grade: (r[2] as string) || null,
      gradeIndex: (r[3] as number) || null,
      height: this.parseHeight(r[4]),
      pitches: (r[5] as number) ?? null,
      quality: (r[6] as number) ?? null,
      stars: (r[7] as number) ?? null,
      ascents: (r[8] as number) ?? null,
      subType: (r[9] as string) ?? null,
      bolts: (r[10] as number) ?? null,
      firstAscent: (r[11] as string) ?? null,
      tags: r[12] ?? null,
      warnings: r[13] ?? null,
    }))
  }

  /**
   * Get detailed info for a node
   */
  async getNodeInfo(nodeId: number): Promise<ScrapedNodeInfo | null> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId}?show=info,description,approach,access,beta,history,ethics,tags`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed.data || parsed

    const info: ScrapedNodeInfo = {}

    // Guardar respuesta completa para análisis futuro
    info.apiResponseRaw = data

    // DEBUG: Buscar 'aspect' en toda la respuesta
    // const dataStr = JSON.stringify(data)
    // if (dataStr.includes('aspect') || dataStr.includes('orientation') || dataStr.includes('facing')) {
    //   console.log(`🔍 Node ${nodeId} tiene aspect/orientation/facing en algún lugar:`)
    //   console.log(JSON.stringify(data, null, 2).substring(0, 500))
    // }

    // Geometry
    // if (data.geometry) {
    //   info.geometry = data.geometry
    //   if (data.geometry.lat && data.geometry.lng) {
    //     info.googleMapsUrl = `https://www.google.com/maps?q=${data.geometry.lat},${data.geometry.lng}`
    //   }
    // }

    // Metadata
    if (data.seasonality) info.seasonality = data.seasonality
    if (data.tags) {
      info.tags = data.tags
      // Parse structured tags from raw tags object
      const parsedTags = this.parseTagsToStructuredFields(data.tags)
      if (parsedTags.orientation) info.orientation = parsedTags.orientation
      if (parsedTags.rockType) info.rockType = parsedTags.rockType
      if (parsedTags.climbingStyle && parsedTags.climbingStyle.length > 0)
        info.climbingStyle = parsedTags.climbingStyle
      if (parsedTags.sunExposure) info.sunExposure = parsedTags.sunExposure
      if (parsedTags.sheltered !== undefined)
        info.sheltered = parsedTags.sheltered
    }

    // Beta (approach, description, etc.)
    if (data.beta && Array.isArray(data.beta) && data.beta.length > 0) {
      info.beta = data.beta
    }

    // Statistics
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

    // Additional info
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
  }

  /**
   * Parse TheCrag tags object into structured fields
   * Tags typically contain: orientation, rock type, climbing style, etc.
   */
  private parseTagsToStructuredFields(tags: Record<string, unknown>): {
    orientation?: string
    rockType?: string
    climbingStyle?: string[]
    sunExposure?: string
    sheltered?: boolean
  } {
    const result: {
      orientation?: string
      rockType?: string
      climbingStyle?: string[]
      sunExposure?: string
      sheltered?: boolean
    } = {}

    // Common tag keys that TheCrag uses (may vary)
    // Orientation
    if (tags.orientation || tags.facing || tags.aspect) {
      result.orientation = String(
        tags.orientation || tags.facing || tags.aspect,
      )
    }

    // Rock type
    if (tags.rockType || tags.rock || tags['rock-type']) {
      result.rockType = String(tags.rockType || tags.rock || tags['rock-type'])
    }

    // Climbing style (can be multiple)
    const styleKeys = [
      'style',
      'climbingStyle',
      'type',
      'angle',
      'feature',
      'features',
    ]
    const styles: string[] = []
    for (const key of styleKeys) {
      if (tags[key]) {
        const value = tags[key]
        if (Array.isArray(value)) {
          styles.push(...value.map(String))
        } else if (typeof value === 'string') {
          styles.push(value)
        }
      }
    }
    if (styles.length > 0) {
      result.climbingStyle = styles
    }

    // Sun exposure
    if (tags.sun || tags.shade || tags.exposure || tags.sunExposure) {
      result.sunExposure = String(
        tags.sun || tags.shade || tags.exposure || tags.sunExposure,
      )
    }

    // Sheltered
    if (tags.sheltered !== undefined) {
      result.sheltered = Boolean(tags.sheltered)
    } else if (tags.protected !== undefined) {
      result.sheltered = Boolean(tags.protected)
    } else if (tags.wind !== undefined) {
      result.sheltered = String(tags.wind).toLowerCase().includes('protected')
    }

    return result
  }

  /**
   * Parse height value (can be array [value, unit] or number)
   */
  private parseHeight(height: unknown): number | null {
    if (height === null || height === undefined) return null

    if (Array.isArray(height) && height.length >= 1) {
      const value = parseFloat(String(height[0]))
      return isNaN(value) ? null : value
    }

    if (typeof height === 'number') return height
    if (typeof height === 'string') {
      const value = parseFloat(height)
      return isNaN(value) ? null : value
    }

    return null
  }

  /**
   * Make HTTP request using curl (bypasses some anti-bot measures)
   */
  private async curlRequest(url: string): Promise<string> {
    const args = [
      'curl',
      url,
      '--globoff',
      '--compressed',
      '-s',
      '-H',
      `User-Agent: ${this.USER_AGENT}`,
      '-H',
      'Accept: */*',
      '-H',
      'Accept-Language: en-US,en;q=0.5',
      '-H',
      'Accept-Encoding: gzip, deflate, br, zstd',
      '-H',
      `Referer: ${this.BASE_URL}/en/climbing/world`,
      '-H',
      'X-Requested-With: XMLHttpRequest',
      '-H',
      'Connection: keep-alive',
      '-H',
      'Sec-Fetch-Dest: empty',
      '-H',
      'Sec-Fetch-Mode: cors',
      '-H',
      'Sec-Fetch-Site: same-origin',
      '-H',
      'TE: trailers',
    ]

    if (this.cookie) {
      args.push('-H', `Cookie: ${this.cookie}`)
    }

    const proc = Bun.spawn(args)
    return await new Response(proc.stdout).text()
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.delayMs))
  }
}
