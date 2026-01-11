import { Injectable, logger } from '@OneJs/core'
import type {
  HeaderImageData,
  TopoImageData,
  TopoRouteAnnotation,
} from '@scraper-thecrag/domain/dtos/topo-image.dto'
import * as cheerio from 'cheerio'
import { DEFAULT_PROXIES, ProxyManager } from '../utils/proxy-manager'

/**
 * Area/region info extracted from TheCrag
 */
export interface ScrapedAreaInfo {
  nodeId: string
  name: string
  url: string
  type?: string // 'region', 'area', 'crag', 'sector', etc.
  located?: boolean
}

/**
 * Raw data extracted from a TheCrag web page
 */
export interface WebScrapedData {
  title?: string
  description?: string
  breadcrumbs?: string[]
  stats?: Record<string, string | number>
  coordinates?: { lat: number; lng: number }
  imageUrls?: string[]
  childLinks?: Array<{ name: string; url: string; type?: string }>
  areas?: ScrapedAreaInfo[]
  rawHtml?: string
}

/**
 * TheCrag Web Scraper
 * Extracts climbing data by scraping the HTML pages of TheCrag
 * Uses Cheerio for HTML parsing and curl for requests (bypasses anti-bot)
 */
@Injectable()
export class TheCragWebScraper {
  private readonly BASE_URL = 'https://www.thecrag.com'
  private readonly USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'

  private cookie: string = ''
  private delayMs: number = 100
  private useProxies: boolean = true
  private proxyManager: ProxyManager

  constructor() {
    this.proxyManager = new ProxyManager({ maxFailures: 5, cooldownMs: 60000 })
    this.proxyManager.addProxies(DEFAULT_PROXIES)
  }

  /**
   * Set authentication cookie for web requests
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
    this.useProxies = enabled
    if (enabled) {
      const stats = this.proxyManager.getStats()
      logger.info(
        'scraper:thecrag-web',
        `Proxies enabled: ${stats.active}/${stats.total} active`,
      )
    } else {
      logger.info('scraper:thecrag-web', 'Proxies disabled')
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
   * Fetch a page from TheCrag and return raw HTML
   * @param path - Relative path (e.g., "/climbing/spain") or full URL
   */
  async fetchPage(path: string): Promise<string> {
    const url = path.startsWith('http') ? path : `${this.BASE_URL}${path}`

    logger.info('scraper:thecrag-web', `Fetching page: ${url}`)
    await this.delay()

    return this.curlRequest(url)
  }

  /**
   * Fetch and parse a page from TheCrag
   * @param path - Relative path (e.g., "/climbing/spain") or full URL
   */
  async scrapePage(path: string): Promise<WebScrapedData> {
    const html = await this.fetchPage(path)
    return this.parseHtml(html)
  }

