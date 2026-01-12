import type { GeometryData } from '@climb-zone/shared'
import { Injectable, logger } from '@OneJs/core'
import { ImageUrl } from '@scraper-thecrag/domain/value-objects/image-url.vo'
import * as cheerio from 'cheerio'
import { ScrapedArea } from '../../domain/entities/scraped-area.entity'
import type { ScrapedNode } from '../../domain/entities/scraped-node.interface'
import { ScrapedRoute } from '../../domain/entities/scraped-route.entity'
import { ScrapedSector } from '../../domain/entities/scraped-sector.entity'
import { TopoImage } from '../../domain/entities/topo-image.entity'
import { ChildNode } from '../../domain/value-objects/child-node.vo'
import { GeoCoordinates } from '../../domain/value-objects/geo-coordinates.vo'
import { NodeId } from '../../domain/value-objects/node-id.vo'
import { NodeInfo } from '../../domain/value-objects/node-info.vo'
import { NodeType } from '../../domain/value-objects/node-type.vo'
import { RouteHeight } from '../../domain/value-objects/route-height.vo'
import { SectorPath } from '../../domain/value-objects/sector-path.vo'
import { TopoAnnotation } from '../../domain/value-objects/topo-annotation.vo'
import { TopoDimensions } from '../../domain/value-objects/topo-dimensions.vo'
import { TopoId } from '../../domain/value-objects/topo-id.vo'
import { TopoImageUrl } from '../../domain/value-objects/topo-image-url.vo'
import { DEFAULT_PROXIES, ProxyManager } from '../utils/proxy-manager'

/**
 * TheCrag API Scraper
 * Extracts climbing data from TheCrag's internal API
 */
export interface ScraperOptions {
  /** Download and generate composite images (default: false) */
  generateComposites?: boolean
  /** Output directory for composite images */
  outputDir?: string
}

@Injectable()
export class TheCragApiScraper {
  private readonly BASE_URL = 'https://www.thecrag.com'
  private readonly USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'

  private cookie: string = ''
  private delayMs: number = 50

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
   * Scrape a complete crag with all children and routes.
   * Returns a ScrapedNode (ScrapedArea or ScrapedSector based on type).
   */
  async scrapeCrag(
    cragId: NodeId,
    type: NodeType = NodeType.crag(),
  ): Promise<ScrapedNode> {
    return this.traverse(cragId, type, 0, null)
  }

  /**
   * Recursively traverse the crag hierarchy.
   * Returns a ScrapedNode (ScrapedArea or ScrapedSector based on type).
   */
  private async traverse(
    nodeId: NodeId,
    type: NodeType,
    depth: number,
    geometryFromParent: GeometryData | null,
    urlStubFromParent?: string,
    urlAncestorStubFromParent?: string,
  ): Promise<ScrapedNode> {
    logger.info(
      'scraper:thecrag',
      `Traversing node: ${nodeId.toString()} (type: ${type.toString()})`,
    )

    // Non-expandable nodes (Cliff) - return minimal entity
    if (!type.isExpandable()) {
      return this.createNodeEntity(
        nodeId,
        type,
        NodeInfo.fromRawData({}),
        [],
        [],
        [],
        [],
      )
    }

    await this.delay()

    // Fetch core data in parallel
    const { info, children, routes } = await this.fetchNodeCoreData(
      nodeId,
      type,
    )

    // Build URL path for HTML pages (use NodeInfo getters, convert to strings)
    const urlStub = info.getUrlStub()?.toString() || urlStubFromParent
    const urlAncestorStub =
      info.getUrlAncestorStub()?.toString() || urlAncestorStubFromParent
    const sectorPath = SectorPath.build(nodeId, urlStub, urlAncestorStub)

    // Fetch topos and header image
    const topos = await this.fetchToposIfNeeded(
      type,
      sectorPath,
      routes,
      children,
    )
    const cragTopos = await this.fetchCragToposIfNeeded(type, sectorPath)
    const headerImageUrl = await this.fetchHeaderImageIfNeeded(
      type,
      nodeId,
      sectorPath.toString(),
    )

    // Build merged NodeInfo with header image and geometry
    const mergedInfo = this.buildMergedNodeInfo(info, {
      urlStub,
      urlAncestorStub,
      headerImageUrl,
      geometryFromParent,
    })

    // Process children recursively
    const childNodes = await this.traverseChildrenInBatches(children, depth)

    // Create and return the appropriate entity
    return this.createNodeEntity(
      nodeId,
      type,
      mergedInfo,
      routes,
      topos,
      cragTopos,
      childNodes,
    )
  }

