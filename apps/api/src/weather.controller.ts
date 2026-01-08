import { Inject } from '@OneJs/core'
import type { Context } from '@OneJs/server'
import { Controller, Get } from '@OneJs/server'
import { WeatherService } from '@weather/application/services/weather.service'
import type { GetForecastRequestDto } from '@weather/domain/dtos/forecast.dto'

@Controller('/zones')
export class WeatherController {
  constructor(
    @Inject(WeatherService)
    private readonly weatherService: WeatherService,
  ) {}

  @Get('/:id/weather')
  async getZoneWeather(context: Context) {
    const { id } = context.params as { id: string }
    const query = context.query as Record<string, string | undefined>

    const request: GetForecastRequestDto = {
      zoneId: id,
      days: query.days ? parseInt(query.days, 10) : 7,
      includeHourly: query.hourly === 'true',
    }

    const forecast = await this.weatherService.getZoneForecast(request)
    context.set.status = 200
    return forecast
  }

  @Get('/:id/weather/summary')
  async getZoneWeatherSummary(context: Context) {
    const { id } = context.params as { id: string }

    const summary = await this.weatherService.getZoneForecastSummary(id)
    context.set.status = 200
    return summary
  }
}
