import { Inject, Injectable, Logger } from '@OneJs/core'
import { QueueService } from '@OneJs/jobs'
import type { ClimbingZoneCoordinates } from '../../domain/dtos/weather-data.dto'

const WEATHER_QUEUE = 'weather-updates'
const WEATHER_JOB = 'fetch-zone-weather'

/**
 * Use case for scheduling batch weather updates for all zones
 */
@Injectable()
export class UpdateForecastsUseCase {
  constructor(
    @Inject(QueueService)
    private readonly queueService: QueueService,
    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Schedule weather updates for multiple zones
   * Uses staggered delays to avoid rate limiting
   */
  async execute(zones: ClimbingZoneCoordinates[]): Promise<void> {
    this.logger.info(
      'scraper:meteoblue',
      `Scheduling weather updates for ${zones.length} zones`,
    )

    const DELAY_BETWEEN_REQUESTS_MS = 2000 // 2 seconds between requests

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i]
      const delay = i * DELAY_BETWEEN_REQUESTS_MS

      await this.queueService.addUniqueByData(
        WEATHER_QUEUE,
        WEATHER_JOB,
        {
          zoneId: zone.id,
          zoneName: zone.name,
          latitude: zone.latitude,
          longitude: zone.longitude,
        },
        {
          delay,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
          },
        },
      )
    }

    this.logger.info(
      'scraper:meteoblue',
      `Scheduled ${zones.length} weather update jobs with ${DELAY_BETWEEN_REQUESTS_MS}ms stagger`,
    )
  }

  /**
   * Schedule a repeatable job to update all forecasts periodically
   */
  async schedulePeriodicUpdates(
    zones: ClimbingZoneCoordinates[],
    intervalHours: number = 3,
  ): Promise<void> {
    const repeatPattern = `0 */${intervalHours} * * *` // Every X hours

    await this.queueService.add(
      WEATHER_QUEUE,
      'update-all-forecasts',
      { zones },
      {
        repeat: {
          pattern: repeatPattern,
        },
        jobId: 'periodic-weather-update',
      },
    )

    this.logger.info(
      'scraper:meteoblue',
      `Scheduled periodic weather updates every ${intervalHours} hours`,
    )
  }
}
