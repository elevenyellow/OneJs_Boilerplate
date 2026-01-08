import { ConfigService, Inject, Injectable, logger } from '@OneJs/core'
import { BootstrapBase } from '@OneJs/core/bootstrap'
import {
  ContinentEntity,
  ContinentPrismaRepository,
} from '@climb-zone/continent'
import { CountryEntity, CountryPrismaRepository } from '@climb-zone/country'
import { ExternalId, Geometry } from '@climb-zone/shared'
import { ScraperQueueService } from '@scraper-thecrag/application/services/scraper-queue.service'
import { TheCragApiScraper } from '@scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'

// ID del nodo "World" en TheCrag
const WORLD_NODE_ID = 7546063

// Continentes a ignorar (zonas de prueba)
const IGNORED_CONTINENTS = ['Virtual', 'test area']

/**
 * Bootstrap que arranca el scraping de continentes y países
 * al iniciar el servidor, y luego encola jobs para scrapear
 * los crags de cada país
 */
@Injectable()
export class ScraperBootstrap extends BootstrapBase {
  constructor(
    @Inject(TheCragApiScraper)
    private readonly scraper: TheCragApiScraper,
    @Inject(ContinentPrismaRepository)
    private readonly continentRepo: ContinentPrismaRepository,
    @Inject(CountryPrismaRepository)
    private readonly countryRepo: CountryPrismaRepository,
    @Inject(ScraperQueueService)
    private readonly scraperQueue: ScraperQueueService,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {
    super()

    logger.info('================================================')
    logger.info('scraper:bootstrap', 'Scraper bootstrap initialized')
    logger.info('================================================')
  }

  async bootstrap(): Promise<void> {
    logger.info('scraper:bootstrap', '🌍 Starting TheCrag scraper bootstrap...')

    // Configurar cookie desde env
    const cookie = this.config.get('THECRAG_COOKIE')
    if (cookie) {
      this.scraper.setCookie(cookie)
      logger.debug('scraper:bootstrap', '🔑 Cookie configured from env')
    } else {
      logger.warn(
        'scraper:bootstrap',
        '⚠️ No THECRAG_COOKIE found in env. Some requests may fail.',
      )
    }

    // Configurar delay
    const delay = this.config.get('THECRAG_DELAY_MS')
    if (delay) {
      this.scraper.setDelay(parseInt(delay, 10))
    }

    // Verificar si ya tenemos continentes
    const existingContinents = await this.continentRepo.findAll()
    if (existingContinents.length === 0) {
      // Scrapear continentes y países
      await this.scrapeWorldData()
    } else {
      logger.info(
        'scraper:bootstrap',
        `✅ Found ${existingContinents.length} continents in database`,
      )
    }

    // Encolar jobs para scrapear países (en dev solo España)
    await this.scraperQueue.enqueueCountries()

    logger.info('scraper:bootstrap', '✅ Scraper bootstrap completed!')
  }

  private async scrapeWorldData(): Promise<void> {
    logger.info('scraper:bootstrap', '📍 Fetching continents from TheCrag...')

    const continents = await this.scraper.getChildren(WORLD_NODE_ID)

    if (continents.length === 0) {
      logger.warn(
        'scraper:bootstrap',
        '⚠️ No continents found. Cookie may be expired.',
      )
      return
    }

    logger.info('scraper:bootstrap', `Found ${continents.length} continents`)

    let totalCountries = 0
    let savedContinents = 0

    for (const continent of continents) {
      if (IGNORED_CONTINENTS.includes(continent.name)) {
        continue
      }

      try {
        const continentEntity = ContinentEntity.create(
          ExternalId.create(continent.id),
          continent.name,
          continent.geometry ? Geometry.fromJSON(continent.geometry) : null,
        )

        const savedContinent = await this.continentRepo.save(continentEntity)
        savedContinents++

        const countries = await this.scraper.getChildren(continent.id)
        logger.info(
          'scraper:bootstrap',
          `   ${continent.name}: ${countries.length} countries`,
        )

        for (const country of countries) {
          try {
            const countryEntity = CountryEntity.create(
              ExternalId.create(country.id),
              savedContinent.id,
              country.name,
              country.geometry ? Geometry.fromJSON(country.geometry) : null,
            )

            await this.countryRepo.save(countryEntity)
            totalCountries++
          } catch (countryErr) {
            logger.error(
              'scraper:bootstrap',
              `Error saving country ${country.name}: ${countryErr instanceof Error ? countryErr.message : countryErr}`,
            )
          }
        }
      } catch (continentErr) {
        logger.error(
          'scraper:bootstrap',
          `Error processing continent ${continent.name}: ${continentErr instanceof Error ? continentErr.message : continentErr}`,
        )
      }
    }

    logger.info(
      'scraper:bootstrap',
      `✅ Saved ${savedContinents} continents and ${totalCountries} countries`,
    )
  }
}
