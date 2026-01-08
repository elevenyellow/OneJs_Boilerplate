import { Injectable } from '@OneJs/core'
import * as cheerio from 'cheerio'
import type {
  DailyWeatherDataDto,
  HourlyWeatherDataDto,
} from '../../domain/dtos/weather-data.dto'
import type { WeatherCondition } from '../../domain/entities/weather-forecast.entity'

@Injectable()
export class MeteoblueParserService {
  /**
   * Parse daily weather data from meteoblue HTML
   */
  parseDailyForecast(html: string): DailyWeatherDataDto[] {
    const $ = cheerio.load(html)
    const forecasts: DailyWeatherDataDto[] = []

    // Meteoblue uses a table/grid structure for daily forecasts
    $('.forecast-table .day, .tab-content .day, [data-day]').each(
      (index, element) => {
        try {
          const $day = $(element)

          // Extract date from data attribute or parse from element
          const dateStr = $day.attr('data-day') || $day.find('.date').text()
          const date = this.parseDate(dateStr, index)

          // Temperature
          const tempMin = this.parseTemperature(
            $day.find('.temp-min, .tmin').text(),
          )
          const tempMax = this.parseTemperature(
            $day.find('.temp-max, .tmax').text(),
          )

          // Rain probability
          const rainProb = this.parsePercentage(
            $day.find('.rain-prob, .precip').text(),
          )

          // Wind
          const windSpeed = this.parseWindSpeed(
            $day.find('.wind-speed, .wind').text(),
          )
          const windDirection =
            $day.find('.wind-direction, .wind-dir').text().trim() || undefined

          // Humidity
          const humidity = this.parsePercentage(
            $day.find('.humidity, .relhum').text(),
          )

          // Condition
          const conditionIcon =
            $day.find('.weather-icon, .picto img').attr('src') ||
            $day.find('.weather-icon, .picto img').attr('data-src')
          const conditionText = $day.find('.weather-desc, .condition').text()
          const condition = this.parseCondition(conditionText, conditionIcon)

          // UV Index
          const uvIndex = this.parseUvIndex($day.find('.uv-index, .uv').text())

          if (date && !isNaN(tempMin) && !isNaN(tempMax)) {
            forecasts.push({
              date,
              tempMin,
              tempMax,
              rainProb,
              windSpeed,
              windDirection,
              humidity,
              condition,
              conditionIcon,
              uvIndex,
            })
          }
        } catch (error) {
          // Skip malformed entries
          console.warn('Failed to parse daily forecast entry:', error)
        }
      },
    )

    // If no entries found with primary selectors, try alternative parsing
    if (forecasts.length === 0) {
      return this.parseAlternativeDailyFormat($)
    }

    return forecasts
  }

