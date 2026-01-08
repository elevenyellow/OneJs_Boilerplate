import { ConfigService, Inject, Injectable, logger } from '@OneJs/core'
import { QueueService } from '@OneJs/jobs'
import { CountryPrismaRepository } from '@climb-zone/country'
import {
  SCRAPE_QUEUE,
  type ScrapeCountryJobData,
} from '@scraper-thecrag/infrastructure/jobs/scrape-country.job'

/**
 * Service to enqueue country scraping jobs
 */
@Injectable()
export class ScraperQueueService {
  constructor(
    @Inject(QueueService)
    private readonly queue: QueueService,
    @Inject(CountryPrismaRepository)
    private readonly countryRepo: CountryPrismaRepository,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  /**
   * Enqueue scraping jobs for countries
   * In dev mode, only scrapes Spain
   */
  async enqueueCountries(): Promise<number> {
    const isDev = this.config.get('NODE_ENV') !== 'production'

    const countries = await this.countryRepo.findAll()

    if (countries.length === 0) {
      logger.warn('scraper:queue', 'No countries found in database')
      return 0
    }

    logger.info(
      'scraper:queue',
      `Found ${countries.length} countries in database (isDev: ${isDev})`,
    )

    // En dev, buscar España por nombre
    const spain = countries.find((c) => c.name === 'Spain')
    if (spain) {
      logger.info(
        'scraper:queue',
        `Spain found with externalId: ${spain.externalId.toNumber()}`,
      )
    }

    let enqueued = 0

    for (const country of countries) {
      // En dev solo España (buscar por nombre para evitar problemas con el ID)
      if (isDev && country.name !== 'Spain') {
        continue
      }

      const jobData: ScrapeCountryJobData = {
        countryId: country.id.toString(),
        countryExternalId: country.externalId.toNumber(),
        countryName: country.name,
      }

      // Use addUniqueByData to prevent duplicate jobs for the same country
      const job = await this.queue.addUniqueByData(
        SCRAPE_QUEUE,
        'scrape-country',
        jobData,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 min initial delay
          },
          removeOnComplete: true,
          removeOnFail: 100, // Keep last 100 failed jobs for debugging
        },
      )

      if (job) {
        logger.info(
          'scraper:queue',
          `📋 Enqueued scraping job for ${country.name} (jobId: ${job.id})`,
        )
        enqueued++
      } else {
        logger.debug(
          'scraper:queue',
          `⏭️ Skipped ${country.name} - job already exists in queue`,
        )
      }
    }

    logger.info(
      'scraper:queue',
      `✅ Enqueued ${enqueued} country scraping jobs`,
    )
    return enqueued
  }

  /**
   * Enqueue a specific country by external ID
   */
  async enqueueCountryByExternalId(externalId: number): Promise<boolean> {
    const { ExternalId } = await import('@climb-zone/shared')
    const country = await this.countryRepo.findByExternalId(
      ExternalId.create(externalId),
    )

    if (!country) {
      logger.warn(
        'scraper:queue',
        `Country with externalId ${externalId} not found`,
      )
      return false
    }

    const jobData: ScrapeCountryJobData = {
      countryId: country.id.toString(),
      countryExternalId: country.externalId.toNumber(),
      countryName: country.name,
    }

    const job = await this.queue.addUniqueByData(
      SCRAPE_QUEUE,
      'scrape-country',
      jobData,
    )

    return job !== null
  }

  /**
   * Get queue metrics
   */
  async getMetrics() {
    return this.queue.getQueueMetrics(SCRAPE_QUEUE)
  }

  /**
   * Clear all waiting and delayed jobs from the queue.
   * Useful to reset the queue when jobs have become stale.
   */
  async clearQueue(): Promise<void> {
    logger.info('scraper:queue', '🧹 Clearing scrape queue...')
    await this.queue.drainQueue(SCRAPE_QUEUE)
    // Also clean failed jobs
    await this.queue.cleanQueue(SCRAPE_QUEUE, 0, 'failed')
    logger.info('scraper:queue', '✅ Scrape queue cleared')
  }
}
