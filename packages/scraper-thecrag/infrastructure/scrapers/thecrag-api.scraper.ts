import { Injectable, logger } from '@OneJs/core'
import { ScrapedAreaComplete } from '@scraper-thecrag/domain/entities/scraped-area-complete.entity'
import { ScrapedArea } from '@scraper-thecrag/domain/entities/scraped-area.entity'
import { ScrapedRoute } from '@scraper-thecrag/domain/entities/scraped-route.entity'
import { ScrapedSector } from '@scraper-thecrag/domain/entities/scraped-sector.entity'
import { AreaBeta } from '@scraper-thecrag/domain/value-objects/area-beta.vo'
import { AreaName } from '@scraper-thecrag/domain/value-objects/area-name.vo'
import { AreaSlug } from '@scraper-thecrag/domain/value-objects/area-slug.vo'
import { AreaUrl } from '@scraper-thecrag/domain/value-objects/area-url.vo'
import { NodeId } from '@scraper-thecrag/domain/value-objects/node-id.vo'
import { NodeMetadata } from '@scraper-thecrag/domain/value-objects/node-metadata.vo'
import { NodeSeasonality } from '@scraper-thecrag/domain/value-objects/node-seasonality.vo'
import { NodeStatistics } from '@scraper-thecrag/domain/value-objects/node-statistics.vo'
import { NodeTags } from '@scraper-thecrag/domain/value-objects/node-tags.vo'
import { RawHtmlResponse } from '@scraper-thecrag/domain/value-objects/raw-html-response.vo'
import { RawNodeResponse } from '@scraper-thecrag/domain/value-objects/raw-node-response.vo'
import { RouteBeta } from '@scraper-thecrag/domain/value-objects/route-beta.vo'
import { RouteGrade } from '@scraper-thecrag/domain/value-objects/route-grade.vo'
import { RouteHistory } from '@scraper-thecrag/domain/value-objects/route-history.vo'
import { RouteInfo } from '@scraper-thecrag/domain/value-objects/route-info.vo'
import { RouteWithTopo } from '@scraper-thecrag/domain/value-objects/route-with-topo.vo'
import { TopoAnnotation } from '@scraper-thecrag/domain/value-objects/topo-annotation.vo'
import { TopoDimensions } from '@scraper-thecrag/domain/value-objects/topo-dimensions.vo'
import { TopoImage } from '@scraper-thecrag/domain/entities/topo-image.entity'
import { TopoId } from '@scraper-thecrag/domain/value-objects/topo-id.vo'
import { TopoImageUrl } from '@scraper-thecrag/domain/value-objects/topo-image-url.vo'
import { WebCoverImage } from '@scraper-thecrag/domain/value-objects/webcover-image.vo'
import * as cheerio from 'cheerio'
import { load } from 'cheerio'
import { DEFAULT_PROXIES, ProxyManager } from '../utils/proxy-manager'

export interface ScraperOptions {
  includeTopos: boolean
  useProxies: boolean
}

@Injectable()
export class TheCragApiScraper {
  private readonly BASE_URL = 'https://www.thecrag.com'
  private readonly USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'

  private cookie: string = ''
  private delayMs: number = 50
  private options: ScraperOptions = {
    includeTopos: true,
    useProxies: true,
  }
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
   * @param proxyUrls - Array of proxy URLs like "http://user:pass@host:port"
   */
  addProxies(proxyUrls: string[]): void {
    this.proxyManager.addProxies(proxyUrls)
  }

  /**
   * Set scraper options
   */
  setOptions(options: Partial<ScraperOptions>): void {
    this.options = { ...this.options, ...options }
  }

  // ========================================
  // PUBLIC METHODS - New Domain Model
  // ========================================

  /**
   * Scrape an area (crag, sector, or zone) and return a ScrapedArea entity
   */
  async scrapeArea(areaId: NodeId): Promise<ScrapedArea> {
    logger.info('scraper:thecrag', `Scraping area: ${areaId.toString()}`)

    // Fetch API data
    const apiResponse = await this.fetchNodeInfo(areaId)

    const rawNodeResponse = apiResponse
      ? RawNodeResponse.fromApiResponse(apiResponse)
      : null

    // Build URL and fetch HTML
    const data = apiResponse?.data as Record<string, unknown> | undefined

    // Extract name from API response
    const name = (data?.name as string) || `Area ${areaId.toString()}`

    const urlStub = (data?.urlStub as string) || undefined
    const urlAncestorStub = (data?.urlAncestorStub as string) || undefined
    const pageUrl = this.buildNodeUrl(areaId, urlStub, urlAncestorStub)
    const fullUrl = `${this.BASE_URL}${pageUrl}`

    await this.delay()
    const html = await this.curlRequestHtml(fullUrl)
    const rawHtmlResponse = RawHtmlResponse.create(html, fullUrl)

    // Parse all VOs from API response
    const statistics = this.parseNodeStatistics(apiResponse)
    const seasonality = this.parseNodeSeasonality(apiResponse)
    const tags = this.parseNodeTags(apiResponse)
    const metadata = this.parseNodeMetadata(apiResponse)
    const webCover = this.parseWebCoverImage(apiResponse)
    const topoImages = this.parseTopoImages(html)
    const childIds = this.parseChildIds(apiResponse)

    // Extract beta information (summary, description, approach)
    const areaBeta = this.parseAreaBeta(apiResponse)

    logger.info(
      'scraper:thecrag',
      `Scraped area: ${name} (${areaId.toString()})`,
    )

    return ScrapedArea.create(
      areaId,
      AreaName.createFrom(name),
      AreaSlug.createFrom(this.slugify(name)),
      AreaUrl.createFrom(fullUrl),
      areaBeta,
      statistics,
      seasonality,
      tags,
      metadata,
      webCover,
      null,
      topoImages,
      childIds,
      rawNodeResponse,
      rawHtmlResponse,
    )
  }

