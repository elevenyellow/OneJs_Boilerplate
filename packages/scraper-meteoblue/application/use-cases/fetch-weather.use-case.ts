import { Inject, Injectable, Logger } from '@OneJs/core'
import { v4 as uuidv4 } from 'uuid'
import type {
  FetchWeatherRequestDto,
  ZoneWeatherDto,
} from '../../domain/dtos/weather-data.dto'
import { WeatherForecastEntity } from '../../domain/entities/weather-forecast.entity'
import { Coordinates } from '../../domain/value-objects/coordinates.vo'
import { WeatherCacheService } from '../../infrastructure/cache/weather-cache.service'
import { WeatherPrismaRepository } from '../../infrastructure/persistence/prisma/weather.repository'
import { MeteoblueScraper } from '../../infrastructure/scrapers/meteoblue.scraper'
import { MeteoblueParserService } from '../services/meteoblue-parser.service'

@Injectable()
export class FetchWeatherUseCase {
  constructor(
    @Inject(MeteoblueScraper)
    private readonly scraper: MeteoblueScraper,
    @Inject(MeteoblueParserService)
    private readonly parser: MeteoblueParserService,
    @Inject(WeatherPrismaRepository)
    private readonly repository: WeatherPrismaRepository,
    @Inject(WeatherCacheService)
    private readonly cache: WeatherCacheService,
    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  async execute(request: FetchWeatherRequestDto): Promise<ZoneWeatherDto> {
    const coordinates = Coordinates.create(request.latitude, request.longitude)
    const cacheKey = `weather:${request.zoneId}:${coordinates.toCacheKey()}`

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      this.logger.debug(
        'scraper:meteoblue',
        `Cache hit for zone ${request.zoneId}`,
      )
      return cached
    }

    this.logger.info(
      'scraper:meteoblue',
      `Fetching weather for zone: ${request.zoneName} at ${coordinates.toString()}`,
    )

    // Fetch HTML from meteoblue
    const html = await this.scraper.fetchWeatherPage(
      request.zoneName,
      coordinates,
    )

    // Parse the HTML
    const dailyData = this.parser.parseDailyForecast(html)
    const hourlyData = this.parser.parseHourlyForecast(html)

    const fetchedAt = new Date()

    // Create entities for persistence
    const dailyEntities = dailyData.map((data) =>
      WeatherForecastEntity.create({
        id: uuidv4(),
        zoneId: request.zoneId,
        date: data.date,
        hour: undefined,
        tempMin: data.tempMin,
        tempMax: data.tempMax,
        tempCurrent: undefined,
        rainProb: data.rainProb,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        humidity: data.humidity,
        condition: data.condition,
        conditionIcon: data.conditionIcon,
        uvIndex: data.uvIndex,
        fetchedAt,
      }),
    )

    const hourlyEntities = hourlyData.map((data) =>
      WeatherForecastEntity.create({
        id: uuidv4(),
        zoneId: request.zoneId,
        date: data.date,
        hour: data.hour,
        tempMin: data.tempMin,
        tempMax: data.tempMax,
        tempCurrent: data.tempCurrent,
        rainProb: data.rainProb,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        humidity: data.humidity,
        condition: data.condition,
        conditionIcon: data.conditionIcon,
        uvIndex: undefined,
        fetchedAt,
      }),
    )

    // Persist to database
    await this.repository.upsertForecasts([...dailyEntities, ...hourlyEntities])

    // Build response
    const result: ZoneWeatherDto = {
      zoneId: request.zoneId,
      zoneName: request.zoneName,
      locationName: request.zoneName.toLowerCase().replace(/\s+/g, '-'),
      daily: dailyData,
      hourly: hourlyData,
      fetchedAt,
    }

    // Cache the result
    await this.cache.set(cacheKey, result)

    this.logger.info(
      'scraper:meteoblue',
      `Weather fetched for ${request.zoneName}: ${dailyData.length} daily, ${hourlyData.length} hourly forecasts`,
    )

    return result
  }
}
