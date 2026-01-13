import type { GeometryData } from '@climb-zone/shared'
import { Injectable, logger } from '@OneJs/core'
import type {
  ScrapedCragNode,
  ScrapedNodeInfo,
  ScrapedRouteData,
} from '@scraper-thecrag/domain/value-objects/scraped-node.dto'
import type {
  TopoImageData,
  TopoRouteAnnotation,
} from '@scraper-thecrag/domain/value-objects/topo-image.dto'
import * as cheerio from 'cheerio'
import { DEFAULT_PROXIES, ProxyManager } from '../utils/proxy-manager'

// Node types that can have children
type NodeType = 'Region' | 'Area' | 'Crag' | 'Sector' | 'Cliff'

interface RawChildData {
  id: number
  name: string
  type: string
  geometry?: GeometryData
  urlStub?: string
  urlAncestorStub?: string
  [key: string]: unknown
}

/**
 * Parsed route details from HTML
 */
interface RouteHtmlDetails {
  id: number
  description: string | null
  beta: string | null
  protection: string | null
  rockType: string | null
  gear: string | null
  anchor: string | null
}

/**
 * TheCrag API Scraper
 * Extracts climbing data from TheCrag's internal API
 */
export interface ScraperOptions {
  /** Include photo topos for sectors (default: false) */
  includeTopos?: boolean
  /** Download and generate composite images (default: false) */
  generateComposites?: boolean
  /** Output directory for composite images */
  outputDir?: string
  /** Use proxy rotation (default: true) */
  useProxies?: boolean
}

@Injectable()
export class TheCragApiScraperOld {
  private readonly BASE_URL = 'https://www.thecrag.com'
  private readonly USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'

  private cookie: string = ''
  private delayMs: number = 50
  private options: ScraperOptions = { useProxies: true, includeTopos: true }
  private proxyManager: ProxyManager

  constructor() {
    this.proxyManager = new ProxyManager({ maxFailures: 5, cooldownMs: 60000 })
    this.proxyManager.addProxies(DEFAULT_PROXIES)
  }

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
   * Set scraper options
   */
  setOptions(options: ScraperOptions): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Enable or disable proxy usage
   */
  setUseProxies(enabled: boolean): void {
    this.options.useProxies = enabled
    if (enabled) {
      const stats = this.proxyManager.getStats()
      logger.info(
        'scraper:thecrag',
        `Proxies enabled: ${stats.active}/${stats.total} active`,
      )
    } else {
      logger.info('scraper:thecrag', 'Proxies disabled')
    }
  }

  /**
   * Add custom proxies to the pool
   */
  addProxies(proxyUrls: string[]): void {
    this.proxyManager.addProxies(proxyUrls)
  }

  /**
   * Get proxy pool stats
   */
  getProxyStats(): { total: number; active: number; disabled: number } {
    return this.proxyManager.getStats()
  }