  /**
   * Scrape a climbing zone page (country, region, area, crag)
   * @param path - The path to the zone (e.g., "/en/climbing/europe" or "/en/climbing/world")
   */
  async scrapeZonePage(path: string): Promise<WebScrapedData> {
    const html = await this.fetchPage(path)
    const $ = cheerio.load(html)

    const data: WebScrapedData = {}

    // Extract page title from <title> tag or h1
    const titleTag = $('title').text().trim()
    data.title =
      titleTag.replace(/\s*\|\s*theCrag.*$/i, '').trim() ||
      $('h1').first().text().trim()

    // Extract description from meta tag
    data.description = $('meta[name="description"]').attr('content') || ''

    // Extract breadcrumbs from .crumbs
    data.breadcrumbs = []
    $('#breadCrumbs .crumb__a span[itemprop="name"], .crumbs .crumb__a').each(
      (_, el) => {
        const text = $(el).text().trim()
        if (text && text !== '') {
          data.breadcrumbs!.push(text)
        }
      },
    )

    // Extract statistics from node-info
    data.stats = {}
    $('.node-info .stat, .stats .stat').each((_, el) => {
      const text = $(el).text().trim()
      // Parse stats like "1234 routes" or "56 crags"
      const match = text.match(/(\d+[\d,]*)\s+(\w+)/i)
      if (match) {
        const value = parseInt(match[1].replace(/,/g, ''), 10)
        const label = match[2].toLowerCase()
        data.stats![label] = value
      }
    })

    // Extract coordinates from various sources
    const coords = this.extractCoordinates($)
    if (coords) {
      data.coordinates = coords
    }

    // Extract images
    data.imageUrls = []
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src')
      if (src && src.includes('image.thecrag.com')) {
        data.imageUrls!.push(src)
      }
    })

    // Extract areas from .area divs (TheCrag's actual structure)
    data.areas = []
    $('div.area[data-nid]').each((_, el) => {
      const nodeId = $(el).attr('data-nid')
      const nameEl = $(el).find('.name a .primary-node-name')
      const name = nameEl.text().trim()
      const linkEl = $(el).find('.name a')
      const href = linkEl.attr('href')
      const type = $(el).find('.name .type').text().trim()
      const locatedClass = $(el).find('.loc .mappin').hasClass('located')

      if (nodeId && name && href) {
        data.areas!.push({
          nodeId,
          name,
          url: href.startsWith('http') ? href : `${this.BASE_URL}${href}`,
          type: type || undefined,
          located: locatedClass,
        })
      }
    })

    // Also extract child links for backwards compatibility
    data.childLinks =
      data.areas?.map((area) => ({
        name: area.name,
        url: area.url,
        type: area.type,
      })) || []

    return data
  }

  /**
   * Scrape the list of climbing areas for a country/region
   * @param countryPath - Path like "/en/climbing/spain" or "/en/climbing/europe"
   */
  async scrapeAreaList(countryPath: string): Promise<ScrapedAreaInfo[]> {
    const html = await this.fetchPage(countryPath)
    const $ = cheerio.load(html)

    const areas: ScrapedAreaInfo[] = []

    // TheCrag uses div.area[data-nid] for area listings
    $('div.area[data-nid]').each((_, el) => {
      const nodeId = $(el).attr('data-nid')
      const nameEl = $(el).find('.name a .primary-node-name')
      const name = nameEl.text().trim()
      const linkEl = $(el).find('.name a')
      const href = linkEl.attr('href')
      const type = $(el).find('.name .type').text().trim()
      const locatedClass = $(el).find('.loc .mappin').hasClass('located')

      if (nodeId && name && href) {
        areas.push({
          nodeId,
          name,
          url: href.startsWith('http') ? href : `${this.BASE_URL}${href}`,
          type: type || undefined,
          located: locatedClass,
        })
      }
    })

    return areas
  }

  /**
   * Search for climbing areas on TheCrag
   * @param query - Search query
   */
  async search(
    query: string,
  ): Promise<Array<{ name: string; url: string; type?: string }>> {
    const encodedQuery = encodeURIComponent(query)
    const searchUrl = `${this.BASE_URL}/search?q=${encodedQuery}`

    const html = await this.fetchPage(searchUrl)
    const $ = cheerio.load(html)

    const results: Array<{ name: string; url: string; type?: string }> = []

    $('.search-result, .result-item').each((_, el) => {
      const linkEl = $(el).find('a').first()
      const name = linkEl.text().trim()
      const url = linkEl.attr('href')
      const type = $(el).find('.type, .result-type').text().trim()

      if (name && url) {
        results.push({
          name,
          url: url.startsWith('http') ? url : `${this.BASE_URL}${url}`,
          type: type || undefined,
        })
      }
    })

    return results
  }

  /**
   * Scrape topo images from a sector/crag page
   * @param path - Path to the sector page (e.g., "/en/climbing/spain/castellon/area/787116657")
   * Note: Images are extracted from the main sector page, not from /topos endpoint
   */
  async scrapeTopoImages(path: string): Promise<TopoImageData[]> {
    // Use the sector page directly (not /topos which doesn't work)
    // Remove /topos suffix if present
    const sectorPath = path.replace(/\/topos$/, '')
    const html = await this.fetchPage(sectorPath)

    return this.parseTopoImagesFromHtml(html)
  }

  /**
   * Parse topo images from HTML content
   */
  parseTopoImagesFromHtml(html: string): TopoImageData[] {
    const $ = cheerio.load(html)
    const topos: TopoImageData[] = []

    // Find all phototopo elements
    $('div.phototopo[data-tid]').each((_, el) => {
      const $el = $(el)

      const topoId = $el.attr('data-tid') || ''
      const width = parseInt($el.attr('data-width') || '0', 10)
      const height = parseInt($el.attr('data-height') || '0', 10)
      const viewScale = parseFloat($el.attr('data-view-scale') || '1')
      const topoDataStr = $el.attr('data-topodata') || '[]'

      // Extract image URLs and normalize them (add https: if needed)
      const imgEl = $el.find('img').first()
      const rawThumbnailUrl = imgEl.attr('src') || ''
      const rawFullImageUrl = imgEl.attr('data-big') || rawThumbnailUrl

      // Normalize URLs - TheCrag uses protocol-relative URLs like //image.thecrag.com/...
      const normalizeImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('//')) return `https:${url}`
        if (url.startsWith('/')) return `https://www.thecrag.com${url}`
        return url
      }

      const thumbnailUrl = normalizeImageUrl(rawThumbnailUrl)
      const fullImageUrl = normalizeImageUrl(rawFullImageUrl)

      // Calculate original dimensions
      const originalWidth =
        viewScale > 0 ? Math.round(width / viewScale) : width
      const originalHeight =
        viewScale > 0 ? Math.round(height / viewScale) : height

      // Parse route annotations
      let routes: TopoRouteAnnotation[] = []
      try {
        const rawRoutes = JSON.parse(topoDataStr)
        routes = rawRoutes.map((r: Record<string, unknown>) => ({
          id: r.id as number,
          type: (r.type as string) || 'route',
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
        }))
      } catch {
        logger.warn(
          'scraper:thecrag-web',
          `Failed to parse topo data for ${topoId}`,
        )
      }

      if (topoId && thumbnailUrl) {
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
   * Scrape crag overview topos (topos that show sectors/areas instead of routes)
   * @param path - Path to the crag page
   */
  async scrapeCragTopoImages(path: string): Promise<TopoImageData[]> {
    const cragPath = path.replace(/\/topos$/, '')
    const html = await this.fetchPage(cragPath)

    return this.parseCragTopoImagesFromHtml(html)
  }

  /**
   * Parse crag overview topo images from HTML content
   * These topos have annotations of type 'area' instead of 'route'
   */
  parseCragTopoImagesFromHtml(html: string): TopoImageData[] {
    const $ = cheerio.load(html)
    const topos: TopoImageData[] = []

    // Find all phototopo elements (same structure as sector topos)
    $('div.phototopo[data-tid]').each((_, el) => {
      const $el = $(el)

      const topoId = $el.attr('data-tid') || ''
      const width = parseInt($el.attr('data-width') || '0', 10)
      const height = parseInt($el.attr('data-height') || '0', 10)
      const viewScale = parseFloat($el.attr('data-view-scale') || '1')
      const topoDataStr = $el.attr('data-topodata') || '[]'

      // Extract image URLs and normalize them
      const imgEl = $el.find('img').first()
      const rawThumbnailUrl = imgEl.attr('src') || ''
      const rawFullImageUrl = imgEl.attr('data-big') || rawThumbnailUrl

      const normalizeImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('//')) return `https:${url}`
        if (url.startsWith('/')) return `https://www.thecrag.com${url}`
        return url
      }

      const thumbnailUrl = normalizeImageUrl(rawThumbnailUrl)
      const fullImageUrl = normalizeImageUrl(rawFullImageUrl)

      const originalWidth =
        viewScale > 0 ? Math.round(width / viewScale) : width
      const originalHeight =
        viewScale > 0 ? Math.round(height / viewScale) : height

      // Parse annotations (can be areas or routes)
      let routes: TopoRouteAnnotation[] = []
      try {
        const rawData = JSON.parse(topoDataStr)
        routes = rawData.map((r: Record<string, unknown>) => ({
          id: r.id as number,
          type: (r.type as string) || 'area', // Default to 'area' for crag topos
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
        }))
      } catch {
        logger.warn(
          'scraper:thecrag-web',
          `Failed to parse crag topo data for ${topoId}`,
        )
      }

      // Only include topos that have area annotations (crag overview topos)
      const hasAreaAnnotations = routes.some((r) => r.type === 'area')
      
      if (topoId && thumbnailUrl && hasAreaAnnotations) {
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
   * Scrape header/cover images from a crag/sector page
   * @param path - Path to the page
   */
  async scrapeHeaderImages(path: string): Promise<HeaderImageData[]> {
    const html = await this.fetchPage(path)
    return this.parseHeaderImagesFromHtml(html)
  }

  /**
   * Parse header images from HTML content
   */
  parseHeaderImagesFromHtml(html: string): HeaderImageData[] {
    const $ = cheerio.load(html)
    const images: HeaderImageData[] = []

    // Look for cover/header images in various locations
    // 1. Hero/cover images
    $('.hero-image img, .cover-image img, .header-image img, .banner img').each(
      (_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src')
        if (src && src.includes('image.thecrag.com')) {
          images.push({
            url: src,
            alt: $(el).attr('alt') || undefined,
          })
        }
      },
    )

    // 2. OG image from meta tags (usually the main image)
    const ogImage = $('meta[property="og:image"]').attr('content')
    if (ogImage && ogImage.includes('image.thecrag.com')) {
      images.push({
        url: ogImage,
        alt: 'Cover image',
      })
    }

    // 3. Large images in content area
    $('img[src*="image.thecrag.com"]').each((_, el) => {
      const src = $(el).attr('src') || ''
      // Filter for larger images (containing size hints like /700x or /1200x)
      if (src.match(/\/\d{3,}x\d{3,}\//)) {
        const sizeMatch = src.match(/\/(\d+)x(\d+)\//)
        images.push({
          url: src,
          width: sizeMatch ? parseInt(sizeMatch[1], 10) : undefined,
          height: sizeMatch ? parseInt(sizeMatch[2], 10) : undefined,
          alt: $(el).attr('alt') || undefined,
        })
      }
    })

    // Deduplicate by URL (keep first occurrence)
    const seen = new Set<string>()
    return images.filter((img) => {
      // Normalize URL by removing size prefix for comparison
      const normalized = img.url.replace(/\/\d+x\d+\//, '/')
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
  }

  /**
   * Extract high-resolution image URL from TheCrag image URL
   * @param imageUrl - Original image URL
   * @param width - Desired width (optional, default max)
   * @param height - Desired height (optional, default max)
   */
  getHighResImageUrl(imageUrl: string, width = 2656, height = 2000): string {
    // TheCrag image URLs format: https://image.thecrag.com/WIDTHxHEIGHT/HASH
    // Replace the size component
    return imageUrl.replace(/\/\d+x\d+\//, `/${width}x${height}/`)
  }

  /**
   * Parse raw HTML and extract basic data
   */
  parseHtml(html: string): WebScrapedData {
    const $ = cheerio.load(html)

    const data: WebScrapedData = {
      rawHtml: html,
    }

    // Extract title
    data.title = $('title').text().trim() || $('h1').first().text().trim()

    // Extract meta description
    data.description = $('meta[name="description"]').attr('content') || ''

    return data
  }

  /**
   * Extract coordinates from page
   */
  private extractCoordinates(
    $: cheerio.CheerioAPI,
  ): { lat: number; lng: number } | null {
    // Try script with coordinates
    const scripts = $('script').toArray()
    for (const script of scripts) {
      const content = $(script).html() || ''

      // Look for lat/lng patterns in JavaScript
      const latMatch = content.match(
        /["']?lat(?:itude)?["']?\s*[:=]\s*(-?\d+\.?\d*)/i,
      )
      const lngMatch = content.match(
        /["']?(?:lng|lon|longitude)["']?\s*[:=]\s*(-?\d+\.?\d*)/i,
      )

      if (latMatch && lngMatch) {
        return {
          lat: parseFloat(latMatch[1]),
          lng: parseFloat(lngMatch[1]),
        }
      }
    }

    // Try data attributes
    const geoEl = $(
      '[data-lat][data-lng], [data-latitude][data-longitude]',
    ).first()
    if (geoEl.length) {
      const lat = parseFloat(
        geoEl.attr('data-lat') || geoEl.attr('data-latitude') || '',
      )
      const lng = parseFloat(
        geoEl.attr('data-lng') || geoEl.attr('data-longitude') || '',
      )
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng }
      }
    }

    // Try Google Maps link
    const mapsLink = $(
      'a[href*="google.com/maps"], a[href*="maps.google"]',
    ).attr('href')
    if (mapsLink) {
      const match = mapsLink.match(/[?&@](-?\d+\.?\d*),(-?\d+\.?\d*)/)
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2]),
        }
      }
    }

    return null
  }

  /**
   * Make HTTP request using curl (bypasses some anti-bot measures)
   */
  private async curlRequest(url: string): Promise<string> {
    const proxy = this.useProxies ? this.proxyManager.getNext() : null

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
        'scraper:thecrag-web',
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
      const isBlocked = this.isResponseBlocked(result)

      if (isBlocked) {
        if (proxy) {
          this.proxyManager.reportFailure(proxy)
          logger.warn(
            'scraper:thecrag-web',
            `Request blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked}`,
          )
          // Retry with next proxy
          return this.curlRequest(url)
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
   */
  private isResponseBlocked(result: string): string | false {
    // Empty response
    if (!result || result.length === 0) {
      return 'empty response'
    }

    // Very short for HTML (less than 100 chars is suspicious)
    if (result.length < 100 && !result.includes('<')) {
      return `too short (${result.length} chars)`
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
