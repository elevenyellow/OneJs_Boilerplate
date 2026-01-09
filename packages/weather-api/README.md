# @packages/weather-api

Injectable Weather API service for querying Meteoblue weather data by coordinates or city name.

## Features

- 🌍 Query by **coordinates** or **city name**
- 📊 Returns **raw JSON** or **parsed TypeScript entities**
- 💉 **Injectable** service with `@OneJs/core`
- 🔄 Automatic **retry logic** with exponential backoff
- 🗺️ Built-in **geocoding** service (Nominatim/OSM)
- ✅ Full **TypeScript** type safety
- 🌡️ Comprehensive weather data:
  - Current conditions
  - Hourly forecasts (168 hours / 7 days)
  - Daily forecasts (8 days)
  - Air quality data (PM2.5, PM10, CO, NO2, Ozone, etc.)
  - Wind, precipitation, humidity, UV index, etc.

## Installation

This package is part of the monorepo workspace. It's already available via workspace protocol:

```json
{
  "dependencies": {
    "@packages/weather-api": "workspace:*"
  }
}
```

## Configuration

### Environment Variables

Set your Meteoblue API key in `.env`:

```bash
METEOBLUE_API_KEY=your_meteoblue_api_key_here
```

Get your API key from: [Meteoblue Weather API](https://www.meteoblue.com/en/weather-api)

See [ENV_CONFIG.md](./ENV_CONFIG.md) for more details.

## Usage

### Basic Example

```typescript
import { WeatherService } from '@packages/weather-api'

@Injectable()
export class MyController {
  constructor(
    @Inject(WeatherService)
    private weatherService: WeatherService
  ) {}

  async getWeather() {
    // By coordinates - get parsed data
    const weather = await this.weatherService
      .getByCoordinates({ latitude: 39.47, longitude: -0.38 })
      .parsed()
    
    console.log(`Current temp: ${weather.current.temperature}°C`)
    console.log(`Wind speed: ${weather.current.windSpeed} km/h`)
    
    // First hourly forecast
    const hour1 = weather.hourly[0]
    console.log(`${hour1.timestamp}: ${hour1.temperature}°C`)
    
    // Daily forecast for tomorrow
    const tomorrow = weather.daily[1]
    console.log(`Tomorrow: ${tomorrow.temperature.min}°C - ${tomorrow.temperature.max}°C`)
  }
}
```

### Query by Coordinates

```typescript
// Get raw JSON response
const raw = await weatherService
  .getByCoordinates({ latitude: 39.4739, longitude: -0.37966 })
  .raw()

console.log(raw.data_1h.temperature) // Array of hourly temps
console.log(raw.data_day.temperature_max) // Array of daily max temps

// Get parsed TypeScript entities
const parsed = await weatherService
  .getByCoordinates({ latitude: 39.4739, longitude: -0.37966 })
  .parsed()

console.log(parsed.current.temperature) // Current temp as number
console.log(parsed.hourly[0].temperature) // First hour temp
console.log(parsed.daily[0].temperature.max) // Today's max
```

### Query by City Name

```typescript
// The service will geocode "Valencia" to coordinates automatically
const weather = await weatherService
  .getByCity('Valencia')
  .parsed()

console.log(weather.metadata.location) // "Valencia"
console.log(weather.metadata.coordinates) // { lat: 39.47, lon: -0.38 }
console.log(weather.current.temperature)
```

### Working with Different Data Types

#### Current Weather

```typescript
const weather = await weatherService
  .getByCity('Madrid')
  .parsed()

const current = weather.current
console.log(`Temperature: ${current.temperature}°C`)
console.log(`Wind Speed: ${current.windSpeed} km/h`)
console.log(`Weather Code: ${current.weatherCode}`)
console.log(`Is Daylight: ${current.isDaylight}`)
```

#### Hourly Forecast

```typescript
const weather = await weatherService
  .getByCoordinates({ latitude: 41.39, longitude: 2.17 })
  .parsed()

// Next 24 hours
weather.hourly.slice(0, 24).forEach(hour => {
  console.log(`${hour.timestamp.toLocaleString()}:`)
  console.log(`  Temp: ${hour.temperature}°C (feels like ${hour.feelsLike}°C)`)
  console.log(`  Wind: ${hour.windSpeed} km/h ${hour.windDirection}`)
  console.log(`  Precip: ${hour.precipitation} mm`)
  console.log(`  Humidity: ${hour.humidity}%`)
  
  // Air quality (may be null)
  if (hour.airQuality?.pm25) {
    console.log(`  PM2.5: ${hour.airQuality.pm25} μg/m³`)
  }
})
```

#### Daily Forecast

```typescript
const weather = await weatherService
  .getByCity('Barcelona')
  .parsed()

// Next 7 days
weather.daily.forEach(day => {
  console.log(`${day.date.toLocaleDateString()}:`)
  console.log(`  Temp: ${day.temperature.min}°C - ${day.temperature.max}°C (avg: ${day.temperature.mean}°C)`)
  console.log(`  Wind: max ${day.wind.max} km/h ${day.wind.direction}`)
  console.log(`  Precip: ${day.precipitation.amount} mm (${day.precipitation.probability}% chance)`)
  console.log(`  Sunrise: ${day.sunrise} | Sunset: ${day.sunset}`)
  console.log(`  UV Index: ${day.uvIndex}`)
  console.log(`  Predictability: ${day.predictability}%`)
})
```

#### Air Quality

```typescript
const weather = await weatherService
  .getByCity('Valencia')
  .parsed()

// Air quality data is in hourly forecasts
weather.hourly.slice(0, 24).forEach(hour => {
  const aq = hour.airQuality
  if (aq) {
    console.log(`${hour.timestamp.toLocaleString()}:`)
    console.log(`  PM2.5: ${aq.pm25} μg/m³`)
    console.log(`  PM10: ${aq.pm10} μg/m³`)
    console.log(`  CO: ${aq.co} μg/m³`)
    console.log(`  NO2: ${aq.no2} μg/m³`)
    console.log(`  Ozone: ${aq.ozone} μg/m³`)
    console.log(`  AQI: ${aq.aqi}`)
  }
})
```

### Error Handling

```typescript
import { OneJsError } from '@OneJs/core'

try {
  const weather = await weatherService
    .getByCity('NonExistentCity')
    .parsed()
} catch (error) {
  if (error instanceof OneJsError) {
    switch (error.code) {
      case 'CITY_NOT_FOUND':
        console.error('City not found in geocoding database')
        break
      case 'UNAUTHORIZED':
        console.error('Invalid Meteoblue API key')
        break
      case 'RATE_LIMITED':
        console.error('API rate limit exceeded')
        break
      case 'METEOBLUE_FETCH_FAILED':
        console.error('Failed to fetch weather data after retries')
        break
      default:
        console.error(`Weather API error: ${error.message}`)
    }
  }
}
```

### Health Check

```typescript
const health = await weatherService.healthCheck()

console.log(`Meteoblue API: ${health.meteoblue ? '✓' : '✗'}`)
console.log(`Geocoding: ${health.geocoding ? '✓' : '✗'}`)
console.log(`Overall: ${health.overall ? '✓' : '✗'}`)
```

## TypeScript Types

### Main Types

```typescript
import type {
  WeatherData,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  MeteoblueAPIResponse,
} from '@packages/weather-api'

// Parsed entities
const weather: WeatherData = await service.getByCity('Madrid').parsed()
const current: CurrentWeather = weather.current
const hourly: HourlyForecast[] = weather.hourly
const daily: DailyForecast[] = weather.daily

// Raw API response
const raw: MeteoblueAPIResponse = await service.getByCity('Madrid').raw()
```

### Coordinates

```typescript
import { Coordinates } from '@packages/weather-api'

const coords = Coordinates.create(39.47, -0.38)
console.log(coords.latitude)  // 39.47
console.log(coords.longitude) // -0.38
console.log(coords.toString()) // "(39.47, -0.38)"
console.log(coords.toMeteoblueFormat()) // "39.47N0.38W"
```

## API Reference

### `WeatherService`

Main injectable service.

#### Methods

- **`getByCoordinates(coords)`** - Query by coordinates
  - Parameters: `{ latitude: number, longitude: number }`
  - Returns: `WeatherQuery`

- **`getByCity(cityName)`** - Query by city name
  - Parameters: `string` (city name)
  - Returns: `Promise<WeatherQuery>`

- **`healthCheck()`** - Check API availability
  - Returns: `Promise<{ meteoblue: boolean, geocoding: boolean, overall: boolean }>`

### `WeatherQuery`

Result object with data retrieval methods.

#### Methods

- **`.raw()`** - Get raw JSON response
  - Returns: `Promise<MeteoblueAPIResponse>`

- **`.parsed()`** - Get parsed TypeScript entities
  - Returns: `Promise<WeatherData>`

## Architecture

```
packages/weather-api/
├── application/
│   └── services/
│       ├── weather.service.ts       # Main service (Injectable)
│       └── geocoding.service.ts     # City → Coordinates
├── domain/
│   ├── entities/
│   │   └── weather-response.entity.ts  # Parsed entities + parser
│   └── value-objects/
│       └── coordinates.vo.ts           # Coordinates VO
└── infrastructure/
    └── http/
        ├── meteoblue.client.ts         # HTTP client (Injectable)
        └── meteoblue-api.types.ts      # API types
```

## Weather Codes (pictocode)

Meteoblue uses numeric weather codes:

- `1` - Clear sky
- `2` - Partly cloudy
- `3` - Cloudy
- `4` - Overcast
- `5` - Light rain
- `6` - Moderate rain
- `7` - Heavy rain
- `9` - Thunderstorm
- `21` - Snow

See [Meteoblue documentation](https://content.meteoblue.com/en/help/standards/symbols-and-pictograms) for complete list.

## Rate Limits

Meteoblue API has rate limits depending on your plan:
- **Free tier**: ~500 requests/day
- **Paid tiers**: Higher limits

The client implements automatic retry with exponential backoff for transient errors.

## Notes

- **Geocoding**: Uses free Nominatim API (OpenStreetMap). Results are cached in memory.
- **Cache**: No persistent cache implemented. Consider adding Redis/memory cache for production.
- **Timezones**: Timestamps are in UTC. Convert to local timezone as needed.
- **Air Quality**: May not be available for all locations/times (will be `null`).

## Examples in Real Projects

### In a Zone Weather Controller

```typescript
@Injectable()
export class ZoneWeatherController {
  constructor(
    @Inject(WeatherService) private weather: WeatherService,
    @Inject(ZoneRepository) private zones: ZoneRepository
  ) {}

  async getZoneWeather(zoneId: string) {
    const zone = await this.zones.findById(zoneId)
    
    const weather = await this.weather
      .getByCoordinates({
        latitude: zone.latitude,
        longitude: zone.longitude
      })
      .parsed()
    
    return {
      zone: {
        id: zone.id,
        name: zone.name,
      },
      current: {
        temperature: weather.current.temperature,
        windSpeed: weather.current.windSpeed,
        conditions: this.getWeatherDescription(weather.current.weatherCode)
      },
      forecast: weather.daily.slice(0, 7).map(day => ({
        date: day.date.toISOString().split('T')[0],
        tempMin: day.temperature.min,
        tempMax: day.temperature.max,
        precipitation: day.precipitation.probability,
      }))
    }
  }

  private getWeatherDescription(code: number): string {
    const descriptions: Record<number, string> = {
      1: 'Clear',
      2: 'Partly Cloudy',
      3: 'Cloudy',
      5: 'Light Rain',
      6: 'Rain',
      9: 'Thunderstorm',
      // ... more codes
    }
    return descriptions[code] || 'Unknown'
  }
}
```

## License

Part of the ClimbZone project.
