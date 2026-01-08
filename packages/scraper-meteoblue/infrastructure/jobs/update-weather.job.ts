import { Inject, Injectable, Logger } from '@OneJs/core'
import { WorkerJob } from '@OneJs/jobs'
import { FetchWeatherUseCase } from '../../application/use-cases/fetch-weather.use-case'
import type { FetchWeatherRequestDto, ClimbingZoneCoordinates } from '../../domain/dtos/weather-data.dto'

const WEATHER_QUEUE = 'weather-updates'

@Injectable()
export class UpdateWeatherWorker {
  constructor(
    @Inject(FetchWeatherUseCase)
    private readonly fetchWeatherUseCase: FetchWeatherUseCase,
    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Process individual zone weather fetch job
   */
  @WorkerJob(WEATHER_QUEUE, 2) // concurrency of 2
  async processFetchZoneWeather(data: FetchWeatherRequestDto): Promise<void> {
    this.logger.info('worker:weather', `Processing weather fetch for zone: ${data.zoneName}`)
    
    try {
      const result = await this.fetchWeatherUseCase.execute(data)
      
      this.logger.info(
        'worker:weather',
        `Completed weather fetch for ${data.zoneName}: ${result.daily.length} daily, ${result.hourly.length} hourly forecasts`
      )
    } catch (error) {
      this.logger.error('worker:weather', `Failed to fetch weather for ${data.zoneName}:`, error)
      throw error // Re-throw to trigger retry
    }
  }

  /**
   * Process batch update job (scheduled periodic updates)
   */
  @WorkerJob(`${WEATHER_QUEUE}-batch`, 1)
  async processUpdateAllForecasts(data: { zones: ClimbingZoneCoordinates[] }): Promise<void> {
    this.logger.info('worker:weather', `Processing batch update for ${data.zones.length} zones`)
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }
    
    for (const zone of data.zones) {
      try {
        await this.fetchWeatherUseCase.execute({
          zoneId: zone.id,
          zoneName: zone.name,
          latitude: zone.latitude,
          longitude: zone.longitude,
        })
        results.success++
        
        // Rate limiting delay
        await this.delay(2000)
      } catch (error) {
        results.failed++
        results.errors.push(`${zone.name}: ${(error as Error).message}`)
        this.logger.warn('worker:weather', `Failed to update ${zone.name}: ${(error as Error).message}`)
      }
    }
    
    this.logger.info(
      'worker:weather',
      `Batch update completed: ${results.success} success, ${results.failed} failed`
    )
    
    if (results.failed > 0) {
      this.logger.warn('worker:weather', `Failed zones: ${results.errors.join(', ')}`)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}