  /**
   * Alternative parsing for different meteoblue page layouts
   */
  private parseAlternativeDailyFormat(
    $: cheerio.CheerioAPI,
  ): DailyWeatherDataDto[] {
    const forecasts: DailyWeatherDataDto[] = []

    // Try parsing from JSON-LD or inline script data
    const scriptContent = $('script[type="application/ld+json"]').html()
    if (scriptContent) {
      try {
        const jsonData = JSON.parse(scriptContent)
        // Parse structured data if available
        if (jsonData['@type'] === 'WeatherForecast' || jsonData.forecast) {
          // Handle structured weather data
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    // Fallback: parse table rows
    $('table.forecast tr, .weather-table tr').each((index, row) => {
      if (index === 0) return // Skip header

      const $row = $(row)
      const cells = $row.find('td')

      if (cells.length >= 5) {
        const date = this.parseDate($(cells[0]).text(), index - 1)
        const tempMax = this.parseTemperature($(cells[1]).text())
        const tempMin = this.parseTemperature($(cells[2]).text())
        const rainProb = this.parsePercentage($(cells[3]).text())
        const windSpeed = this.parseWindSpeed($(cells[4]).text())

        if (date && !isNaN(tempMin) && !isNaN(tempMax)) {
          forecasts.push({
            date,
            tempMin,
            tempMax,
            rainProb,
            windSpeed,
            humidity: 0,
            condition: 'unknown',
          })
        }
      }
    })

    return forecasts
  }

  /**
   * Parse hourly weather data from meteoblue HTML
   */
  parseHourlyForecast(html: string): HourlyWeatherDataDto[] {
    const $ = cheerio.load(html)
    const forecasts: HourlyWeatherDataDto[] = []

    $('.hourly-forecast .hour, .tab-hourly .hour, [data-hour]').each(
      (index, element) => {
        try {
          const $hour = $(element)

          const hourStr = $hour.attr('data-hour') || $hour.find('.time').text()
          const hour = this.parseHour(hourStr)
          const dateStr =
            $hour.attr('data-date') ||
            $hour.closest('[data-day]').attr('data-day')
          const date = this.parseDate(dateStr || '', 0)

          const tempCurrent = this.parseTemperature(
            $hour.find('.temp, .temperature').text(),
          )
          const rainProb = this.parsePercentage(
            $hour.find('.rain-prob, .precip').text(),
          )
          const windSpeed = this.parseWindSpeed(
            $hour.find('.wind-speed, .wind').text(),
          )
          const windDirection =
            $hour.find('.wind-direction').text().trim() || undefined
          const humidity = this.parsePercentage($hour.find('.humidity').text())

          const conditionIcon = $hour
            .find('.weather-icon img, .picto img')
            .attr('src')
          const conditionText = $hour.find('.weather-desc').text()
          const condition = this.parseCondition(conditionText, conditionIcon)

          if (date && !isNaN(hour) && !isNaN(tempCurrent)) {
            forecasts.push({
              date,
              hour,
              tempCurrent,
              tempMin: tempCurrent - 2, // Estimated
              tempMax: tempCurrent + 2, // Estimated
              rainProb,
              windSpeed,
              windDirection,
              humidity,
              condition,
              conditionIcon,
            })
          }
        } catch (error) {
          console.warn('Failed to parse hourly forecast entry:', error)
        }
      },
    )

    return forecasts
  }

  private parseDate(dateStr: string, dayOffset: number): Date {
    if (!dateStr || dateStr.trim() === '') {
      // Use offset from today
      const date = new Date()
      date.setDate(date.getDate() + dayOffset)
      date.setHours(0, 0, 0, 0)
      return date
    }

    // Try parsing various date formats
    const cleaned = dateStr.trim()

    // Format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return new Date(cleaned)
    }

    // Format: DD.MM or DD/MM
    const match = cleaned.match(/(\d{1,2})[./](\d{1,2})/)
    if (match) {
      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      const year = new Date().getFullYear()
      return new Date(year, month, day)
    }

    // Fallback: use day offset
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    date.setHours(0, 0, 0, 0)
    return date
  }

  private parseHour(hourStr: string): number {
    const match = hourStr.match(/(\d{1,2})/)
    return match ? parseInt(match[1], 10) : 0
  }

  private parseTemperature(tempStr: string): number {
    const match = tempStr.match(/-?\d+/)
    return match ? parseInt(match[0], 10) : NaN
  }

  private parsePercentage(percentStr: string): number {
    const match = percentStr.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  private parseWindSpeed(windStr: string): number {
    const match = windStr.match(/(\d+)/)
    return match ? parseFloat(match[1]) : 0
  }

  private parseUvIndex(uvStr: string): number | undefined {
    const match = uvStr.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : undefined
  }

  private parseCondition(text: string, iconUrl?: string): WeatherCondition {
    const lowerText = (text || '').toLowerCase()
    const lowerIcon = (iconUrl || '').toLowerCase()

    // Check for thunderstorm
    if (
      lowerText.includes('thunder') ||
      lowerText.includes('storm') ||
      lowerIcon.includes('thunder')
    ) {
      return 'thunderstorm'
    }

    // Check for snow
    if (lowerText.includes('snow') || lowerIcon.includes('snow')) {
      return 'snow'
    }

    // Check for sleet
    if (lowerText.includes('sleet') || lowerText.includes('mix')) {
      return 'sleet'
    }

    // Check for heavy rain
    if (lowerText.includes('heavy rain') || lowerText.includes('downpour')) {
      return 'heavy_rain'
    }

    // Check for rain
    if (
      lowerText.includes('rain') ||
      lowerText.includes('shower') ||
      lowerIcon.includes('rain')
    ) {
      return 'rain'
    }

    // Check for drizzle
    if (lowerText.includes('drizzle') || lowerText.includes('light rain')) {
      return 'drizzle'
    }

    // Check for fog
    if (lowerText.includes('fog') || lowerText.includes('mist')) {
      return 'fog'
    }

    // Check for overcast
    if (lowerText.includes('overcast')) {
      return 'overcast'
    }

    // Check for cloudy
    if (lowerText.includes('cloud') || lowerIcon.includes('cloud')) {
      if (lowerText.includes('partly') || lowerText.includes('partial')) {
        return 'partly_cloudy'
      }
      return 'cloudy'
    }

    // Check for sunny/clear
    if (
      lowerText.includes('sun') ||
      lowerText.includes('clear') ||
      lowerIcon.includes('sun')
    ) {
      return 'sunny'
    }

    return 'unknown'
  }
}
