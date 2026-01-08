import { Inject, Injectable } from '@OneJs/core'
import {
  TheCragParserService,
  type ParsedAreaLink,
} from '@scraper-thecrag/application/services/thecrag-parser.service'
import type { ScrapedZoneDto } from '@scraper-thecrag/domain/dtos/scraped-zone.dto'
import { ScrapeOptions } from '@scraper-thecrag/domain/dtos/scrape-options.dto'

export interface ScrapeResult {
  zones: ScrapedZoneDto[]
  errors: ScrapeError[]
  stats: ScrapeStats
}

export interface ScrapeError {
  url: string
  message: string
  retries: number
}

export interface ScrapeStats {
  totalUrls: number
  successfulScrapes: number
  failedScrapes: number
  duration: number
  zonesFound: number
}

import { CragAreaDto, CragAreaData } from '@scraper-thecrag/domain/dtos/crag-area.dto'

@Injectable()
export class TheCragScraper {
  private readonly BASE_URL = 'https://www.thecrag.com'
  private readonly USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
  private cookies: string = ''
  private sessionInitialized: Promise<void> | null = null

  constructor(
    @Inject(TheCragParserService)
    private readonly parser: TheCragParserService,
  ) {}

  /**
   * Inicializa una sesión visitando la página principal
   */
  private async initializeSession(): Promise<void> {
    if (this.sessionInitialized) {
      return this.sessionInitialized
    }

    this.sessionInitialized = (async () => {
      try {
        const response = await fetch(`${this.BASE_URL}/en/climbing`, {
          headers: {
            'User-Agent': this.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        })
        
        // Extraer cookies de la respuesta
        const setCookieHeaders = response.headers.getSetCookie()
        if (setCookieHeaders && setCookieHeaders.length > 0) {
          this.cookies = setCookieHeaders
            .map(cookie => cookie.split(';')[0])
            .join('; ')
          console.log('Session initialized with cookies')
        }
      } catch (error) {
        console.error('Error initializing session:', error)
      }
    })()

    return this.sessionInitialized
  }

  /**
   * Busca zonas en TheCrag
   */
  async search(query: string): Promise<CragAreaDto[]> {
    const url = `${this.BASE_URL}/search?q=${encodeURIComponent(query)}`
    try {
      const html = await this.fetchWithRetry(url, 2)
      return this.parser.parseSearchResults(html)
    } catch (error) {
      console.error(`Error searching ${query}:`, error)
      return []
    }
  }

  /**
   * Obtiene los hijos de un área usando la API
   */
  async getAreaChildren(nodeId: string): Promise<CragAreaDto[]> {
    // Asegurar que tenemos sesión
    await this.initializeSession()
    
    console.log(`Fetching children for node ${nodeId}`)
    console.log(`Using cookies: ${this.cookies ? 'YES' : 'NO'}`)

    const url = `${this.BASE_URL}/api/node/id/${nodeId}/children/area?flatten=data[id,name,urlStub,urlAncestorStub,subAreaCount,subType,asciiName]&expires=10`
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': `${this.BASE_URL}/en/climbing`,
          ...(this.cookies && { 'Cookie': this.cookies }),
        },
      })

      console.log(`API Response status: ${response.status}`)

      if (!response.ok) {
        const text = await response.text()
        console.error(`API Error ${response.status}:`, text)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json() as { data?: CragAreaData[], error?: string }
      
      console.log(`API Response:`, JSON.stringify(json).slice(0, 200))
      
      if (json.error) {
        console.error('API returned error:', json.error)
        return []
      }

      if (!json.data || !Array.isArray(json.data)) {
        console.log('No data array in response')
        return []
      }

      console.log(`Found ${json.data.length} children`)
      return json.data.map(item => CragAreaDto.fromApiData(item))
    } catch (error) {
      console.error(`Error fetching children for node ${nodeId}:`, error)
      return []
    }
  }

  /**
   * Scrapea zonas de escalada según las opciones proporcionadas
   */
  async scrapeZones(options: ScrapeOptions): Promise<ScrapeResult> {
    const startTime = Date.now()
    const zones: ScrapedZoneDto[] = []
    const errors: ScrapeError[] = []

    let urlsToScrape: string[] = []

    // Determinar URLs a scrapear
    if (options.hasSpecificUrls()) {
      urlsToScrape = options.specificUrls
    } else {
      // Obtener lista de países y navegar jerarquía
      urlsToScrape = await this.discoverZoneUrls(options)
    }

    const stats: ScrapeStats = {
      totalUrls: urlsToScrape.length,
      successfulScrapes: 0,
      failedScrapes: 0,
      duration: 0,
      zonesFound: 0,
    }

    // Scrapear cada URL
    for (const url of urlsToScrape) {
      if (zones.length >= options.maxZones) {
        break
      }

      try {
        const zone = await this.scrapeZoneWithRetry(url, options)
        if (zone) {
          zones.push(zone)
          stats.successfulScrapes++
          stats.zonesFound++
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push({ url, message, retries: options.retries })
        stats.failedScrapes++
      }

      // Rate limiting
      await this.delay(options.delayMs)
    }

    stats.duration = Date.now() - startTime

    return { zones, errors, stats }
  }

  /**
   * Descubre URLs de zonas navegando la jerarquía
   */
  private async discoverZoneUrls(options: ScrapeOptions): Promise<string[]> {
    const urls: string[] = []
    const visited = new Set<string>()

    // Empezar desde la raíz o países específicos
    const startUrls = options.countries.length > 0
      ? options.countries.map((c) => `${this.BASE_URL}/climbing/${c.toLowerCase()}`)
      : [this.BASE_URL]

    const queue: { url: string; depth: number }[] = startUrls.map((url) => ({
      url,
      depth: 0,
    }))

    while (queue.length > 0 && urls.length < options.maxZones) {
      const item = queue.shift()!
      if (visited.has(item.url)) continue
      visited.add(item.url)

      try {
        const html = await this.fetchWithRetry(item.url, options.retries)
        const links = this.parser.parseAreaLinks(html)

        for (const link of links) {
          if (visited.has(link.url)) continue

          // Si tiene rutas, es una zona que queremos
          if (link.routeCount && link.routeCount > 0) {
            urls.push(link.url)
          }

          // Continuar navegando si no hemos alcanzado la profundidad máxima
          if (item.depth < options.maxDepth) {
            queue.push({ url: link.url, depth: item.depth + 1 })
          }
        }

        await this.delay(options.delayMs)
      } catch (error) {
        console.error(`Error discovering URLs from ${item.url}:`, error)
      }
    }

    return urls
  }

  /**
   * Scrapea una zona con reintentos
   */
  private async scrapeZoneWithRetry(
    url: string,
    options: ScrapeOptions,
  ): Promise<ScrapedZoneDto | null> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        const html = await this.fetchWithRetry(url, 1)
        const zone = this.parser.parseZoneDetails(html, url)
        return zone
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt < options.retries) {
          // Backoff exponencial
          await this.delay(options.delayMs * Math.pow(2, attempt))
        }
      }
    }

    throw lastError || new Error(`Failed to scrape ${url}`)
  }

  /**
   * Realiza fetch con reintentos y manejo de errores
   */
  private async fetchWithRetry(url: string, maxRetries: number): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.USER_AGENT,
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          // Manejar rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After')
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000
            console.warn(`Rate limited at ${url}, waiting ${waitTime}ms`)
            await this.delay(waitTime)
            continue
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.text()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < maxRetries) {
          // Backoff exponencial con jitter
          const jitter = Math.random() * 1000
          await this.delay(1000 * Math.pow(2, attempt) + jitter)
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${url}`)
  }

  /**
   * Obtiene la lista de todos los países disponibles
   */
  async getAvailableCountries(): Promise<ParsedAreaLink[]> {
    const html = await this.fetchWithRetry(`${this.BASE_URL}/climbing`, 3)
    return this.parser.parseCountryList(html)
  }

  /**
   * Scrapea un país específico
   */
  async scrapeCountry(
    countrySlug: string,
    options?: Partial<ScrapeOptions>,
  ): Promise<ScrapeResult> {
    const scrapeOptions = new ScrapeOptions({
      ...options,
      specificUrls: [`${this.BASE_URL}/climbing/${countrySlug}`],
    })

    return this.scrapeZones(scrapeOptions)
  }

  /**
   * Scrapea una URL específica y retorna los detalles de la zona
   */
  async scrapeUrl(url: string): Promise<ScrapedZoneDto | null> {
    try {
      const html = await this.fetchWithRetry(url, 3)
      return this.parser.parseZoneDetails(html, url)
    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
      return null
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}