  /**
   * Scrape a complete crag with all children and routes
   */
  async scrapeCrag(
    cragId: number,
    name: string,
    type = 'Crag',
    options?: ScraperOptions,
  ): Promise<ScrapedCragNode> {
    if (options) {
      this.options = { ...this.options, ...options }
    }
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
    urlStubFromParent?: string,
    urlAncestorStubFromParent?: string,
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

      // Paralelizar las llamadas principales
      const needsRoutes = ['Sector', 'Cliff', 'Crag'].includes(type)
      const needsSectorTopos =
        this.options.includeTopos && ['Sector', 'Cliff'].includes(type)
      const needsCragTopos = this.options.includeTopos && type === 'Crag'

      const [info, children, routes] = await Promise.all([
        this.getNodeInfo(nodeId),
        this.getChildren(nodeId),
        needsRoutes ? this.getRoutes(nodeId) : Promise.resolve([]),
      ])

      // Use urlStub from parent (children endpoint) if not in info
      const urlStub = info?.urlStub || urlStubFromParent
      const urlAncestorStub = info?.urlAncestorStub || urlAncestorStubFromParent

      // Build URL path for fetching HTML pages
      // Priority: urlStub from info/parent > fallback using urlAncestorStub + area/{nodeId}
      let sectorPath: string
      if (urlStub) {
        // Ensure there's a / between ancestor and stub if both exist
        const ancestorPart = urlAncestorStub ? `${urlAncestorStub}/` : ''
        const stubPart = urlStub.startsWith('/') ? urlStub.slice(1) : urlStub
        sectorPath = `/en/climbing/${ancestorPart}${stubPart}`
      } else if (urlAncestorStub) {
        // Use ancestor stub + area/{nodeId} format
        sectorPath = `/en/climbing/${urlAncestorStub}/area/${nodeId}`
      } else {
        // Last resort fallback (likely won't work)
        sectorPath = `/en/climbing/area/${nodeId}`
      }

      // Fetch topos from sector page (not /topos endpoint)
      let topos: TopoImageData[] = []
      if (needsSectorTopos) {
        logger.info(
          'scraper:thecrag',
          `Fetching topos for ${name} from: ${sectorPath}`,
        )
        topos = await this.getToposFromSectorPage(sectorPath)
      }

      // Fetch crag overview topos (showing sectors/areas)
      let cragTopos: TopoImageData[] = []
      if (needsCragTopos) {
        logger.info(
          'scraper:thecrag',
          `Fetching crag overview topos for ${name} from: ${sectorPath}`,
        )
        cragTopos = await this.getCragToposFromPage(sectorPath)
      }

      // Special case: Crag with direct routes (no children) - also fetch sector topos
      // Some crags like Cheste have routes directly without sub-sectors but still have route topos
      const isCragWithDirectRoutes =
        type === 'Crag' &&
        this.options.includeTopos &&
        routes.length > 0 &&
        children.length === 0
      if (isCragWithDirectRoutes) {
        logger.info(
          'scraper:thecrag',
          `Crag ${name} has direct routes - fetching sector topos from: ${sectorPath}`,
        )
        topos = await this.getToposFromSectorPage(sectorPath)
      }

      // Fetch header image for Crag, Sector, Cliff nodes
      const needsHeaderImage = ['Crag', 'Sector', 'Cliff'].includes(type)
      let headerImageUrl: string | null = null
      if (needsHeaderImage) {
        logger.info(
          'scraper:thecrag',
          `Fetching header image for ${name} from: ${sectorPath}`,
        )
        headerImageUrl = await this.getHeaderImage(nodeId, sectorPath)
      }

      logger.debug('scraper:thecrag', `Info: ${JSON.stringify(info)}`)
      logger.debug('scraper:thecrag', `Children: ${JSON.stringify(children)}`)
      logger.debug('scraper:thecrag', `Routes: ${JSON.stringify(routes)}`)
      if (topos.length > 0) {
        logger.info(
          'scraper:thecrag',
          `Found ${topos.length} topos for ${name}`,
        )
      }

      if (info) {
        node.info = info
      }

      // Assign urlStub from parent if not in info
      if (urlStub && !node.info?.urlStub) {
        node.info = node.info || {}
        node.info.urlStub = urlStub
      }
      if (urlAncestorStub && !node.info?.urlAncestorStub) {
        node.info = node.info || {}
        node.info.urlAncestorStub = urlAncestorStub
      }

      // Assign header image URL after info is set
      if (headerImageUrl) {
        node.info = node.info || {}
        node.info.headerImageUrl = headerImageUrl
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

      // Enrich routes with HTML details if we have routes and sector topos
      // This adds descriptions, beta, protection info from the HTML page
      let enrichedRoutes = routes
      if (routes.length > 0 && (needsSectorTopos || isCragWithDirectRoutes)) {
        const htmlDetails = await this.getRouteDetailsFromSectorPage(sectorPath)
        if (htmlDetails.size > 0) {
          enrichedRoutes = this.enrichRoutesWithHtmlDetails(routes, htmlDetails)
          logger.info(
            'scraper:thecrag',
            `Enriched ${htmlDetails.size} routes with HTML details for ${name}`,
          )
        }
      }

      // Asignar rutas si las hay
      if (enrichedRoutes.length > 0) {
        node.routes = enrichedRoutes
      }

      // Asignar topos si los hay
      if (topos.length > 0) {
        node.topos = topos
      }

      // Asignar crag topos si los hay
      if (cragTopos.length > 0) {
        node.cragTopos = cragTopos
        // Also store the first/main overview topo info in node.info for easy access
        const mainTopo = cragTopos[0]
        node.info = node.info || {}
        node.info.overviewTopoImageUrl = mainTopo.fullImageUrl
        node.info.overviewTopoThumbnailUrl = mainTopo.thumbnailUrl
        node.info.overviewTopoWidth = mainTopo.originalWidth
        node.info.overviewTopoHeight = mainTopo.originalHeight
        node.info.overviewTopoExternalId = mainTopo.topoId
        logger.info(
          'scraper:thecrag',
          `Set overview topo for ${name}: ${mainTopo.topoId}`,
        )
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
            child.urlStub,
            child.urlAncestorStub,
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
    const children = data.map((item: unknown[]) => ({
      id: item[0] as number,
      name: item[1] as string,
      urlStub: (item[2] as string) || undefined,
      urlAncestorStub: (item[3] as string) || undefined,
      type: (item[5] as string) || 'Area',
      geometry: item[12] as GeometryData | undefined,
    }))

    // Debug: log first child to see URL structure
    if (children.length > 0) {
      logger.info(
        'scraper:thecrag',
        `First child URL info: urlStub=${children[0].urlStub}, urlAncestorStub=${children[0].urlAncestorStub}`,
      )
    }

    return children
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
      // Fields to be enriched from HTML parsing
      description: null,
      beta: null,
      protection: null,
      rockType: null,
      gear: null,
      anchor: null,
    }))
  }

  /**
   * Get route details from sector HTML page
   * Parses route descriptions and additional info not available in the API
   * @param sectorPath - Full path like "/en/climbing/spain/castellon/jerica"
   * @returns Map of route ID to route details
   */
  async getRouteDetailsFromSectorPage(
    sectorPath: string,
  ): Promise<Map<number, RouteHtmlDetails>> {
    try {
      const url = `${this.BASE_URL}${sectorPath}`
      logger.info(
        'scraper:thecrag',
        `Fetching route details from sector page: ${url}`,
      )

      await this.delay()
      const html = await this.curlRequestHtml(url)

      const routeDetails = this.parseRouteDetailsFromHtml(html)
      if (routeDetails.size > 0) {
        logger.info(
          'scraper:thecrag',
          `Found details for ${routeDetails.size} routes in sector page: ${sectorPath}`,
        )
      }
      return routeDetails
    } catch (err) {
      logger.warn(
        'scraper:thecrag',
        `Failed to get route details from sector: ${err}`,
      )
      return new Map()
    }
  }

  /**
   * Parse route details from sector HTML page
   * Extracts descriptions, beta, protection info from route elements
   * @param html - Raw HTML content of the sector page
   * @returns Map of route ID to route details
   */
  private parseRouteDetailsFromHtml(
    html: string,
  ): Map<number, RouteHtmlDetails> {
    const $ = cheerio.load(html)
    const routeDetails = new Map<number, RouteHtmlDetails>()

    // TheCrag uses various selectors for route info
    // Look for route rows with data-nid (node ID) attribute
    $('[data-nid]').each((_, el) => {
      const $el = $(el)
      const nodeIdStr = $el.attr('data-nid')
      if (!nodeIdStr) return

      const nodeId = parseInt(nodeIdStr, 10)
      if (isNaN(nodeId)) return

      // Try to find description in various places
      let description: string | null = null
      let beta: string | null = null
      let protection: string | null = null
      let rockType: string | null = null
      let gear: string | null = null
      let anchor: string | null = null

      // Look for description in the route row or nearby elements
      const descEl = $el
        .find('.description, .route-description, .beta-text')
        .first()
      if (descEl.length > 0) {
        description = descEl.text().trim() || null
      }

      // Look for beta information
      const betaEl = $el.find('.beta, .route-beta, [data-beta]').first()
      if (betaEl.length > 0) {
        beta = betaEl.text().trim() || betaEl.attr('data-beta') || null
      }

      // Look for protection info
      const protectionEl = $el.find('.protection, .route-protection').first()
      if (protectionEl.length > 0) {
        protection = protectionEl.text().trim() || null
      }

      // Look for rock type
      const rockEl = $el.find('.rock-type, .rocktype').first()
      if (rockEl.length > 0) {
        rockType = rockEl.text().trim() || null
      }

      // Look for gear info
      const gearEl = $el.find('.gear, .route-gear').first()
      if (gearEl.length > 0) {
        gear = gearEl.text().trim() || null
      }

      // Look for anchor info
      const anchorEl = $el.find('.anchor, .route-anchor').first()
      if (anchorEl.length > 0) {
        anchor = anchorEl.text().trim() || null
      }

      // Only add if we found some data
      if (description || beta || protection || rockType || gear || anchor) {
        routeDetails.set(nodeId, {
          id: nodeId,
          description,
          beta,
          protection,
          rockType,
          gear,
          anchor,
        })
      }
    })

    // Also try to parse from route list table format
    $('tr[data-nid], .route-row[data-nid]').each((_, el) => {
      const $el = $(el)
      const nodeIdStr = $el.attr('data-nid')
      if (!nodeIdStr) return

      const nodeId = parseInt(nodeIdStr, 10)
      if (isNaN(nodeId) || routeDetails.has(nodeId)) return

      // For table format, description might be in a tooltip or title attribute
      const titleAttr =
        $el.attr('title') || $el.find('[title]').first().attr('title')
      if (titleAttr) {
        routeDetails.set(nodeId, {
          id: nodeId,
          description: titleAttr,
          beta: null,
          protection: null,
          rockType: null,
          gear: null,
          anchor: null,
        })
      }
    })

    // Try parsing from expandable route detail sections
    $('.route-detail, .route-info-expanded, [data-route-detail]').each(
      (_, el) => {
        const $el = $(el)
        // Find associated route ID from parent or sibling
        const routeIdStr =
          $el.attr('data-nid') ||
          $el.closest('[data-nid]').attr('data-nid') ||
          $el.prev('[data-nid]').attr('data-nid')

        if (!routeIdStr) return

        const routeId = parseInt(routeIdStr, 10)
        if (isNaN(routeId)) return

        const existing = routeDetails.get(routeId) || {
          id: routeId,
          description: null,
          beta: null,
          protection: null,
          rockType: null,
          gear: null,
          anchor: null,
        }

        // Parse description sections
        $el
          .find('.beta-description, .route-description, p.description')
          .each((_, descEl) => {
            const text = $(descEl).text().trim()
            if (text && !existing.description) {
              existing.description = text
            }
          })

        // Parse gear/equipment sections
        $el.find('.beta-gear, .gear-info, .equipment').each((_, gearEl) => {
          const text = $(gearEl).text().trim()
          if (text && !existing.gear) {
            existing.gear = text
          }
        })

        // Parse protection sections
        $el.find('.beta-protection, .protection-info').each((_, protEl) => {
          const text = $(protEl).text().trim()
          if (text && !existing.protection) {
            existing.protection = text
          }
        })

        if (
          existing.description ||
          existing.beta ||
          existing.protection ||
          existing.rockType ||
          existing.gear ||
          existing.anchor
        ) {
          routeDetails.set(routeId, existing)
        }
      },
    )

    return routeDetails
  }

  /**
   * Enrich routes with details parsed from HTML
   * @param routes - Routes from API
   * @param htmlDetails - Route details parsed from HTML
   * @returns Enriched routes
   */
  private enrichRoutesWithHtmlDetails(
    routes: ScrapedRouteData[],
    htmlDetails: Map<number, RouteHtmlDetails>,
  ): ScrapedRouteData[] {
    return routes.map((route) => {
      const details = htmlDetails.get(route.id)
      if (!details) return route

      return {
        ...route,
        description: details.description ?? route.description,
        beta: details.beta ?? route.beta,
        protection: details.protection ?? route.protection,
        rockType: details.rockType ?? route.rockType,
        gear: details.gear ?? route.gear,
        anchor: details.anchor ?? route.anchor,
      }
    })
  }

  /**
   * Get topos (images with route annotations) from sector page
   * @param sectorPath - Full path like "/en/climbing/spain/castellon/area/787116657"
   */
  async getToposFromSectorPage(sectorPath: string): Promise<TopoImageData[]> {
    try {
      const url = `${this.BASE_URL}${sectorPath}`
      logger.info('scraper:thecrag', `Fetching topos from sector page: ${url}`)

      await this.delay()
      const html = await this.curlRequestHtml(url)

      const topos = this.parseToposFromSectorHtml(html)
      if (topos.length > 0) {
        logger.info(
          'scraper:thecrag',
          `Found ${topos.length} topos in sector page: ${sectorPath}`,
        )
      }
      return topos
    } catch (err) {
      logger.warn('scraper:thecrag', `Failed to get topos from sector: ${err}`)
      return []
    }
  }

  /**
   * Parse topo images from sector HTML page
   * Extracts phototopo elements with images and route/area annotations
   */
  private parseToposFromSectorHtml(html: string): TopoImageData[] {
    const $ = cheerio.load(html)
    const topos: TopoImageData[] = []

    // Find all phototopo elements with data-tid
    $('div.phototopo[data-tid]').each((_, el) => {
      const $el = $(el)

      const topoId = $el.attr('data-tid') || ''
      const width = parseInt($el.attr('data-width') || '0', 10)
      const height = parseInt($el.attr('data-height') || '0', 10)
      const viewScale = parseFloat($el.attr('data-view-scale') || '1')
      const topoDataStr = $el.attr('data-topodata') || '[]'

      // Extract image URLs
      const imgEl = $el.find('img').first()
      const thumbnailUrl = this.normalizeImageUrl(imgEl.attr('src') || '')
      const fullImageUrl =
        this.normalizeImageUrl(imgEl.attr('data-big') || '') || thumbnailUrl

      // Calculate original dimensions
      const originalWidth =
        viewScale > 0 ? Math.round(width / viewScale) : width
      const originalHeight =
        viewScale > 0 ? Math.round(height / viewScale) : height

      // Parse route/area annotations (contains SVG points data)
      let routes: TopoRouteAnnotation[] = []
      try {
        const rawRoutes = JSON.parse(topoDataStr)
        if (Array.isArray(rawRoutes)) {
          routes = rawRoutes.map((r: Record<string, unknown>) => ({
            id: r.id as number,
            type: ((r.type as string) ||
              'route') as TopoRouteAnnotation['type'],
            num: (r.num as string) || '',
            grade: (r.grade as string) || '',
            gradeClass: (r.class as string) || '',
            zindex: (r.zindex as string) || '1',
            name: (r.name as string) || '',
            stars: (r.stars as string) || '',
            style: (r.style as string) || '',
            order: (r.order as number) || 0,
            url: (r.url as string) || '',
            points: (r.points as string) || '', // SVG path points
          }))
        }
      } catch {
        logger.warn(
          'scraper:thecrag',
          `Failed to parse topo annotations for ${topoId}`,
        )
      }

      // Only add if we have an image
      if (topoId && (thumbnailUrl || fullImageUrl)) {
        topos.push({
          topoId,
          width,
          height,
          viewScale,
          thumbnailUrl,
          fullImageUrl,
          originalWidth,
          originalHeight,
          routes,
        })
      }
    })

    return topos
  }

  /**
   * Get crag overview topos (topos that show sectors/areas instead of routes)
   * @param cragPath - Full path like "/en/climbing/spain/castellon/chulilla"
   */
  async getCragToposFromPage(cragPath: string): Promise<TopoImageData[]> {
    try {
      const url = `${this.BASE_URL}${cragPath}`
      logger.info(
        'scraper:thecrag',
        `Fetching crag overview topos from: ${url}`,
      )

      await this.delay()
      const html = await this.curlRequestHtml(url)

      const topos = this.parseCragToposFromHtml(html)
      if (topos.length > 0) {
        logger.info(
          'scraper:thecrag',
          `Found ${topos.length} crag overview topos in: ${cragPath}`,
        )
      }
      return topos
    } catch (err) {
      logger.warn(
        'scraper:thecrag',
        `Failed to get crag topos from page: ${err}`,
      )
      return []
    }
  }

  /**
   * Parse crag overview topo images from HTML page
   * These topos have annotations of type 'area' instead of 'route'
   * Specifically looks for topos inside .phototopo-fsc container (full-size crag overview)
   */
  private parseCragToposFromHtml(html: string): TopoImageData[] {
    const $ = cheerio.load(html)
    const topos: TopoImageData[] = []

    // First, try to find topos specifically inside .phototopo-fsc container
    // This is the main crag overview topo showing all sectors
    const fscContainer = $('div.phototopo-fsc')

    // If we have a .phototopo-fsc container, only look for topos there
    // Otherwise, fall back to searching all phototopo elements with area annotations
    const searchContext = fscContainer.length > 0 ? fscContainer : $('body')

    searchContext.find('div.phototopo[data-tid]').each((_, el) => {
      const $el = $(el)

      const topoId = $el.attr('data-tid') || ''
      const width = parseInt($el.attr('data-width') || '0', 10)
      const height = parseInt($el.attr('data-height') || '0', 10)
      const viewScale = parseFloat($el.attr('data-view-scale') || '1')
      const topoDataStr = $el.attr('data-topodata') || '[]'

      // Extract image URLs
      const imgEl = $el.find('img').first()
      const thumbnailUrl = this.normalizeImageUrl(imgEl.attr('src') || '')
      const fullImageUrl =
        this.normalizeImageUrl(imgEl.attr('data-big') || '') || thumbnailUrl

      // Calculate original dimensions
      const originalWidth =
        viewScale > 0 ? Math.round(width / viewScale) : width
      const originalHeight =
        viewScale > 0 ? Math.round(height / viewScale) : height

      // Parse annotations - for crag topos, default type is 'area' since these show sectors
      let routes: TopoRouteAnnotation[] = []
      try {
        const rawData = JSON.parse(topoDataStr)
        if (Array.isArray(rawData)) {
          routes = rawData.map((r: Record<string, unknown>) => {
            // Default to 'area' for crag overview topos (they show sectors, not routes)
            const annotationType = ((r.type as string) ||
              'area') as TopoRouteAnnotation['type']
            return {
              id: r.id as number,
              type: annotationType,
              num: (r.num as string) || '',
              grade: (r.grade as string) || '',
              gradeClass: (r.class as string) || '',
              zindex: (r.zindex as string) || '1',
              name: (r.name as string) || '',
              stars: (r.stars as string) || '',
              style: (r.style as string) || '',
              order: (r.order as number) || 0,
              url: (r.url as string) || '',
              points: (r.points as string) || '',
            }
          })
        }
      } catch {
        logger.warn(
          'scraper:thecrag',
          `Failed to parse crag topo annotations for ${topoId}`,
        )
      }

      // Include all topos found - crag overview topos can have various annotation types
      // The key is that they're on the crag page, not a sector page
      if (topoId && (thumbnailUrl || fullImageUrl)) {
        topos.push({
          topoId,
          width,
          height,
          viewScale,
          thumbnailUrl,
          fullImageUrl,
          originalWidth,
          originalHeight,
          routes, // Contains area annotations
        })
      }
    })

    return topos
  }

  /**
   * Normalize image URL - TheCrag uses protocol-relative URLs like //image.thecrag.com/...
   */
  private normalizeImageUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return `https://www.thecrag.com${url}`
    return url
  }

  /**
   * Get header/cover image URL for a node (crag or sector)
   * @param nodeId - Node ID to get header image for
   * @param urlStub - URL stub for the node (e.g., "spain/valencia/chulilla")
   * @returns Header image URL or null if not found
   */
  async getHeaderImage(
    nodeId: number,
    urlStub?: string,
  ): Promise<string | null> {
    try {
      // Build the URL - use urlStub if available, otherwise use nodeId
      const path = urlStub
        ? `${this.BASE_URL}${urlStub}`
        : `${this.BASE_URL}/en/climbing/area/${nodeId}`

      await this.delay()

      const html = await this.curlRequestHtml(path)

      // Check if we got a valid page
      if (html.length < 1000) {
        return null
      }

      const imageUrl = this.parseHeaderImageFromHtml(html)
      if (imageUrl) {
        logger.info(
          'scraper:thecrag',
          `Found header image for node ${nodeId}: ${imageUrl.substring(0, 80)}...`,
        )
      }
      return imageUrl
    } catch (err) {
      logger.warn(
        'scraper:thecrag',
        `Failed to get header image for node ${nodeId}: ${err}`,
      )
      return null
    }
  }

  /**
   * Parse header image URL from HTML page
   * @returns Normalized image URL or null if not found
   */
  private parseHeaderImageFromHtml(html: string): string | null {
    const $ = cheerio.load(html)

    // 1. OG image from meta tags (usually the main representative image)
    const ogImage = $('meta[property="og:image"]').attr('content')
    if (ogImage && ogImage.includes('image.thecrag.com')) {
      return this.normalizeImageUrl(ogImage)
    }

    // 2. Hero/banner images
    const heroImg = $(
      '.hero-image img, .cover-image img, .header-image img, .banner img',
    ).first()
    if (heroImg.length > 0) {
      const src = heroImg.attr('src') || heroImg.attr('data-src')
      if (src && src.includes('image.thecrag.com')) {
        return this.normalizeImageUrl(src)
      }
    }

    // 3. First large image in the page (likely the main photo)
    let foundUrl: string | null = null
    $('img[src*="image.thecrag.com"]').each((_, el) => {
      if (foundUrl) return // Already found one
      const src = $(el).attr('src') || ''
      // Look for larger images (containing size hints like /700x or larger)
      const sizeMatch = src.match(/\/(\d+)x(\d+)\//)
      if (sizeMatch) {
        const width = parseInt(sizeMatch[1], 10)
        // Only consider images that are reasonably large (at least 400px wide)
        if (width >= 400) {
          foundUrl = src
        }
      }
    })

    return foundUrl ? this.normalizeImageUrl(foundUrl) : null
  }

  /**
   * Get detailed info for a node
   */
  async getNodeInfo(nodeId: number): Promise<ScrapedNodeInfo | null> {
    // Include urlStub in the API request
    const url = `${this.BASE_URL}/api/node/id/${nodeId}?show=info,description,approach,access,beta,history,ethics,tags,geometry,urlStub,urlAncestorStub`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed.data || parsed

    const info: ScrapedNodeInfo = {}

    // Guardar respuesta completa para análisis futuro
    info.apiResponseRaw = data

    // Geometry - extract coordinates for geographic search
    // Priority: 1. API geometry/map/location fields, 2. Beta text, 3. Web page scraping
    const coords = this.extractCoordsFromApiResponse(data)
    if (coords) {
      info.geometry = {
        lat: coords.lat,
        long: coords.lng,
      }
      info.googleMapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      logger.info(
        'scraper:thecrag',
        `Got coordinates from API for node ${nodeId}: ${coords.lat}, ${coords.lng}`,
      )
    }

    // If no geometry from API, try to extract from beta text (approach, description)
    if (!info.geometry) {
      const betaCoords = this.extractCoordsFromBeta(data.beta)
      if (betaCoords) {
        info.geometry = {
          lat: betaCoords.lat,
          long: betaCoords.lng,
        }
        info.googleMapsUrl = `https://www.google.com/maps?q=${betaCoords.lat},${betaCoords.lng}`
        logger.info(
          'scraper:thecrag',
          `Got coordinates from beta text for node ${nodeId}: ${betaCoords.lat}, ${betaCoords.lng}`,
        )
      }
    }

    // If still no geometry, try web page scraping as last resort
    if (!info.geometry) {
      const urlStub = data.urlStub
      const urlAncestorStub = data.urlAncestorStub
      if (urlStub || urlAncestorStub) {
        const pagePath = `/en/climbing/${urlAncestorStub || ''}${urlStub || `area/${nodeId}`}`
        const webCoords = await this.getCoordinatesFromWebPage(pagePath)
        if (webCoords) {
          info.geometry = {
            lat: webCoords.lat,
            long: webCoords.lng,
          }
          info.googleMapsUrl = `https://www.google.com/maps?q=${webCoords.lat},${webCoords.lng}`
          logger.info(
            'scraper:thecrag',
            `Got coordinates from web page for node ${nodeId}: ${webCoords.lat}, ${webCoords.lng}`,
          )
        }
      }
    }

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
   * Get coordinates from web page as fallback when API doesn't return them
   * Searches for coordinates in:
   * 1. JavaScript variables (lat/lng patterns)
   * 2. Data attributes (data-lat, data-lng)
   * 3. Google Maps links
   * 4. Parking coordinates in approach text
   */
  async getCoordinatesFromWebPage(
    pagePath: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      await this.delay()
      const html = await this.curlRequestHtml(`${this.BASE_URL}${pagePath}`)

      if (!html || html.length < 500) {
        return null
      }

      const $ = cheerio.load(html)

      // 1. Try script with coordinates (common in TheCrag pages)
      const scripts = $('script').toArray()
      for (const script of scripts) {
        const content = $(script).html() || ''

        // Look for lat/lng patterns in JavaScript
        // Pattern: "lat": 39.826554 or lat = 39.826554 or latitude: 39.826554
        const latMatch = content.match(
          /["']?lat(?:itude)?["']?\s*[:=]\s*(-?\d+\.?\d*)/i,
        )
        const lngMatch = content.match(
          /["']?(?:lng|lon|long|longitude)["']?\s*[:=]\s*(-?\d+\.?\d*)/i,
        )

        if (latMatch && lngMatch) {
          const lat = parseFloat(latMatch[1])
          const lng = parseFloat(lngMatch[1])
          if (this.isValidCoordinate(lat, lng)) {
            return { lat, lng }
          }
        }
      }

      // 2. Try data attributes on elements
      const geoEl = $(
        '[data-lat][data-lng], [data-lat][data-lon], [data-latitude][data-longitude]',
      ).first()
      if (geoEl.length) {
        const lat = parseFloat(
          geoEl.attr('data-lat') || geoEl.attr('data-latitude') || '',
        )
        const lng = parseFloat(
          geoEl.attr('data-lng') ||
            geoEl.attr('data-lon') ||
            geoEl.attr('data-longitude') ||
            '',
        )
        if (this.isValidCoordinate(lat, lng)) {
          return { lat, lng }
        }
      }

      // 3. Try Google Maps link (including .loc .mappin links)
      const mapsLinks = $(
        'a[href*="google.com/maps"], a[href*="maps.google"], .loc a[href*="maps"], .mappin',
      ).toArray()
      for (const link of mapsLinks) {
        const href = $(link).attr('href') || ''
        // Pattern: maps?q=lat,lng or @lat,lng
        const match = href.match(/[?&@q=](-?\d+\.?\d*),(-?\d+\.?\d*)/)
        if (match) {
          const lat = parseFloat(match[1])
          const lng = parseFloat(match[2])
          if (this.isValidCoordinate(lat, lng)) {
            logger.info(
              'scraper:thecrag',
              `Found coordinates in maps link: ${lat}, ${lng}`,
            )
            return { lat, lng }
          }
        }
      }

      // 4. Try to find coordinates in any link with lat/lng format
      const allLinks = $('a[href]').toArray()
      for (const link of allLinks) {
        const href = $(link).attr('href') || ''
        // Look for coordinates pattern in any href
        const match = href.match(
          /[?&@=](-?\d{1,3}\.\d{4,8}),(-?\d{1,3}\.\d{4,8})/,
        )
        if (match) {
          const lat = parseFloat(match[1])
          const lng = parseFloat(match[2])
          if (
            this.isValidCoordinate(lat, lng) &&
            Math.abs(lat) > 20 &&
            Math.abs(lat) < 70
          ) {
            logger.info(
              'scraper:thecrag',
              `Found coordinates in link: ${lat}, ${lng}`,
            )
            return { lat, lng }
          }
        }
      }

      // 5. Try to extract from approach/description text (parking coordinates)
      // TheCrag often has coordinates like ":parking:, 39.826554, -0.574161"
      const approachText = $(
        '.beta-approach, .approach, [data-beta="Approach"]',
      ).text()
      const descText = $('.beta-description, .description').text()
      const fullText = approachText + ' ' + descText

      // Pattern: coordinates like "39.826554, -0.574161" or "(39.826554, -0.574161)"
      const coordMatch = fullText.match(
        /(\d{1,3}\.\d{3,8})\s*,\s*(-?\d{1,3}\.\d{3,8})/,
      )
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1])
        const lng = parseFloat(coordMatch[2])
        if (this.isValidCoordinate(lat, lng)) {
          return { lat, lng }
        }
      }

      return null
    } catch (err) {
      logger.warn(
        'scraper:thecrag',
        `Failed to get coordinates from web page ${pagePath}: ${err}`,
      )
      return null
    }
  }

  /**
   * Extract coordinates from API response data
   * Searches multiple possible fields: geometry, map, location, geo, lat/lng, etc.
   */
  private extractCoordsFromApiResponse(
    data: Record<string, unknown>,
  ): { lat: number; lng: number } | null {
    // 1. Try geometry field (standard format)
    if (data.geometry) {
      const geo = data.geometry as Record<string, unknown>
      const lat = geo.lat as number | undefined
      const lng = (geo.long || geo.lng || geo.longitude) as number | undefined
      if (lat && lng && this.isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
      // Try center array format [lng, lat]
      if (geo.center && Array.isArray(geo.center) && geo.center.length >= 2) {
        const centerLat = geo.center[1] as number
        const centerLng = geo.center[0] as number
        if (this.isValidCoordinate(centerLat, centerLng)) {
          return { lat: centerLat, lng: centerLng }
        }
      }
    }

    // 2. Try map field
    if (data.map) {
      const map = data.map as Record<string, unknown>
      const lat = (map.lat || map.latitude) as number | undefined
      const lng = (map.lng || map.lon || map.long || map.longitude) as
        | number
        | undefined
      if (lat && lng && this.isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
      // Try center format
      if (map.center && Array.isArray(map.center) && map.center.length >= 2) {
        const centerLat = map.center[1] as number
        const centerLng = map.center[0] as number
        if (this.isValidCoordinate(centerLat, centerLng)) {
          return { lat: centerLat, lng: centerLng }
        }
      }
    }

    // 3. Try location field
    if (data.location) {
      const loc = data.location as Record<string, unknown>
      const lat = (loc.lat || loc.latitude) as number | undefined
      const lng = (loc.lng || loc.lon || loc.long || loc.longitude) as
        | number
        | undefined
      if (lat && lng && this.isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
    }

    // 4. Try geo field
    if (data.geo) {
      const geo = data.geo as Record<string, unknown>
      const lat = (geo.lat || geo.latitude) as number | undefined
      const lng = (geo.lng || geo.lon || geo.long || geo.longitude) as
        | number
        | undefined
      if (lat && lng && this.isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
    }

    // 5. Try direct lat/lng fields
    const lat = (data.lat || data.latitude) as number | undefined
    const lng = (data.lng || data.lon || data.long || data.longitude) as
      | number
      | undefined
    if (lat && lng && this.isValidCoordinate(lat, lng)) {
      return { lat, lng }
    }

    // 6. Try geolocation field
    if (data.geolocation) {
      const geoloc = data.geolocation as Record<string, unknown>
      const geoLat = (geoloc.lat || geoloc.latitude) as number | undefined
      const geoLng = (geoloc.lng || geoloc.lon || geoloc.longitude) as
        | number
        | undefined
      if (geoLat && geoLng && this.isValidCoordinate(geoLat, geoLng)) {
        return { lat: geoLat, lng: geoLng }
      }
    }

    return null
  }

  /**
   * Extract coordinates from beta array (approach, description text)
   * TheCrag often includes parking coordinates like ":parking:, 39.826554, -0.574161"
   */
  private extractCoordsFromBeta(
    beta: Array<{ name: string; markdown: string }> | undefined,
  ): { lat: number; lng: number } | null {
    if (!beta || !Array.isArray(beta)) {
      return null
    }

    // Combine all beta text
    const fullText = beta.map((b) => b.markdown || '').join(' ')

    // Pattern 1: :parking:, lat, lng or (lat, lng)
    // Example: ":parking:, 39.826554, -0.574161"
    const parkingMatch = fullText.match(
      /:parking:[,\s]+(-?\d{1,3}\.\d{3,8})\s*,\s*(-?\d{1,3}\.\d{3,8})/i,
    )
    if (parkingMatch) {
      const lat = parseFloat(parkingMatch[1])
      const lng = parseFloat(parkingMatch[2])
      if (this.isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
    }

    // Pattern 2: Generic coordinate pattern (lat, lng) where lat is typically 30-60 for Europe
    // Look for patterns like "39.826554, -0.574161" or "(39.826554, -0.574161)"
    const genericMatches = fullText.matchAll(
      /[(\s,](-?\d{1,3}\.\d{4,8})\s*,\s*(-?\d{1,3}\.\d{4,8})[)\s,]/g,
    )
    for (const match of genericMatches) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      // Validate: lat should be reasonable (not too small, indicates it's actually a lat)
      if (this.isValidCoordinate(lat, lng) && Math.abs(lat) > 20) {
        return { lat, lng }
      }
    }

    // Pattern 3: Google Maps URL in text
    const mapsMatch = fullText.match(
      /google\.com\/maps[^"'\s]*[?&@](-?\d+\.?\d*),(-?\d+\.?\d*)/i,
    )
    if (mapsMatch) {
      const lat = parseFloat(mapsMatch[1])
      const lng = parseFloat(mapsMatch[2])
      if (this.isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
    }

    return null
  }

  /**
   * Validate that coordinates are within reasonable bounds
   */
  private isValidCoordinate(lat: number, lng: number): boolean {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      // Exclude obviously wrong values (like 0,0)
      !(lat === 0 && lng === 0)
    )
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

  private static readonly MAX_API_RETRIES = 3

  /**
   * Make HTTP request using curl for API endpoints
   */
  private async curlRequest(url: string, retryCount = 0): Promise<string> {
    const proxy = this.options.useProxies ? this.proxyManager.getNext() : null

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

    // Add proxy if available
    if (proxy) {
      args.push('-x', proxy.url)
      logger.debug(
        'scraper:thecrag',
        `Using proxy: ${proxy.host}:${proxy.port}`,
      )
    }

    if (this.cookie) {
      args.push('-H', `Cookie: ${this.cookie}`)
    }

    try {
      const proc = Bun.spawn(args)
      const result = await new Response(proc.stdout).text()

      // Check for actual blocking indicators (be more specific)
      const isBlocked = this.isResponseBlocked(result)

      if (isBlocked) {
        if (proxy) {
          this.proxyManager.reportFailure(proxy)
          logger.warn(
            'scraper:thecrag',
            `Request blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/${TheCragApiScraperOld.MAX_API_RETRIES}`,
          )
          // Retry with next proxy if we haven't exceeded max retries
          if (retryCount + 1 < TheCragApiScraperOld.MAX_API_RETRIES) {
            return this.curlRequest(url, retryCount + 1)
          }
          throw new Error(
            `Request blocked after ${TheCragApiScraperOld.MAX_API_RETRIES} attempts: ${isBlocked}`,
          )
        }
        throw new Error(`Request blocked: ${isBlocked}`)
      }

      if (proxy) {
        this.proxyManager.reportSuccess(proxy)
      }

      return result
    } catch (err) {
      if (proxy) {
        this.proxyManager.reportFailure(proxy)
      }
      throw err
    }
  }

  /**
   * Check if response indicates blocking/error
   * Returns false if OK, or a string describing the block reason
   */
  private isResponseBlocked(result: string): string | false {
    // Empty response - could be network error
    if (!result || result.length === 0) {
      return 'empty response'
    }

    const trimmed = result.trim()

    // Valid JSON responses from TheCrag API (even if empty)
    // TheCrag returns [[]] for empty results, [] for no data, {} for empty objects
    if (
      trimmed === '[]' ||
      trimmed === '{}' ||
      trimmed === 'null' ||
      trimmed === '[[]]' || // TheCrag empty response format
      trimmed.startsWith('[') || // Valid JSON array
      trimmed.startsWith('{') // Valid JSON object
    ) {
      return false // Valid response
    }

    // Specific blocking messages
    if (result.includes('Access Denied')) {
      return 'Access Denied'
    }
    if (result.includes('403 Forbidden')) {
      return '403 Forbidden'
    }
    if (result.includes('rate limit') || result.includes('Rate limit')) {
      return 'rate limited'
    }
    if (result.includes('blocked') && result.includes('IP')) {
      return 'IP blocked'
    }

    // Cloudflare/bot detection - be specific
    if (result.includes('cf-browser-verification')) {
      return 'Cloudflare challenge'
    }

    // Proxy authentication error - be specific to avoid false positives
    if (
      result.includes('Proxy Authentication Required') ||
      result.includes('407 Proxy Authentication')
    ) {
      return 'proxy auth failed'
    }

    // HTML error pages (not JSON)
    if (result.includes('<!DOCTYPE') || result.includes('<html')) {
      if (result.includes('Access Denied') || result.includes('Forbidden')) {
        return 'Access Denied (HTML)'
      }
      if (result.includes('cloudflare')) {
        return 'Cloudflare challenge'
      }
      // Could be a legitimate HTML response or error page
      return false
    }

    return false
  }

  private static readonly MAX_HTML_RETRIES = 3

  /**
   * Make HTTP request using curl for HTML pages
   */
  private async curlRequestHtml(url: string, retryCount = 0): Promise<string> {
    const proxy = this.options.useProxies ? this.proxyManager.getNext() : null

    const args = [
      'curl',
      url,
      '--globoff',
      '--compressed',
      '-s',
      '-L', // Follow redirects
      '-H',
      `User-Agent: ${this.USER_AGENT}`,
      '-H',
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '-H',
      'Accept-Language: en-US,en;q=0.5',
      '-H',
      'Accept-Encoding: gzip, deflate, br',
      '-H',
      'Connection: keep-alive',
      '-H',
      'Upgrade-Insecure-Requests: 1',
      '-H',
      'Sec-Fetch-Dest: document',
      '-H',
      'Sec-Fetch-Mode: navigate',
      '-H',
      'Sec-Fetch-Site: none',
      '-H',
      'Sec-Fetch-User: ?1',
    ]

    // Add proxy if available
    if (proxy) {
      args.push('-x', proxy.url)
      logger.debug(
        'scraper:thecrag',
        `Using proxy: ${proxy.host}:${proxy.port}`,
      )
    }

    if (this.cookie) {
      args.push('-H', `Cookie: ${this.cookie}`)
    }

    try {
      const proc = Bun.spawn(args)
      const result = await new Response(proc.stdout).text()

      // Check for actual blocking indicators
      const isBlocked = this.isHtmlResponseBlocked(result)

      if (isBlocked) {
        if (proxy) {
          this.proxyManager.reportFailure(proxy)
          logger.warn(
            'scraper:thecrag',
            `HTML blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/${TheCragApiScraperOld.MAX_HTML_RETRIES}`,
          )
          // Retry with next proxy if we haven't exceeded max retries
          if (retryCount + 1 < TheCragApiScraperOld.MAX_HTML_RETRIES) {
            return this.curlRequestHtml(url, retryCount + 1)
          }
          throw new Error(
            `Request blocked after ${TheCragApiScraperOld.MAX_HTML_RETRIES} attempts: ${isBlocked}`,
          )
        }
        throw new Error(`Request blocked: ${isBlocked}`)
      }

      if (proxy) {
        this.proxyManager.reportSuccess(proxy)
      }

      return result
    } catch (err) {
      if (proxy) {
        this.proxyManager.reportFailure(proxy)
      }
      throw err
    }
  }

  /**
   * Check if HTML response indicates blocking/error
   */
  private isHtmlResponseBlocked(result: string): string | false {
    // Empty response
    if (!result || result.length === 0) {
      return 'empty response'
    }

    // Very short for HTML (less than 100 chars is suspicious for an HTML page)
    if (result.length < 100 && !result.includes('<')) {
      return `too short for HTML (${result.length} chars)`
    }

    // Specific blocking messages
    if (result.includes('Access Denied')) {
      return 'Access Denied'
    }
    if (result.includes('403 Forbidden')) {
      return '403 Forbidden'
    }
    if (result.includes('rate limit') || result.includes('Rate limit')) {
      return 'rate limited'
    }

    // Cloudflare/bot detection - be specific to avoid false positives
    // The actual block page has "Just a moment" as title, not just "challenge-platform" in scripts
    if (result.includes('cf-browser-verification')) {
      return 'Cloudflare challenge'
    }
    // Cloudflare waiting page - check for title specifically
    if (
      result.includes('<title>Just a moment...</title>') ||
      (result.includes('Just a moment...') && !result.includes('theCrag'))
    ) {
      return 'Cloudflare waiting page'
    }

    // Proxy errors - be specific to avoid false positives with coordinates like "407.6"
    if (
      result.includes('Proxy Authentication Required') ||
      result.includes('407 Proxy Authentication')
    ) {
      return 'proxy auth failed'
    }
    if (result.includes('502 Bad Gateway') || result.includes('503 Service')) {
      return 'proxy gateway error'
    }

    return false
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.delayMs))
  }
}
