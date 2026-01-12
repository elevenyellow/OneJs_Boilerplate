import { Injectable, logger } from '@OneJs/core'
import { ScrapedArea } from '@scraper-thecrag/domain/entities/scraped-area.entity'
import { ScrapedRoute } from '@scraper-thecrag/domain/entities/scraped-route.entity'
import { AreaBeta } from '@scraper-thecrag/domain/value-objects/area-beta.vo'
import { AreaName } from '@scraper-thecrag/domain/value-objects/area-name.vo'
import { AreaSlug } from '@scraper-thecrag/domain/value-objects/area-slug.vo'
import { AreaUrl } from '@scraper-thecrag/domain/value-objects/area-url.vo'
import { ImageUrl } from '@scraper-thecrag/domain/value-objects/image-url.vo'
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
import { TopoAnnotation } from '@scraper-thecrag/domain/value-objects/topo-annotation.vo'
import { TopoDimensions } from '@scraper-thecrag/domain/value-objects/topo-dimensions.vo'
import { TopoImage } from '@scraper-thecrag/domain/value-objects/topo-image.vo'
import { WebCoverFocus } from '@scraper-thecrag/domain/value-objects/webcover-focus.vo'
import { WebCoverImage } from '@scraper-thecrag/domain/value-objects/webcover-image.vo'
import * as cheerio from 'cheerio'
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

  // ========================================
  // PRIVATE PARSING METHODS - Value Objects
  // ========================================

  private parseNodeStatistics(
    apiResponse: Record<string, unknown> | null,
  ): NodeStatistics | null {
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    if (!data) return null

    return NodeStatistics.create(
      (data.numberRoutes as number) ?? 0,
      (data.numberAscents as number) ?? 0,
      (data.numberPhotos as number) ?? 0,
      (data.numberFavorites as number) ?? 0,
      (data.numberKudos as number) ?? 0,
    )
  }

  private parseNodeSeasonality(
    apiResponse: Record<string, unknown> | null,
  ): NodeSeasonality | null {
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    const seasonality = data?.seasonality as number[] | undefined

    if (!seasonality || !Array.isArray(seasonality)) return null

    return NodeSeasonality.create(seasonality)
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
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    if (!data) return null

    return NodeMetadata.create(
      (data.depth as number) ?? 0,
      (data.siblingLabel as number) ?? 0,
      (data.priceCategory as string) ?? '',
      (data.isTopLevelCrag as boolean) ?? false,
      (data.locatedness as number) ?? 0,
      (data.maxPopularity as number) ?? 0,
    )
  }

  private parseWebCoverImage(
    apiResponse: Record<string, unknown> | null,
  ): WebCoverImage | null {
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    const webcover = data?.webcover as Record<string, unknown> | undefined

    if (!webcover) return null

    const hashId = webcover.hashId as string | undefined
    if (!hashId) return null

    const thumbnailUrl = this.buildImageUrl(hashId, 200, 150)
    const fullUrl = this.buildFullImageUrl(hashId)

    const imageUrl = ImageUrl.create(thumbnailUrl, fullUrl, hashId)

    const focusData = webcover.focus as Record<string, unknown> | undefined
    let focus: WebCoverFocus | null = null
    if (focusData) {
      focus = WebCoverFocus.create(
        (focusData.top as number) ?? 0,
        (focusData.bottom as number) ?? 0,
        (focusData.left as number) ?? 0,
        (focusData.right as number) ?? 0,
        (focusData.label as string) ?? '',
      )
    }

    return WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: (webcover.width as number) ?? null,
      originalHeight: (webcover.height as number) ?? null,
      dateUploaded: (webcover.dateUploaded as string) ?? null,
      title: (webcover.title as string) ?? null,
    })
  }

  private parseTopoImages(html: string): TopoImage[] {
    const $ = cheerio.load(html)
    const topoImages: TopoImage[] = []

    $('div.phototopo[data-tid]').each((_, el) => {
      const $el = $(el)

      const topoId = $el.attr('data-tid') || ''
      const displayWidth = Number.parseInt($el.attr('data-width') || '0', 10)
      const displayHeight = Number.parseInt($el.attr('data-height') || '0', 10)
      const viewScale = Number.parseFloat($el.attr('data-view-scale') || '1')
      const topoDataStr = $el.attr('data-topodata') || '[]'

      // Extract image URLs
      const imgEl = $el.find('img').first()
      const thumbnailUrl = this.normalizeImageUrl(imgEl.attr('src') || '')
      const fullImageUrl =
        this.normalizeImageUrl(imgEl.attr('data-big') || '') || thumbnailUrl

      if (!topoId || (!thumbnailUrl && !fullImageUrl)) return

      // Parse dimensions
      const dimensions = TopoDimensions.fromDisplayWithScale(
        displayWidth,
        displayHeight,
        viewScale,
      )

      // Parse annotations
      const annotations = TopoAnnotation.parseFromTopoDataJson(topoDataStr)

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
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    const grade = data?.grade as string | undefined
    const gradeClass = data?.gradeClass as string | undefined

    if (!grade) return null

    return RouteGrade.create(grade, gradeClass ?? 'gb3')
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
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    const history = data?.history as Array<Record<string, unknown>> | undefined

    if (!history || !Array.isArray(history) || history.length === 0) return null

    // Get first ascent info
    const fa = history.find((h) => h.type === 'FA' || h.type === 'FFA')
    if (!fa) return null

    return RouteHistory.create(
      (fa.type as string) ?? 'FA',
      (fa.climber as string) ?? '',
      (fa.date as string) ?? null,
    )
  }

  private parseRouteBeta(
    apiResponse: Record<string, unknown> | null,
  ): RouteBeta | null {
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined

    const description = data?.description as string | undefined
    const approach = data?.approach as string | undefined
    const uniqueFeatures = data?.uniqueFeatures as string | undefined

    if (!description && !approach && !uniqueFeatures) return null

    return RouteBeta.create(
      description ?? null,
      approach ?? null,
      uniqueFeatures ?? null,
    )
  }

  /**
   * Parse area beta information from API response.
   * Extracts summary from 'unique' field and description/approach from 'beta' array.
   */
  private parseAreaBeta(apiResponse: Record<string, unknown> | null): AreaBeta {
    if (!apiResponse) return AreaBeta.empty()

    const data = apiResponse.data as Record<string, unknown> | undefined
    if (!data) return AreaBeta.empty()

    // Summary comes from the 'unique' field
    const summary = (data.unique as string) ?? null

    // Description and approach come from the 'beta' array
    const description = this.extractBetaEntryByName(data, 'Description')
    const approach = this.extractBetaEntryByName(data, 'Approach')

    return AreaBeta.create(summary, description, approach)
  }

  /**
   * Extract a specific entry from the 'beta' array by name.
   * The beta array contains objects with 'name' and 'markdown' fields.
   */
  private extractBetaEntryByName(
    data: Record<string, unknown>,
    entryName: string,
  ): string | null {
    const beta = data.beta as
      | Array<{ markdown?: string; name?: string }>
      | undefined

    if (!beta || !Array.isArray(beta)) return null

    const entry = beta.find((b) => b.name === entryName)
    return entry?.markdown ?? null
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

  private buildImageUrl(hashId: string, width: number, height: number): string {
    if (!hashId) return ''
    return `https://static.thecrag.com/cache/img_${hashId.substring(0, 8)}_${width}x${height}.jpg`
  }

  private buildFullImageUrl(hashId: string): string {
    if (!hashId) return ''
    return `https://static.thecrag.com/cids/${hashId}.jpg`
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

  private static readonly MAX_HTML_RETRIES = 3

  private async curlRequestHtml(url: string, retryCount = 0): Promise<string> {
    const proxy = this.options.useProxies ? this.proxyManager.getNext() : null

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