  /**
   * Scrape a route and return a ScrapedRoute entity
   */
  async scrapeRoute(
    routeId: NodeId,
    parentAreaId?: NodeId,
  ): Promise<ScrapedRoute> {
    logger.info('scraper:thecrag', `Scraping route: ${routeId.toString()}`)

    // Fetch API data
    const apiResponse = await this.fetchNodeInfo(routeId)
    const rawNodeResponse = apiResponse
      ? RawNodeResponse.fromApiResponse(apiResponse)
      : null

    // Build URL and fetch HTML
    const data = apiResponse?.data as Record<string, unknown> | undefined

    // Extract name from API response
    const name = (data?.name as string) || `Route ${routeId.toString()}`

    const urlStub = (data?.urlStub as string) || undefined
    const urlAncestorStub = (data?.urlAncestorStub as string) || undefined
    const pageUrl = this.buildNodeUrl(routeId, urlStub, urlAncestorStub)
    const fullUrl = `${this.BASE_URL}${pageUrl}`

    await this.delay()
    const html = await this.curlRequestHtml(fullUrl)
    const rawHtmlResponse = RawHtmlResponse.create(html, fullUrl)

    // Parse VOs
    const grade = this.parseRouteGrade(apiResponse)
    const routeInfo = this.parseRouteInfoFromHtml(html)
    const history = this.parseRouteHistory(apiResponse)
    const beta = this.parseRouteBeta(apiResponse)

    logger.info(
      'scraper:thecrag',
      `Scraped route: ${name} (${routeId.toString()})`,
    )

    return ScrapedRoute.create(
      routeId,
      name,
      this.slugify(name),
      fullUrl,
      grade,
      routeInfo,
      history,
      beta,
      parentAreaId ?? null,
      rawNodeResponse,
      rawHtmlResponse,
    )
  }