  /**
   * Creates the appropriate ScrapedNode entity based on node type.
   * Uses ScrapedArea for Region/Area/Crag, ScrapedSector for Sector/Cliff.
   */
  private createNodeEntity(
    nodeId: NodeId,
    type: NodeType,
    info: NodeInfo,
    routes: ScrapedRoute[],
    topos: TopoImage[],
    cragTopos: TopoImage[],
    children: ScrapedNode[],
  ): ScrapedNode {
    if (type.isSector() || type.isCliff()) {
      return ScrapedSector.fromScrapedData(
        nodeId,
        type,
        info,
        routes,
        topos,
        children,
      )
    }

    return ScrapedArea.fromScrapedData(
      nodeId,
      type,
      info,
      routes,
      topos,
      cragTopos,
      children,
    )
  }

  /**
   * Builds a merged NodeInfo combining original info with fallback/parent data.
   */
  private buildMergedNodeInfo(
    info: NodeInfo,
    fallbackData: {
      urlStub: string | undefined
      urlAncestorStub: string | undefined
      headerImageUrl: string | null
      geometryFromParent: GeometryData | null
    },
  ): NodeInfo {
    // Convert GeometryData to the format expected by NodeInfo
    const geometryDto = fallbackData.geometryFromParent
      ? {
          lat: fallbackData.geometryFromParent.lat ?? 0,
          long: fallbackData.geometryFromParent.long ?? 0,
        }
      : null

    const fallbackNodeInfo = NodeInfo.fromRawData({
      urlStub: fallbackData.urlStub,
      urlAncestorStub: fallbackData.urlAncestorStub,
      headerImageUrl: fallbackData.headerImageUrl,
      geometry: geometryDto,
    })

    // Merge: original info values take precedence, fallback fills gaps
    return fallbackNodeInfo.mergeWith(info)
  }

  /**
   * Fetch core node data in parallel (info, children, routes).
   * Returns properly typed VOs/Entities instead of raw data.
   */
  private async fetchNodeCoreData(
    nodeId: NodeId,
    type: NodeType,
  ): Promise<{
    info: NodeInfo
    children: ChildNode[]
    routes: ScrapedRoute[]
  }> {
    const needsRoutes = type.isSector() || type.isCliff() || type.isCrag()

    const [info, children, routes] = await Promise.all([
      this.getNodeInfo(nodeId),
      this.getChildren(nodeId),
      needsRoutes ? this.getRoutes(nodeId) : Promise.resolve([]),
    ])

    return { info, children, routes }
  }

  /**
   * Fetch topos from sector page if needed
   */
  private async fetchToposIfNeeded(
    type: NodeType,
    sectorPath: SectorPath,
    routes: unknown[],
    children: unknown[],
  ): Promise<TopoImage[]> {
    const needsSectorTopos = type.isSector() || type.isCliff()

    if (needsSectorTopos) {
      return this.getToposFromSectorPage(sectorPath.getValue())
    }

    // Special case: Crag with direct routes (no children)
    const isCragWithDirectRoutes =
      type.isCrag() && routes.length > 0 && children.length === 0

    if (isCragWithDirectRoutes) {
      logger.info(
        'scraper:thecrag',
        `Crag has direct routes - fetching sector topos from: ${sectorPath.getValue()}`,
      )
      return this.getToposFromSectorPage(sectorPath.getValue())
    }

    return []
  }

  /**
   * Fetch crag overview topos if needed
   */
  private async fetchCragToposIfNeeded(
    type: NodeType,
    sectorPath: SectorPath,
  ): Promise<TopoImage[]> {
    if (type.isCrag()) {
      logger.info(
        'scraper:thecrag',
        `Fetching crag overview topos from: ${sectorPath.getValue()}`,
      )
      return this.getCragToposFromPage(sectorPath.getValue())
    }

    return []
  }

  /**
   * Fetch header image if needed
   */
  private async fetchHeaderImageIfNeeded(
    type: NodeType,
    nodeId: NodeId,
    sectorPath: string,
  ): Promise<string | null> {
    const needsHeaderImage = type.isCrag() || type.isSector() || type.isCliff()

    if (needsHeaderImage) {
      return this.getHeaderImage(nodeId, sectorPath)
    }

    return null
  }

