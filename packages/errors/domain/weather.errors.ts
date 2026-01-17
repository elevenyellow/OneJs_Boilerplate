import { DomainError } from './base/domain-error.base'
import { HttpStatus } from './http-codes'

export class CityNotFoundError extends DomainError {
  constructor(city: string) {
    super('CITY_NOT_FOUND', HttpStatus.NOT_FOUND, `City "${city}" not found`)
  }
}

export class WeatherApiError extends DomainError {
  constructor(message: string, statusCode = HttpStatus.SERVICE_UNAVAILABLE) {
    super('WEATHER_API_ERROR', statusCode, message)
  }
}

export class InvalidApiKeyError extends DomainError {
  constructor() {
    super('INVALID_API_KEY', HttpStatus.UNAUTHORIZED, 'Invalid API key')
  }
}

export class WeatherDataNotAvailableError extends DomainError {
  constructor(location: string) {
    super('WEATHER_DATA_NOT_AVAILABLE', HttpStatus.NOT_FOUND, `Weather data not available for ${location}`)
  }
}