  /**
   * Get child area/route IDs for a node
   */
  async getChildrenIds(nodeId: NodeId): Promise<NodeId[]> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId.getValue()}/children/area?flatten=data[id]&expires=10`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed[0] ?? []

    return data.map((item: unknown[]) => NodeId.create(item[0] as number))
  }

  /**
   * Get route IDs for a node (sector/crag)
   */
  async getRouteIds(nodeId: NodeId): Promise<NodeId[]> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId.getValue()}/children/route?flatten=data[id]&expires=10`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed[0] ?? []

    return data.map((item: unknown[]) => NodeId.create(item[0] as number))
  }

  /**
   * Scrape a complete sector with all routes and their topo annotations.
   *
   * This method:
   * 1. Scrapes the sector area data (topos, cover image, metadata)
   * 2. Gets all route IDs in the sector
   * 3. Scrapes each route's detailed data
   * 4. Links routes with their topo annotations from the sector topos
   * 5. Identifies sub-sectors that may need separate scraping
   *
   * @param sectorId - The NodeId of the sector to scrape
   * @param options - Optional configuration
   * @returns ScrapedSector with all routes and topos linked
   */
  async scrapeSectorWithRoutes(
    sectorId: NodeId,
    options?: {
      /** Include sub-sectors recursively (default: false) */
      includeSubSectors?: boolean
      /** Maximum number of routes to scrape (default: no limit) */
      maxRoutes?: number
      /** Pre-scraped area data to avoid duplicate requests (optional) */
      scrapedArea?: ScrapedArea
    },
  ): Promise<ScrapedSector> {
    const includeSubSectors = options?.includeSubSectors ?? false
    const maxRoutes = options?.maxRoutes
    const scrapedArea = options?.scrapedArea

    logger.info(
      'scraper:thecrag',
      `Scraping sector with routes: ${sectorId.toString()}`,
    )

    // Step 1: Use pre-scraped area if provided, otherwise scrape it
    const area = scrapedArea ?? (await this.scrapeArea(sectorId))

    // Step 2: Parse HTML for detailed route data
    const html = area.getRawHtmlResponse()?.getRawHtml() || ''
    const htmlRouteData = this.parseRoutesFromHtml(html)

    logger.info(
      'scraper:thecrag',
      `Parsed ${htmlRouteData.length} routes from HTML with detailed data`,
    )

    // Create a map for quick lookup by route ID
    const htmlRouteDataMap = new Map(
      htmlRouteData.map((route) => [route.id, route]),
    )

    // Step 3: Collect all route annotations from topo images
    const topoImages = area.getTopoImages()
    const allRouteAnnotations: TopoAnnotation[] = []

    for (const topoImage of topoImages) {
      allRouteAnnotations.push(...topoImage.getRouteAnnotations())
    }

    logger.info(
      'scraper:thecrag',
      `Found ${allRouteAnnotations.length} route annotations in ${topoImages.length} topo images`,
    )

    // Step 4: Create ScrapedRoute entities from SVG annotations (no individual requests)
    const routeAnnotationsToUse = maxRoutes
      ? allRouteAnnotations.slice(0, maxRoutes)
      : allRouteAnnotations

    const scrapedRoutes: ScrapedRoute[] = routeAnnotationsToUse.map(
      (annotation) => {
        const baseRoute = ScrapedRoute.fromTopoAnnotation(annotation, sectorId)

        // Enrich with HTML data if available
        const htmlData = htmlRouteDataMap.get(annotation.getId().toString())
        return htmlData ? baseRoute.enrichWithHtmlData(htmlData) : baseRoute
      },
    )

    logger.info(
      'scraper:thecrag',
      `Created ${scrapedRoutes.length} routes from SVG annotations (enriched with HTML data where available)`,
    )

    // Step 5: Link routes with their annotations
    const routesWithTopos = RouteWithTopo.linkRoutesWithAnnotations(
      scrapedRoutes,
      allRouteAnnotations,
      null, // We'll set topo image per route if needed
    )

    // For routes with annotations, find and set the correct topo image
    const routesWithCorrectTopoImage = this.linkRoutesToTopoImages(
      routesWithTopos,
      topoImages,
    )

    // Step 6: Identify sub-sectors (child areas that are not routes)
    let subSectorIds: NodeId[] = []
    if (includeSubSectors) {
      const childIds = area.getChildIds()
      // Filter out route IDs - remaining are sub-sectors
      const routeIdSet = new Set(
        scrapedRoutes.map((route) => route.getId().getValue()),
      )
      subSectorIds = childIds.filter((id) => !routeIdSet.has(id.getValue()))
    }

    logger.info(
      'scraper:thecrag',
      `Scraped sector: ${area.getName().toString()} with ${scrapedRoutes.length} routes, ${topoImages.length} topos`,
    )

    return ScrapedSector.create(
      sectorId,
      area.getName().toString(),
      area.getUrl().toString(),
      topoImages,
      routesWithCorrectTopoImage,
      subSectorIds,
    )
  }

  /**
   * Scrape a sector with all sub-sectors recursively.
   *
   * Use this when a sector has child areas (sub-sectors) that contain the actual routes.
   * This method will:
   * 1. Scrape the main sector
   * 2. Identify sub-sectors from area annotations in topos
   * 3. Recursively scrape each sub-sector
   * 4. Aggregate all routes and topos
   *
   * @param sectorId - The NodeId of the parent sector
   * @param options - Optional configuration
   * @returns Array of ScrapedSector (main sector + all sub-sectors)
   */
  async scrapeSectorWithSubSectors(
    sectorId: NodeId,
    options?: {
      /** Maximum depth of recursion (default: 2) */
      maxDepth?: number
      /** Maximum number of routes per sector (default: no limit) */
      maxRoutesPerSector?: number
    },
  ): Promise<ScrapedSector[]> {
    const maxDepth = options?.maxDepth ?? 2
    const maxRoutesPerSector = options?.maxRoutesPerSector

    const allSectors: ScrapedSector[] = []
    const visited = new Set<number>()

    await this.scrapeSectorRecursive(
      sectorId,
      0,
      maxDepth,
      maxRoutesPerSector,
      allSectors,
      visited,
    )

    return allSectors
  }

  /**
   * Internal recursive method for scraping sectors with sub-sectors.
   */
  private async scrapeSectorRecursive(
    sectorId: NodeId,
    currentDepth: number,
    maxDepth: number,
    maxRoutesPerSector: number | undefined,
    allSectors: ScrapedSector[],
    visited: Set<number>,
  ): Promise<void> {
    // Avoid infinite loops
    if (visited.has(sectorId.getValue())) {
      return
    }
    visited.add(sectorId.getValue())

    // Check depth limit
    if (currentDepth > maxDepth) {
      logger.info(
        'scraper:thecrag',
        `Reached max depth ${maxDepth} at sector ${sectorId.toString()}`,
      )
      return
    }

    logger.info(
      'scraper:thecrag',
      `Scraping sector recursively (depth ${currentDepth}): ${sectorId.toString()}`,
    )

    // Scrape this sector with includeSubSectors to identify children
    const sector = await this.scrapeSectorWithRoutes(sectorId, {
      includeSubSectors: true,
      maxRoutes: maxRoutesPerSector,
    })

    allSectors.push(sector)

    // If there are sub-sectors, scrape them recursively
    const subSectorIds = sector.getSubSectorIds()
    if (subSectorIds.length > 0) {
      logger.info(
        'scraper:thecrag',
        `Found ${subSectorIds.length} sub-sectors in ${sector.getName()}`,
      )

      for (const subSectorId of subSectorIds) {
        await this.delay()
        await this.scrapeSectorRecursive(
          subSectorId,
          currentDepth + 1,
          maxDepth,
          maxRoutesPerSector,
          allSectors,
          visited,
        )
      }
    }
  }

  /**
   * Scrape a complete area with all its sub-areas, sectors, and routes.
   *
   * This is the main entry point for scraping any area type from TheCrag.
   * It automatically handles:
   * - Crags with multiple sectors
   * - Sectors with direct routes
   * - Mixed areas with both sub-areas and routes
   * - Nested hierarchies of any depth
   *
   * The method:
   * 1. Scrapes the root area to get metadata and identify structure
   * 2. Determines if the area has direct routes, child areas, or both
   * 3. Recursively scrapes all child areas up to maxDepth
   * 4. Links all routes with their topo annotations
   * 5. Returns a complete ScrapedAreaComplete with all data
   *
   * @param areaId - The NodeId of the area to scrape
   * @param options - Optional configuration
   * @returns ScrapedAreaComplete with all sectors and routes
   */
  async scrapeAreaComplete(
    areaId: NodeId,
    options?: {
      /** Maximum number of routes per sector (default: no limit) */
      maxRoutesPerSector?: number
      /** Skip areas with no routes (default: false) */
      skipEmptyAreas?: boolean
    },
  ): Promise<ScrapedAreaComplete> {
    const maxRoutesPerSector = options?.maxRoutesPerSector
    const skipEmptyAreas = options?.skipEmptyAreas ?? false

    logger.info(
      'scraper:thecrag',
      `Starting complete area scrape: ${areaId.toString()} (automatic depth detection)`,
    )

    // Step 1: Scrape the root area to get metadata
    const rootArea = await this.scrapeArea(areaId)
    const rootName = rootArea.getName().toString()
    const rootUrl = rootArea.getUrl().toString()

    logger.info(
      'scraper:thecrag',
      `Root area: ${rootName} - ${rootArea.getChildIds().length} children, checking for routes...`,
    )

    // Step 2: Check if root area has direct routes by checking HTML/topos
    // No need for extra API call - if it has topos with annotations, it has routes
    const rootTopos = rootArea.getTopoImages()
    const hasDirectRoutes = rootTopos.some(
      (topo) => topo.getRouteAnnotations().length > 0,
    )

    // Step 3: Check if root area has child areas (from API response)
    const childAreaIds = rootArea.getChildIds()
    const hasChildAreas = childAreaIds.length > 0

    const rootRouteCount = rootTopos.reduce(
      (sum, topo) => sum + topo.getRouteAnnotations().length,
      0,
    )

    logger.info(
      'scraper:thecrag',
      `Area structure: ${rootRouteCount} direct routes (from topos), ${childAreaIds.length} child areas`,
    )

    const allSectors: ScrapedSector[] = []
    const rootSectorIds: NodeId[] = []
    const visited = new Set<number>()

    // Step 4: If root has direct routes, scrape it as a sector
    if (hasDirectRoutes) {
      logger.info('scraper:thecrag', `Scraping root area routes...`)

      const rootSector = await this.scrapeSectorWithRoutes(areaId, {
        includeSubSectors: hasChildAreas,
        maxRoutes: maxRoutesPerSector,
        scrapedArea: rootArea, // Pass pre-scraped area to avoid duplicate request
      })

      if (!skipEmptyAreas || rootSector.hasRoutes()) {
        allSectors.push(rootSector)
        rootSectorIds.push(areaId)
      }

      visited.add(areaId.getValue())
    }

    // Step 5: Recursively scrape all child areas
    if (hasChildAreas) {
      for (const childId of childAreaIds) {
        if (visited.has(childId.getValue())) {
          continue
        }

        await this.delay()
        await this.scrapeAreaCompleteRecursive(
          childId,
          1, // Current depth (root is 0)
          maxRoutesPerSector,
          skipEmptyAreas,
          allSectors,
          rootSectorIds, // These are direct children of root
          visited,
          undefined, // Will scrape the child area fresh
        )
      }
    }

    logger.info(
      'scraper:thecrag',
      `Complete area scrape finished: ${rootName} - ${allSectors.length} sectors, ${allSectors.reduce((sum, s) => sum + s.getRouteCount(), 0)} total routes`,
    )

    return ScrapedAreaComplete.create(
      areaId,
      rootName,
      rootUrl,
      allSectors,
      rootSectorIds,
    )
  }

  /**
   * Internal recursive method for complete area scraping.
   *
   * IMPORTANT: Cannot optimize further - TheCrag's API reports incorrect route/topo counts.
   * We MUST fetch HTML for every area to get accurate route data from SVG annotations.
   *
   * @param areaId - The area to scrape
   * @param scrapedArea - Optional pre-scraped area data to avoid duplicate requests
   */
  private async scrapeAreaCompleteRecursive(
    areaId: NodeId,
    currentDepth: number,
    maxRoutesPerSector: number | undefined,
    skipEmptyAreas: boolean,
    allSectors: ScrapedSector[],
    rootSectorIds: NodeId[],
    visited: Set<number>,
    scrapedArea?: ScrapedArea,
  ): Promise<void> {
    // Avoid infinite loops
    if (visited.has(areaId.getValue())) {
      return
    }
    visited.add(areaId.getValue())

    logger.info(
      'scraper:thecrag',
      `Scraping area (depth ${currentDepth}): ${areaId.toString()}`,
    )

    // Use pre-scraped area if provided, otherwise scrape it
    // This makes 1 API + 1 HTML request per area
    // NOTE: We CANNOT skip HTML requests based on API data because:
    //   - API often reports numberRoutes: 0, numberTopos: 0
    //   - But HTML contains actual route data in SVG annotations
    //   - Example: "La última" API says 0 routes, HTML has 20 routes
    const area = scrapedArea ?? (await this.scrapeArea(areaId))

    // Check if this area has routes by checking topos (from HTML, not API)
    const topos = area.getTopoImages()
    const hasRoutes = topos.some(
      (topo) => topo.getRouteAnnotations().length > 0,
    )

    // Get child areas from API response
    const childAreaIds = area.getChildIds()
    const hasChildAreas = childAreaIds.length > 0

    const routeCount = topos.reduce(
      (sum, topo) => sum + topo.getRouteAnnotations().length,
      0,
    )

    logger.debug(
      'scraper:thecrag',
      `Area ${area.getName()}: ${routeCount} routes (from topos), ${childAreaIds.length} children`,
    )

    // Scrape this area as a sector if it has routes
    if (hasRoutes || !skipEmptyAreas) {
      const sector = await this.scrapeSectorWithRoutes(areaId, {
        includeSubSectors: hasChildAreas,
        maxRoutes: maxRoutesPerSector,
        scrapedArea: area, // Pass pre-scraped area to avoid duplicate request
      })

      if (!skipEmptyAreas || sector.hasRoutes()) {
        allSectors.push(sector)

        // If at depth 1, this is a direct child of root
        if (currentDepth === 1) {
          rootSectorIds.push(areaId)
        }
      }
    }

    // Recursively process child areas
    // NOTE: Each child will do 1 API + 1 HTML request
    // This is REQUIRED because:
    //   1. TheCrag doesn't include child topos in parent HTML
    //   2. TheCrag's API route/topo counts are unreliable
    //   3. Only way to get accurate route data is parsing each area's HTML
    if (hasChildAreas) {
      for (const childId of childAreaIds) {
        if (visited.has(childId.getValue())) {
          continue
        }

        await this.delay()
        await this.scrapeAreaCompleteRecursive(
          childId,
          currentDepth + 1,
          maxRoutesPerSector,
          skipEmptyAreas,
          allSectors,
          rootSectorIds,
          visited,
          undefined, // Will scrape fresh (1 API + 1 HTML per area - required)
        )
      }
    }
  }

  /**
   * Links RouteWithTopo objects to their corresponding TopoImage.
   * Finds the topo image that contains the annotation for each route.
   */
  private linkRoutesToTopoImages(
    routesWithTopos: RouteWithTopo[],
    topoImages: TopoImage[],
  ): RouteWithTopo[] {
    return routesWithTopos.map((routeWithTopo) => {
      if (!routeWithTopo.hasTopoAnnotation()) {
        return routeWithTopo
      }

      const routeId = routeWithTopo.getRouteId().getValue()

      // Find the topo image that contains this route's annotation
      const matchingTopo = topoImages.find((topo) =>
        topo.getRouteAnnotations().some((ann) => ann.getId() === routeId),
      )

      if (matchingTopo) {
        // Create a new RouteWithTopo with the correct topo image
        return RouteWithTopo.create(
          routeWithTopo.getRoute(),
          routeWithTopo.getTopoAnnotation(),
          matchingTopo,
        )
      }

      return routeWithTopo
    })
  }

  // ========================================
  // PRIVATE PARSING METHODS - Value Objects
  // ========================================

  private parseNodeStatistics(
    apiResponse: Record<string, unknown> | null,
  ): NodeStatistics | null {
    return NodeStatistics.fromApiResponse(apiResponse)
  }

  private parseNodeSeasonality(
    apiResponse: Record<string, unknown> | null,
  ): NodeSeasonality | null {
    return NodeSeasonality.fromApiResponse(apiResponse)
  }

  private parseNodeTags(
    apiResponse: Record<string, unknown> | null,
  ): NodeTags | null {
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    const tags = data?.tags as
      | Record<string, Record<string, unknown>>
      | undefined

    if (!tags || typeof tags !== 'object') return null

    return NodeTags.fromApiTags(
      tags as Parameters<typeof NodeTags.fromApiTags>[0],
    )
  }

  private parseNodeMetadata(
    apiResponse: Record<string, unknown> | null,
  ): NodeMetadata | null {
    return NodeMetadata.fromApiResponse(apiResponse)
  }

  private parseWebCoverImage(
    apiResponse: Record<string, unknown> | null,
  ): WebCoverImage | null {
    return WebCoverImage.fromApiResponse(apiResponse)
  }

  private parseTopoImages(html: string): TopoImage[] {
    const $ = cheerio.load(html)
    const topoImages: TopoImage[] = []

    // Debug: Check if HTML contains topo images
    const phototopoDivs = $('div.phototopo[data-tid]')
    logger.debug(
      'scraper:thecrag',
      `Found ${phototopoDivs.length} div.phototopo elements in HTML`,
    )

    $('div.phototopo[data-tid]').each((_, el) => {
      const $el = $(el)

      const topoIdRaw = $el.attr('data-tid') || ''
      const displayWidth = Number.parseInt($el.attr('data-width') || '0', 10)
      const displayHeight = Number.parseInt($el.attr('data-height') || '0', 10)
      const viewScale = Number.parseFloat($el.attr('data-view-scale') || '1')
      const topoDataStr = $el.attr('data-topodata') || '[]'

      // Extract image URLs
      const imgEl = $el.find('img').first()
      const thumbnailUrlRaw = this.normalizeImageUrl(imgEl.attr('src') || '')
      const fullImageUrlRaw =
        this.normalizeImageUrl(imgEl.attr('data-big') || '') || thumbnailUrlRaw

      if (!topoIdRaw || (!thumbnailUrlRaw && !fullImageUrlRaw)) return

      // Parse dimensions
      const dimensions = TopoDimensions.fromDisplayWithScale(
        displayWidth,
        displayHeight,
        viewScale,
      )

      // Parse annotations
      const annotations = TopoAnnotation.parseFromTopoDataJson(topoDataStr)

      // Create value objects for the entity
      const topoId = TopoId.create(topoIdRaw)
      const thumbnailUrl = thumbnailUrlRaw
        ? TopoImageUrl.create(thumbnailUrlRaw)
        : TopoImageUrl.empty()
      const fullImageUrl = fullImageUrlRaw
        ? TopoImageUrl.create(fullImageUrlRaw)
        : thumbnailUrl

      const topoImage = TopoImage.create(
        topoId,
        dimensions,
        thumbnailUrl,
        fullImageUrl,
        annotations,
      )

      topoImages.push(topoImage)
    })

    return topoImages
  }

  private parseChildIds(apiResponse: Record<string, unknown> | null): NodeId[] {
    if (!apiResponse) return []

    const data = apiResponse.data as Record<string, unknown> | undefined
    const childIDs = data?.childIDs as number[] | undefined

    if (!childIDs || !Array.isArray(childIDs)) return []

    return childIDs.map((id) => NodeId.create(id))
  }

  private parseRouteGrade(
    apiResponse: Record<string, unknown> | null,
  ): RouteGrade | null {
    return RouteGrade.fromApiResponse(apiResponse)
  }

  private parseRouteInfoFromHtml(html: string): RouteInfo | null {
    const $ = cheerio.load(html)

    // Look for data-route-tick attribute in route elements
    const routeEl = $('[data-route-tick]').first()
    if (!routeEl.length) return null

    const routeTickStr = routeEl.attr('data-route-tick') || '{}'

    try {
      const routeTickData = JSON.parse(routeTickStr)
      return RouteInfo.fromRouteTickData(routeTickData)
    } catch {
      return null
    }
  }

  private parseRouteHistory(
    apiResponse: Record<string, unknown> | null,
  ): RouteHistory | null {
    return RouteHistory.fromApiResponse(apiResponse)
  }

  private parseRouteBeta(
    apiResponse: Record<string, unknown> | null,
  ): RouteBeta | null {
    return RouteBeta.fromApiResponse(apiResponse)
  }

  /**
   * Parse area beta information from API response.
   * Extracts summary from 'unique' field and description/approach from 'beta' array.
   */
  private parseAreaBeta(apiResponse: Record<string, unknown> | null): AreaBeta {
    return AreaBeta.fromApiResponse(apiResponse)
  }

  // ========================================
  // PRIVATE FETCH METHODS
  // ========================================

  private async fetchNodeInfo(
    nodeId: NodeId,
  ): Promise<Record<string, unknown> | null> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId.toString()}?show=info,description,approach,access,beta,history,ethics,tags,geometry,urlStub,urlAncestorStub,webcover,seasonality,childIDs`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    return parsed
  }

  private buildNodeUrl(
    nodeId: NodeId,
    urlStub?: string,
    urlAncestorStub?: string,
  ): string {
    if (urlStub) {
      const ancestorPart = urlAncestorStub ? `${urlAncestorStub}/` : ''
      const stubPart = urlStub.startsWith('/') ? urlStub.slice(1) : urlStub
      return `/en/climbing/${ancestorPart}${stubPart}`
    }
    if (urlAncestorStub) {
      return `/en/climbing/${urlAncestorStub}/area/${nodeId}`
    }
    return `/en/climbing/area/${nodeId}`
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  private normalizeImageUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return `https://www.thecrag.com${url}`
    return url
  }

  // ========================================
  // HTTP REQUEST METHODS
  // ========================================

  private static readonly MAX_API_RETRIES = 3

  private async curlRequest(url: string, retryCount = 0): Promise<string> {
    const proxy = this.options.useProxies ? this.proxyManager.getNext() : null

    // Log API request
    logger.info('scraper:thecrag', `[API REQUEST] ${url}`)

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

      const isBlocked = this.isResponseBlocked(result)

      if (isBlocked) {
        if (proxy) {
          this.proxyManager.reportFailure(proxy)
          logger.warn(
            'scraper:thecrag',
            `Request blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/${TheCragApiScraper.MAX_API_RETRIES}`,
          )
          if (retryCount + 1 < TheCragApiScraper.MAX_API_RETRIES) {
            return this.curlRequest(url, retryCount + 1)
          }
          throw new Error(
            `Request blocked after ${TheCragApiScraper.MAX_API_RETRIES} attempts: ${isBlocked}`,
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

  private isResponseBlocked(result: string): string | false {
    if (!result || result.length === 0) {
      return 'empty response'
    }

    const trimmed = result.trim()

    if (
      trimmed === '[]' ||
      trimmed === '{}' ||
      trimmed === 'null' ||
      trimmed === '[[]]' ||
      trimmed.startsWith('[') ||
      trimmed.startsWith('{')
    ) {
      return false
    }

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
    if (result.includes('cf-browser-verification')) {
      return 'Cloudflare challenge'
    }
    if (
      result.includes('Proxy Authentication Required') ||
      result.includes('407 Proxy Authentication')
    ) {
      return 'proxy auth failed'
    }
    if (result.includes('<!DOCTYPE') || result.includes('<html')) {
      if (result.includes('Access Denied') || result.includes('Forbidden')) {
        return 'Access Denied (HTML)'
      }
      if (result.includes('cloudflare')) {
        return 'Cloudflare challenge'
      }
      return false
    }

    return false
  }

  /**
   * Parse route data from HTML sector/area page.
   * Extracts detailed route information from data-route-tick attributes and HTML structure.
   *
   * @param html - The HTML content of the sector page
   * @returns Array of parsed route data objects
   */
  private parseRoutesFromHtml(html: string): Array<{
    id: string
    name: string
    grade: string | null
    stars: number | null
    styleStub: string | null
    displayHeight: number | null
    bolts: number | null
    description: string | null
    equipperName: string | null
    dateEquipped: string | null
    alternativeNames: string[]
    popularity: { ascents: number; score: number } | null
    gradeContext: string | null
  }> {
    const $ = load(html)
    const routes: Array<{
      id: string
      name: string
      grade: string | null
      stars: number | null
      styleStub: string | null
      displayHeight: number | null
      bolts: number | null
      description: string | null
      equipperName: string | null
      dateEquipped: string | null
      alternativeNames: string[]
      popularity: { ascents: number; score: number } | null
      gradeContext: string | null
    }> = []

    // Debug: Check what elements exist
    const routeElements = $('.route[data-nid][data-route-tick]')
    logger.debug(
      'scraper:thecrag',
      `Found ${routeElements.length} .route[data-nid][data-route-tick] elements in HTML`,
    )

    if (routeElements.length === 0) {
      // Try alternative selectors
      const altRoute1 = $('.route[data-nid]')
      const altRoute2 = $('[data-route-tick]')
      logger.debug(
        'scraper:thecrag',
        `Alternative selectors: .route[data-nid]=${altRoute1.length}, [data-route-tick]=${altRoute2.length}`,
      )
    }

    $('.route[data-nid][data-route-tick]').each((_, el) => {
      const $route = $(el)

      // Parse data-route-tick JSON
      const routeTickJson = $route.attr('data-route-tick') || ''

      // Define explicit type for route tick data
      type RouteTickData = {
        id?: string
        name?: string
        gradeAtom?: { grade?: string }
        stars?: string
        styleStub?: string
        displayHeight?: [number, string]
        context?: string
        bolts?: number
      }

      let routeTickData: RouteTickData = {}
      try {
        routeTickData = JSON.parse(routeTickJson.replace(/&quot;/g, '"'))
      } catch (e) {
        logger.warn(
          'scraper:thecrag',
          `Failed to parse data-route-tick for route: ${e}`,
        )
      }

      // Extract route ID
      const id = routeTickData.id || $route.attr('data-nid') || ''
      if (!id) return // Skip if no ID

      // Extract name
      const name =
        routeTickData.name ||
        $route.find('.name .primary-node-name').text().trim() ||
        ''
      if (!name) return // Skip if no name

      // Extract grade
      const grade = routeTickData.gradeAtom?.grade || null

      // Extract stars (convert to number)
      const stars = routeTickData.stars
        ? Number.parseFloat(routeTickData.stars)
        : null

      // Extract style
      const styleStub = routeTickData.styleStub || null

      // Extract display height (meters)
      const displayHeight =
        Array.isArray(routeTickData.displayHeight) &&
        routeTickData.displayHeight[0]
          ? Number.parseInt(routeTickData.displayHeight[0].toString())
          : null

      // Extract number of bolts
      const boltsFromData = routeTickData.bolts
      const boltsTitle = $route.find('.bolts').attr('title')
      const boltsMatch = boltsTitle?.match(/(\d+)\s+bolt/)
      const bolts =
        boltsFromData || (boltsMatch ? Number.parseInt(boltsMatch[1]) : null)

      // Extract description
      const description = $route.find('.markdown.desc').text().trim() || null

      // Extract route history (equipper/setter info)
      const histWho = $route.find('.route-history .fa__who').text().trim()
      const histWhen = $route.find('.route-history .fa__when').text().trim()

      const equipperName = histWho || null
      const dateEquipped = histWhen || null

      // Extract alternative names (aka)
      const akaText = $route.find('.name .aka').next().text().trim()
      const alternativeNames = akaText ? [akaText] : []

      // Extract popularity (ascent count)
      const popTitle = $route.find('.r-pop a').attr('title')
      const popMatch = popTitle?.match(/(\d+)\s+ascents?/)
      const popScoreMatch = popTitle?.match(/Relative popularity \((\d+)\)/)
      const popularity =
        popMatch && popScoreMatch
          ? {
              ascents: Number.parseInt(popMatch[1]),
              score: Number.parseInt(popScoreMatch[1]),
            }
          : null

      // Extract grade context (system)
      const gradeContext = routeTickData.context || null

      routes.push({
        id,
        name,
        grade,
        stars,
        styleStub,
        displayHeight,
        bolts,
        description,
        equipperName,
        dateEquipped,
        alternativeNames,
        popularity,
        gradeContext,
      })
    })

    return routes
  }

  private static readonly MAX_HTML_RETRIES = 3

  private async curlRequestHtml(url: string, retryCount = 0): Promise<string> {
    const proxy = this.options.useProxies ? this.proxyManager.getNext() : null

    // Log HTML request
    logger.info('scraper:thecrag', `[HTML REQUEST] ${url}`)

    const args = [
      'curl',
      url,
      '--globoff',
      '--compressed',
      '-s',
      '-L',
      '-H',
      `User-Agent: ${this.USER_AGENT}`,
      '-H',
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '-H',
      'Accept-Language: en-US,en;q=0.5',
      '-H',
      'Accept-Encoding: gzip, deflate, br',
      '-H',
      'DNT: 1',
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
      '-H',
      'Cache-Control: max-age=0',
    ]

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

      const isBlocked = this.isHtmlResponseBlocked(result)

      if (isBlocked) {
        if (proxy) {
          this.proxyManager.reportFailure(proxy)
          logger.warn(
            'scraper:thecrag',
            `HTML blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/${TheCragApiScraper.MAX_HTML_RETRIES}`,
          )
          if (retryCount + 1 < TheCragApiScraper.MAX_HTML_RETRIES) {
            return this.curlRequestHtml(url, retryCount + 1)
          }
          throw new Error(
            `Request blocked after ${TheCragApiScraper.MAX_HTML_RETRIES} attempts: ${isBlocked}`,
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

  private isHtmlResponseBlocked(result: string): string | false {
    if (!result || result.length === 0) {
      return 'empty response'
    }

    if (result.length < 100 && !result.includes('<')) {
      return `too short for HTML (${result.length} chars)`
    }

    if (result.includes('Access Denied')) {
      return 'Access Denied'
    }
    if (result.includes('403 Forbidden')) {
      return '403 Forbidden'
    }
    if (result.includes('rate limit') || result.includes('Rate limit')) {
      return 'rate limited'
    }
    if (result.includes('cf-browser-verification')) {
      return 'Cloudflare challenge'
    }
    if (
      result.includes('<title>Just a moment...</title>') ||
      (result.includes('Just a moment...') && !result.includes('theCrag'))
    ) {
      return 'Cloudflare waiting page'
    }
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