  /**
   * Traverse children in parallel batches to avoid overwhelming the server.
   * Uses ChildNode value objects for type safety.
   * Returns ScrapedNode entities.
   */
  private async traverseChildrenInBatches(
    children: ChildNode[],
    depth: number,
  ): Promise<ScrapedNode[]> {
    const BATCH_SIZE = 3 // Process 3 nodes in parallel
    const results = []

    for (let i = 0; i < children.length; i += BATCH_SIZE) {
      const batch = children.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map((child) =>
          this.traverse(
            child.getId(),
            child.getType(),
            depth + 1,
            child.getGeometry() ?? null,
            child.getUrlStub() ?? undefined,
            child.getUrlAncestorStub() ?? undefined,
          ),
        ),
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Get children of a node (sub-areas) as ChildNode value objects.
   * @param nodeId - The parent node ID to fetch children for
   * @returns Array of ChildNode value objects
   */
  async getChildren(nodeId: NodeId): Promise<ChildNode[]> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId.toString()}/children/area?flatten=data[id,name,urlStub,urlAncestorStub,subAreaCount,subType,asciiName,approach,map,geo,location,geolocation,geometry,lat,lng,latitude,longitude,image,images,photo,photos,coverImage,thumbnail,media,numberPhotos]&expires=10`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed[0] ?? []

    // Parse array format using ChildNode VO
    const children = data.map((item: unknown[]) =>
      ChildNode.fromApiArrayItem(item),
    )

    // Debug: log first child to see URL structure
    if (children.length > 0) {
      const firstChild = children[0]
      logger.info(
        'scraper:thecrag',
        `First child URL info: urlStub=${firstChild.getUrlStub()}, urlAncestorStub=${firstChild.getUrlAncestorStub()}`,
      )
    }

    return children
  }

  /**
   * Get routes for a node as ScrapedRoute entities.
   * @param nodeId - The parent node ID to fetch routes for
   * @param parentAreaId - Optional parent area ID to assign to each route
   * @returns Array of ScrapedRoute entities
   */
  async getRoutes(
    nodeId: NodeId,
    parentAreaId?: NodeId,
  ): Promise<ScrapedRoute[]> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId.toString()}/children/route?flatten=data[id,name,grade,gradeIndex,height,pitches,quality,stars,ascents,subType,bolts,firstAscent,tags,warnings]&expires=10`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed[0] ?? []

    // Parse array format: [id, name, grade, gradeIndex, height, pitches, quality, stars, ascents, subType, bolts, firstAscent, tags, warnings]
    return data.map((r: unknown[]) => {
      const routeData = {
        id: Number(r[0]),
        name: r[1] as string,
        grade: (r[2] as string) || null,
        gradeIndex: (r[3] as number) || null,
        height: RouteHeight.parse(r[4])?.getValue() ?? null,
        pitches: (r[5] as number) ?? null,
        quality: (r[6] as number) ?? null,
        stars: (r[7] as number) ?? null,
        ascents: (r[8] as number) ?? null,
        subType: (r[9] as string) ?? null,
        bolts: (r[10] as number) ?? null,
        firstAscent: (r[11] as string) ?? null,
        tags: (r[12] as string[] | null) ?? null,
        warnings: (r[13] as string[] | null) ?? null,
      }

      return ScrapedRoute.fromApiRouteData(routeData, parentAreaId ?? nodeId)
    })
  }

  /**
   * Get topos (images with route annotations) from sector page
   * @param sectorPath - Full path like "/en/climbing/spain/castellon/area/787116657"
   */
  async getToposFromSectorPage(sectorPath: string) {
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
  }

  /**
   * Parse topo images from sector HTML page
   * Extracts phototopo elements with images and route/area annotations
   */
  private parseToposFromSectorHtml(html: string): TopoImage[] {
    const $ = cheerio.load(html)
    const topos: TopoImage[] = []

    $('div.phototopo[data-tid]').each((_, el) => {
      const topoImage = this.parseTopoElementToTopoImage($, $(el))
      if (topoImage) {
        topos.push(topoImage)
      }
    })

    return topos
  }

