import { Inject, Injectable, OneJsError } from '@OneJs/core'
import { WeatherPrismaRepository } from '@weather/infrastructure/persistence/prisma/weather.repository'
import type { ForecastDto, ForecastSummaryDto, GetForecastRequestDto, DailyForecastDto } from '../../domain/dtos/forecast.dto'
import type { DailyForecast } from '../../domain/entities/forecast.entity'

@Injectable()
export class GetZoneWeatherUseCase {
  constructor(
    @Inject(WeatherPrismaRepository)
    private readonly weatherRepository: WeatherPrismaRepository,
  ) {}

  async execute(request: GetForecastRequestDto): Promise<ForecastDto> {
    const forecast = await this.weatherRepository.findByZoneId(request.zoneId)

    if (!forecast) {
      throw new OneJsError('Weather forecast not found for this zone', 404, 'FORECAST_NOT_FOUND')
    }

    const days = request.days ?? 7
    const dailyForecasts = forecast.getNextDays(days)

    return {
      id: forecast.id,
      zoneId: forecast.zoneId,
      zoneName: forecast.zoneName,
      daily: dailyForecasts.map((d) => this.toDailyDto(d, request.includeHourly ?? false)),
      fetchedAt: forecast.fetchedAt,
      source: forecast.source,
    }
  }

  async getSummary(zoneId: string): Promise<ForecastSummaryDto> {
    const forecast = await this.weatherRepository.findByZoneId(zoneId)

    if (!forecast) {
      throw new OneJsError('Weather forecast not found for this zone', 404, 'FORECAST_NOT_FOUND')
    }

    const today = forecast.getToday()
    const nextDays = forecast.getNextDays(5)

    // Find the best climbing day (best climbingCondition)
    const conditionRank: Record<string, number> = {
      excellent: 5,
      good: 4,
      fair: 3,
      poor: 2,
      unsuitable: 1,
    }

    const bestDay = nextDays.reduce<DailyForecast | null>((best, current) => {
      if (!best) return current
      return conditionRank[current.climbingCondition] > conditionRank[best.climbingCondition]
        ? current
        : best
    }, null)

    return {
      zoneId: forecast.zoneId,
      zoneName: forecast.zoneName,
      today: today ? this.toDailyDto(today, false) : null,
      nextDays: nextDays.map((d) => this.toDailyDto(d, false)),
      bestClimbingDay: bestDay ? this.toDailyDto(bestDay, false) : null,
      isStale: forecast.isStale(),
    }
  }

  private toDailyDto(daily: DailyForecast, includeHourly: boolean): DailyForecastDto {
    return {
      date: daily.date.toISOString(),
      sunrise: daily.sunrise,
      sunset: daily.sunset,
      tempMin: daily.tempMin,
      tempMax: daily.tempMax,
      humidity: daily.humidity,
      precipitation: daily.precipitation,
      precipitationProbability: daily.precipitationProbability,
      condition: daily.condition,
      windSpeed: daily.windSpeed,
      windGust: daily.windGust,
      uvIndex: daily.uvIndex,
      climbingCondition: daily.climbingCondition,
      hourly: includeHourly ? daily.hourly : undefined,
    }
  }
}


