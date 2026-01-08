// Domain
export { WeatherForecastEntity, type WeatherCondition, type WeatherForecastProps } from './domain/entities/weather-forecast.entity'
export { Coordinates } from './domain/value-objects/coordinates.vo'
export type {
  DailyWeatherDataDto,
  HourlyWeatherDataDto,
  ZoneWeatherDto,
  FetchWeatherRequestDto,
  ClimbingZoneCoordinates,
} from './domain/dtos/weather-data.dto'

// Application
export { FetchWeatherUseCase } from './application/use-cases/fetch-weather.use-case'
export { UpdateForecastsUseCase } from './application/use-cases/update-forecasts.use-case'
export { MeteoblueParserService } from './application/services/meteoblue-parser.service'

// Infrastructure
export { MeteoblueScraper } from './infrastructure/scrapers/meteoblue.scraper'
export { WeatherPrismaRepository } from './infrastructure/persistence/prisma/weather.repository'
export { WeatherCacheService } from './infrastructure/cache/weather-cache.service'
export { UpdateWeatherWorker } from './infrastructure/jobs/update-weather.job'