  /**
   * Parse a single phototopo element into a TopoImage entity
   */
  private parseTopoElementToTopoImage(
    $: cheerio.CheerioAPI,
    $el: ReturnType<cheerio.CheerioAPI>,
  ): TopoImage | null {
    const topoIdRaw = $el.attr('data-tid') || ''
    if (!topoIdRaw) return null

    const displayWidth = Number.parseInt($el.attr('data-width') || '0', 10)
    const displayHeight = Number.parseInt($el.attr('data-height') || '0', 10)
    const viewScale = Number.parseFloat($el.attr('data-view-scale') || '1')

    if (displayWidth <= 0 || displayHeight <= 0 || viewScale <= 0) {
      return null
    }

    const dimensions = TopoDimensions.fromDisplayWithScale(
      displayWidth,
      displayHeight,
      viewScale,
    )

    const topoDataStr = $el.attr('data-topodata') || '[]'
    let annotations: TopoAnnotation[] = []
    try {
      annotations = TopoAnnotation.parseFromTopoDataJson(topoDataStr)
    } catch {
      logger.warn(
        'scraper:thecrag',
        `Failed to parse topo annotations for ${topoIdRaw}`,
      )
    }

    const imgEl = $el.find('img').first()
    const thumbnailUrlRaw = ImageUrl.normalize(imgEl.attr('src') || '')
    const fullImageUrlRaw =
      ImageUrl.normalize(imgEl.attr('data-big') || '') || thumbnailUrlRaw

    if (!thumbnailUrlRaw && !fullImageUrlRaw) {
      return null
    }

    // Create value objects for the entity
    const topoId = TopoId.create(topoIdRaw)
    const thumbnailUrl = thumbnailUrlRaw
      ? TopoImageUrl.create(thumbnailUrlRaw)
      : TopoImageUrl.empty()
    const fullImageUrl = fullImageUrlRaw
      ? TopoImageUrl.create(fullImageUrlRaw)
      : thumbnailUrl

    return TopoImage.create(
      topoId,
      dimensions,
      thumbnailUrl,
      fullImageUrl,
      annotations,
    )
  }

