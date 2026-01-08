import { Inject, Injectable } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import {
  ScrapeOptions,
  type ScrapeOptionsDto,
} from '@scraper-thecrag/domain/dtos/scrape-options.dto'
import {
  TheCragScraper,
  type ScrapeResult,
} from '@scraper-thecrag/infrastructure/scrapers/thecrag.scraper'

export interface ScrapeZonesResult {
  success: boolean
  result: ScrapeResult
  message: string
}

@Injectable()
export class ScrapeZonesUseCase {
  constructor(
    @Inject(TheCragScraper)
    private readonly scraper: TheCragScraper,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Ejecuta el scraping de zonas de escalada
   */
  async execute(optionsDto: ScrapeOptionsDto = {}): Promise<ScrapeZonesResult> {
    const options = new ScrapeOptions(optionsDto)

    console.log('🧗 Starting zone scraping...', {
      countries: options.countries,
      maxZones: options.maxZones,
      maxDepth: options.maxDepth,
    })

    try {
      const result = await this.scraper.scrapeZones(options)

      console.log('✅ Scraping completed:', {
        zonesFound: result.stats.zonesFound,
        successful: result.stats.successfulScrapes,
        failed: result.stats.failedScrapes,
        duration: `${(result.stats.duration / 1000).toFixed(2)}s`,
      })

      // Publicar evento de scraping completado
      // await this.eventBus.publish(new ZonesScrapedEvent(result))

      return {
        success: true,
        result,
        message: `Successfully scraped ${result.stats.zonesFound} zones`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('❌ Scraping failed:', message)

      return {
        success: false,
        result: {
          zones: [],
          errors: [{ url: 'general', message, retries: 0 }],
          stats: {
            totalUrls: 0,
            successfulScrapes: 0,
            failedScrapes: 1,
            duration: 0,
            zonesFound: 0,
          },
        },
        message: `Scraping failed: ${message}`,
      }
    }
  }

  /**
   * Scrapea un país específico
   */
  async scrapeCountry(
    countrySlug: string,
    optionsDto: Partial<ScrapeOptionsDto> = {},
  ): Promise<ScrapeZonesResult> {
    console.log(`🧗 Scraping country: ${countrySlug}`)

    try {
      const result = await this.scraper.scrapeCountry(countrySlug, optionsDto)

      return {
        success: true,
        result,
        message: `Successfully scraped ${result.stats.zonesFound} zones from ${countrySlug}`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        result: {
          zones: [],
          errors: [{ url: countrySlug, message, retries: 0 }],
          stats: {
            totalUrls: 0,
            successfulScrapes: 0,
            failedScrapes: 1,
            duration: 0,
            zonesFound: 0,
          },
        },
        message: `Failed to scrape ${countrySlug}: ${message}`,
      }
    }
  }

  /**
   * Obtiene la lista de países disponibles
   */
  async getAvailableCountries(): Promise<{ name: string; url: string }[]> {
    return this.scraper.getAvailableCountries()
  }
}


