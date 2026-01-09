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

@Controller('/weather')
export class WeatherByCoordinatesController {
  constructor(
    @Inject(WeatherService)
    private readonly weatherService: WeatherService,
  ) {}

  @Get('/coordinates')
  async getWeatherByCoordinates(context: Context) {
    const query = context.query as Record<string, string | undefined>

    const lat = parseFloat(query.lat || '0')
    const lon = parseFloat(query.lon || '0')

    if (!lat || !lon) {
      context.set.status = 400
      return { error: 'Missing lat or lon query parameters' }
    }

    const weather = await this.weatherService
      .getByCoordinates({ latitude: lat, longitude: lon })
      .parsed()

    context.set.status = 200
    return weather
  }
}