  /**
   * Get crag overview topos (topos that show sectors/areas instead of routes)
   * @param cragPath - Full path like "/en/climbing/spain/castellon/chulilla"
   */
  async getCragToposFromPage(cragPath: string) {
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
  private parseCragToposFromHtml(html: string): TopoImage[] {
    const $ = cheerio.load(html)
    const topos: TopoImage[] = []

    // First, try to find topos specifically inside .phototopo-fsc container
    // This is the main crag overview topo showing all sectors
    const fscContainer = $('div.phototopo-fsc')

    // If we have a .phototopo-fsc container, only look for topos there
    // Otherwise, fall back to searching all phototopo elements with area annotations
    const searchContext = fscContainer.length > 0 ? fscContainer : $('body')

    searchContext.find('div.phototopo[data-tid]').each((_, el) => {
      const topoImage = this.parseTopoElementToTopoImage($, $(el))
      if (topoImage) {
        topos.push(topoImage)
      }
    })

    return topos
  }

  /**
   * Get header/cover image URL for a node (crag or sector)
   * @param nodeId - Node ID to get header image for
   * @param urlStub - URL stub for the node (e.g., "spain/valencia/chulilla")
   * @returns Header image URL or null if not found
   */
  async getHeaderImage(
    nodeId: NodeId,
    urlStub?: string,
  ): Promise<string | null> {
    try {
      // Build the URL - use urlStub if available, otherwise use nodeId
      const path = urlStub
        ? `${this.BASE_URL}${urlStub}`
        : `${this.BASE_URL}/en/climbing/area/${nodeId.toString()}`

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
          `Found header image for node ${nodeId.toString()}: ${imageUrl.substring(0, 80)}...`,
        )
      }
      return imageUrl
    } catch (err) {
      logger.warn(
        'scraper:thecrag',
        `Failed to get header image for node ${nodeId.toString()}: ${err}`,
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
      return ImageUrl.normalize(ogImage)
    }

    // 2. Hero/banner images
    const heroImg = $(
      '.hero-image img, .cover-image img, .header-image img, .banner img',
    ).first()
    if (heroImg.length > 0) {
      const src = heroImg.attr('src') || heroImg.attr('data-src')
      if (src && src.includes('image.thecrag.com')) {
        return ImageUrl.normalize(src)
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

    return foundUrl ? ImageUrl.normalize(foundUrl) : null
  }

  /**
   * Get detailed info for a node as a NodeInfo value object.
   * @param nodeId - The node ID to fetch info for
   * @returns NodeInfo value object with URL stubs and geometry
   */
  async getNodeInfo(nodeId: NodeId): Promise<NodeInfo> {
    const url = `${this.BASE_URL}/api/node/id/${nodeId.toString()}?show=info,description,approach,access,beta,history,ethics,tags,geometry,urlStub,urlAncestorStub`

    const output = await this.curlRequest(url)
    const parsed = JSON.parse(output)
    const data = parsed.data || parsed

    // Extract geometry (coordinates) with multiple fallbacks
    const geometry = await this.extractNodeGeometry(nodeId, data)

    // Create NodeInfo VO from raw data
    return NodeInfo.fromRawData({
      urlStub: (data.urlStub as string) || null,
      urlAncestorStub: (data.urlAncestorStub as string) || null,
      headerImageUrl: null, // Will be set later
      geometry: geometry,
    })
  }

  /**
   * Extract geometry coordinates with multiple fallback strategies
   */
  private async extractNodeGeometry(
    nodeId: NodeId,
    data: Record<string, unknown>,
  ): Promise<{ lat: number; long: number } | null> {
    // Strategy 1: Extract from API response directly using GeoCoordinates VO
    const apiCoords = GeoCoordinates.fromApiResponse(data)
    if (apiCoords) {
      logger.info(
        'scraper:thecrag',
        `Got coordinates from API for node ${nodeId.toString()}: ${apiCoords.getLatitude()}, ${apiCoords.getLongitude()}`,
      )
      return apiCoords.toDto()
    }

    // Strategy 2: Extract from beta text (approach, description) using GeoCoordinates VO
    const betaCoords = GeoCoordinates.fromBetaText(
      data.beta as Array<{ name: string; markdown: string }> | undefined,
    )
    if (betaCoords) {
      logger.info(
        'scraper:thecrag',
        `Got coordinates from beta text for node ${nodeId.toString()}: ${betaCoords.getLatitude()}, ${betaCoords.getLongitude()}`,
      )
      return betaCoords.toDto()
    }

    // Strategy 3: Web page scraping as last resort
    const urlStub = data.urlStub as string | undefined
    const urlAncestorStub = data.urlAncestorStub as string | undefined
    if (urlStub || urlAncestorStub) {
      const pagePath = `/en/climbing/${urlAncestorStub || ''}${urlStub || `area/${nodeId.toString()}`}`
      const webCoords = await this.getCoordinatesFromWebPage(pagePath)
      if (webCoords) {
        logger.info(
          'scraper:thecrag',
          `Got coordinates from web page for node ${nodeId.toString()}: ${webCoords.getLatitude()}, ${webCoords.getLongitude()}`,
        )
        return webCoords.toDto()
      }
    }

    return null
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
  ): Promise<GeoCoordinates | null> {
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
          if (GeoCoordinates.isValid(lat, lng)) {
            return GeoCoordinates.createFrom(lat, lng)
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
        if (GeoCoordinates.isValid(lat, lng)) {
          return GeoCoordinates.createFrom(lat, lng)
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
          if (GeoCoordinates.isValid(lat, lng)) {
            logger.info(
              'scraper:thecrag',
              `Found coordinates in maps link: ${lat}, ${lng}`,
            )
            return GeoCoordinates.createFrom(lat, lng)
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
            GeoCoordinates.isValid(lat, lng) &&
            Math.abs(lat) > 20 &&
            Math.abs(lat) < 70
          ) {
            logger.info(
              'scraper:thecrag',
              `Found coordinates in link: ${lat}, ${lng}`,
            )
            return GeoCoordinates.createFrom(lat, lng)
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
        const lat = Number.parseFloat(coordMatch[1])
        const lng = Number.parseFloat(coordMatch[2])
        if (GeoCoordinates.isValid(lat, lng)) {
          return GeoCoordinates.createFrom(lat, lng)
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

  private static readonly MAX_API_RETRIES = 3

  /**
   * Make HTTP request using curl for API endpoints
   */
  private async curlRequest(url: string, retryCount = 0): Promise<string> {
    const proxy = this.proxyManager.getNext()

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
            `Request blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/${TheCragApiScraper.MAX_API_RETRIES}`,
          )
          // Retry with next proxy if we haven't exceeded max retries
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
    const proxy = this.proxyManager.getNext()

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
            `HTML blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/${TheCragApiScraper.MAX_HTML_RETRIES}`,
          )
          // Retry with next proxy if we haven't exceeded max retries
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
