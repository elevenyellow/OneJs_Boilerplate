import { Inject, Injectable } from '@OneJs/core'
import { GetZoneWeatherUseCase } from '../use-cases/get-zone-weather.use-case'
import type { ForecastDto, ForecastSummaryDto, GetForecastRequestDto } from '../../domain/dtos/forecast.dto'

@Injectable()
export class WeatherService {
  constructor(
    @Inject(GetZoneWeatherUseCase)
    private readonly getZoneWeatherUseCase: GetZoneWeatherUseCase,
  ) {}

  async getZoneForecast(request: GetForecastRequestDto): Promise<ForecastDto> {
    return this.getZoneWeatherUseCase.execute(request)
  }

  async getZoneForecastSummary(zoneId: string): Promise<ForecastSummaryDto> {
    return this.getZoneWeatherUseCase.getSummary(zoneId)
  }
}


