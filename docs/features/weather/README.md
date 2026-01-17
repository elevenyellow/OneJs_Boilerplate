# Weather & Climbing Conditions Feature

## Overview

This feature provides real-time weather data and climbing condition scoring for crags and sectors. It fetches weather from Meteoblue API and calculates aspect-aware, seasonality-aware climbing condition scores to help climbers decide when and where to climb.

## Architecture

```
packages/weather/
├── application/
│   ├── dtos/
│   │   └── climbing-conditions.dto.ts      # DTOs for API responses
│   ├── services/
│   │   ├── weather.service.ts              # Core weather fetching
│   │   ├── weather-cache.service.ts        # Cached weather service
│   │   └── geocoding.service.ts            # City to coordinates
│   └── use-cases/
│       └── get-climbing-conditions.use-case.ts
├── domain/
│   ├── entities/
│   │   └── weather-response.entity.ts      # WeatherData types
│   ├── services/
│   │   └── climbing-conditions-scoring.service.ts
│   └── value-objects/
│       ├── temperature-score.vo.ts         # Aspect/season aware
│       ├── wind-score.vo.ts
│       ├── precipitation-score.vo.ts
│       ├── humidity-score.vo.ts
│       ├── climbing-conditions-score.vo.ts # Combined score
│       └── coordinates.vo.ts
└── infrastructure/
    ├── cache/
    │   └── in-memory-weather-cache.ts      # TTL-based caching
    └── http/
        └── meteoblue.client.ts             # API client

apps/api/src/
├── weather/
│   ├── application/use-cases/
│   │   ├── get-coordinates-climbing-conditions.use-case.ts
│   │   ├── get-crag-climbing-conditions.use-case.ts
│   │   └── get-sector-climbing-conditions.use-case.ts
│   └── controllers/
│       └── weather.controller.ts           # Weather endpoints
└── search/
    └── domain/services/strategies/
        └── weather-scoring.strategy.ts     # Search integration
```

## Available Services/Classes

| Service/Class | Purpose | Location |
|---------------|---------|----------|
| `GetClimbingConditionsUseCase` | Get weather + conditions for coordinates | `@weather/application/use-cases` |
| `EvaluateCragSectorsConditionsUseCase` | Evaluate weather for all crag sectors | `@weather/application/use-cases` |
| `GetCragClimbingConditionsUseCase` | Get conditions for a crag by ID | `apps/api/src/weather/application/use-cases` |
| `GetSectorClimbingConditionsUseCase` | Get conditions for a sector by ID | `apps/api/src/weather/application/use-cases` |
| `GetCoordinatesClimbingConditionsUseCase` | Get conditions by lat/lon with validation | `apps/api/src/weather/application/use-cases` |
| `WeatherCacheService` | Cached weather fetching (15min/1h TTL) | `@weather/application/services` |
| `ClimbingConditionsScoringService` | Calculate condition scores (injectable) | `@weather/domain/services` |
| `WeatherScoringStrategy` | Search ranking integration | `apps/api/src/search/domain/services/strategies` |
| `InMemoryWeatherCache` | In-memory weather cache with TTL | `@weather/infrastructure/cache` |
| `InMemoryCragScoreCache` | In-memory crag score cache with TTL | `apps/api/src/search/infrastructure/cache` |
| `CragWeatherEvaluation` | Value object for crag weather evaluation | `apps/api/src/search/domain/value-objects` |
| `IWeatherCache` | Weather cache port (Redis-ready) | `@weather/domain/ports` |
| `ICragScoreCache` | Crag score cache port (Redis-ready) | `apps/api/src/search/domain/ports` |

## Public API

### `GetClimbingConditionsUseCase`

Main entry point for getting climbing conditions.

#### `execute(input: GetClimbingConditionsInput): Promise<ClimbingConditionsResult>`

**Parameters:**
- `latitude: number` - Location latitude
- `longitude: number` - Location longitude
- `aspect?: string | null` - Sector aspect (N, NE, E, SE, S, SW, W, NW)
- `seasonOverride?: 'winter' | 'spring' | 'summer' | 'autumn'`
- `cragId?: string` - Optional crag ID for response
- `sectorId?: string` - Optional sector ID for response

**Returns:** `ClimbingConditionsResult` value object with complete climbing conditions including scores, forecast, and recommendations.

**Example:**
```typescript
import { GetClimbingConditionsUseCase } from '@weather'

const result = await useCase.execute({
  latitude: 39.47,
  longitude: -0.38,
  aspect: 'N',
})

// Access via getters (value object pattern)
console.log(result.getConditions().getLabel()) // 'excellent' | 'good' | 'moderate' | 'poor'
console.log(result.getConditions().getOverallScore()) // 0-3
console.log(result.getCurrentWeather().temperature) // °C

// Convert to primitives for serialization (e.g., in controllers)
const dto = result.toPrimitives()
```

### `ClimbingConditionsScoringService`

Domain service for calculating condition scores.

#### `calculateFromWeatherData(weatherData, aspect?, season?): ScoringResult`

**Parameters:**
- `weatherData: WeatherData` - Raw weather data from API
- `aspect?: AspectDirection | null` - Sector orientation
- `season?: Season` - Current season (auto-detected if not provided)

**Returns:** `ScoringResult` value object containing:
- `getConditions(): ClimbingConditionsScore` - Overall score object
- `getHourlyConditions(): HourlyConditionScore[]` - Hourly breakdown
- `getBestClimbingWindow(): BestClimbingWindow | null` - Optimal window

### Value Objects

#### `TemperatureScore`

Aspect-aware temperature scoring.

```typescript
import { TemperatureScore } from '@weather'

const score = TemperatureScore.calculate(25, 'N', 'summer')
console.log(score.getScore()) // 0-3
console.log(score.isIdealRange()) // true if 10-20°C base
```

**Aspect adjustments:**
- North-facing in summer heat: +0.3 to +0.5 bonus (shade)
- South-facing in winter cold: +0.3 to +0.5 bonus (sun)
- Inverse conditions: penalty

#### `WindScore`

Wind condition scoring.

```typescript
import { WindScore } from '@weather'

const score = WindScore.calculate(15) // km/h
console.log(score.getScore()) // 0-3
console.log(score.isClimbable()) // true if < 30 km/h
```

**Thresholds:**
- 0-10 km/h: Excellent (3)
- 10-20 km/h: Good (2-3)
- 20-30 km/h: Moderate (1-2)
- 30+ km/h: Poor (0-1)

#### `PrecipitationScore`

Precipitation probability and amount scoring.

```typescript
import { PrecipitationScore } from '@weather'

const score = PrecipitationScore.calculate(30, 2) // 30% probability, 2mm
console.log(score.getScore()) // 0-3
console.log(score.isClimbable()) // true if < 50% and < 5mm
```

#### `HumidityScore`

Humidity scoring for rock friction.

```typescript
import { HumidityScore } from '@weather'

const score = HumidityScore.calculate(55) // percent
console.log(score.getScore()) // 0-3
console.log(score.isOptimalFriction()) // true if 30-60%
```

#### `ClimbingConditionsScore`

Combined weighted score.

```typescript
import { ClimbingConditionsScore } from '@weather'

const score = ClimbingConditionsScore.calculate({
  temperatureCelsius: 15,
  windSpeedKmh: 10,
  precipitationProbabilityPercent: 5,
  precipitationAmountMm: 0,
  humidityPercent: 50,
  aspect: 'N',
  season: 'summer',
})

console.log(score.getOverallScore()) // 0-3
console.log(score.getLabel()) // 'excellent' | 'good' | 'moderate' | 'poor'
console.log(score.isClimbable()) // boolean
console.log(score.getRecommendation()) // Human-readable text
console.log(score.getLimitingFactor()) // 'temperature' | 'wind' | 'precipitation' | 'humidity' | null
```

**Default weights:**
- Temperature: 30%
- Precipitation: 30%
- Wind: 25%
- Humidity: 15%

## Usage Examples

### Get conditions for a location

```typescript
import { GetClimbingConditionsUseCase } from '@weather'

// Inject or create the use case
const conditions = await getClimbingConditionsUseCase.execute({
  latitude: 39.4739,
  longitude: -0.37966,
  aspect: 'N',
  sectorId: 'sector-123',
})

// Current weather
console.log(`Temperature: ${conditions.current.temperature}°C`)
console.log(`Wind: ${conditions.current.windSpeed} km/h`)

// Climbing conditions
console.log(`Score: ${conditions.conditions.overallScore}/3`)
console.log(`Status: ${conditions.conditions.label}`)
console.log(`Climbable: ${conditions.conditions.isClimbable}`)
console.log(`Recommendation: ${conditions.conditions.recommendation}`)

// Aspect recommendation
if (conditions.aspectRecommendation) {
  console.log(`Aspect optimal: ${conditions.aspectRecommendation.isOptimalForCurrentConditions}`)
  console.log(`Reason: ${conditions.aspectRecommendation.reason}`)
}

// Best climbing window
if (conditions.bestClimbingWindow) {
  console.log(`Best window: ${conditions.bestClimbingWindow.startTime} - ${conditions.bestClimbingWindow.endTime}`)
  console.log(`Duration: ${conditions.bestClimbingWindow.hours} hours`)
}
```

### Search integration

Weather scoring is automatically integrated into crag search with **per-crag weather**:

```typescript
import { SearchCragsWithScoringUseCase } from 'apps/api/src/search/application/use-cases'

// Weather is automatically fetched for EACH crag's location
// Crags within ~1km share cached weather data
const results = await searchCragsUseCase.execute(criteria)

// Each result includes weather score based on its specific location
results.forEach(crag => {
  console.log(`Weather score: ${crag.scoreBreakdown.weather.score}/3`)
})
```

**Per-crag weather features:**
- Each crag gets weather conditions for its own coordinates
- Crags at different elevations/locations get accurate weather
- Coordinate rounding (2 decimal places, ~1km) enables cache sharing
- Parallel fetching for performance
- Fallback to neutral score if weather unavailable for a crag

## API Endpoints

### GET /weather/conditions

Get climbing conditions by coordinates.

**Query Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude
- `aspect` (optional): Sector aspect (N, NE, E, SE, S, SW, W, NW)

**Example:**
```bash
curl "http://localhost:3000/weather/conditions?lat=39.47&lon=-0.38&aspect=N"
```

### GET /weather/crags/:cragId

Get climbing conditions for a specific crag. Automatically fetches crag coordinates from database.

**Path Parameters:**
- `cragId` (required): Crag ID

**Query Parameters:**
- `aspect` (optional): Override aspect for scoring (N, NE, E, SE, S, SW, W, NW)

**Example:**
```bash
curl "http://localhost:3000/weather/crags/crag-123"
curl "http://localhost:3000/weather/crags/crag-123?aspect=N"
```

### GET /weather/sectors/:sectorId

Get climbing conditions for a specific sector. Automatically fetches sector coordinates and aspect from database.

**Path Parameters:**
- `sectorId` (required): Sector ID

**Example:**
```bash
curl "http://localhost:3000/weather/sectors/sector-456"
```

**Note:** The sector's aspect is automatically used for aspect-aware scoring if available in the sector tags.

### Response Format

All endpoints return the same response structure:

```json
{
  "coordinates": { "lat": 39.47, "lon": -0.38 },
  "current": {
    "temperature": 18,
    "feelsLike": 17,
    "windSpeed": 12,
    "windDirection": "NW",
    "humidity": 55,
    "weatherCode": 1,
    "isDaylight": true,
    "uvIndex": 5
  },
  "conditions": {
    "overallScore": 2.65,
    "temperatureScore": 2.8,
    "windScore": 2.7,
    "precipitationScore": 3.0,
    "humidityScore": 2.5,
    "label": "excellent",
    "recommendation": "Excellent conditions for climbing!",
    "isClimbable": true
  },
  "aspectRecommendation": {
    "aspect": "N",
    "isOptimalForCurrentConditions": true,
    "reason": "North-facing provides shade in hot weather - good choice!"
  },
  "hourlyForecast": [...],
  "bestClimbingWindow": {
    "startTime": "2024-01-16T09:00:00Z",
    "endTime": "2024-01-16T14:00:00Z",
    "averageScore": 2.7,
    "hours": 5
  },
  "metadata": {
    "location": "Valencia",
    "timezone": "CET",
    "lastUpdate": "2024-01-16T08:00:00Z",
    "cachedUntil": "2024-01-16T08:15:00Z"
  }
}
```

## Caching

### Two-Tier Cache Architecture

The weather system uses a two-tier caching strategy for optimal performance:

#### Tier 1: Weather Data Cache (`IWeatherCache`)

Weather data is cached in-memory with TTL:

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Current weather | 15 minutes | Changes frequently |
| Forecast | 1 hour | More stable |

Cache keys are rounded to 2 decimal places (~1km accuracy) to deduplicate nearby requests.

```typescript
import { InMemoryWeatherCache } from '@weather'

const cache = new InMemoryWeatherCache({
  currentWeatherTtlMs: 15 * 60 * 1000, // 15 minutes
  forecastTtlMs: 60 * 60 * 1000,       // 1 hour
  maxEntries: 1000,
  coordinatePrecision: 2,              // ~1km
})
```

#### Tier 2: Crag Score Cache (`ICragScoreCache`)

Crag scores are cached separately for faster search results:

| Data Type | TTL | Key Pattern |
|-----------|-----|-------------|
| Static scores (grade, quality, styles) | 24 hours | `crag:{cragId}:static` |
| Weather evaluation (per date) | 12 hours | `crag:{cragId}:weather:{YYYY-MM-DD}` |

```typescript
// Crag score cache automatically manages:
// - Static scores: gradeScore, qualityScore, stylesScore, routeCountScore
// - Weather evaluations: per-crag, per-date evaluations with sector breakdown

// Cache keys for weather evaluation include date to support future-date queries:
// crag:abc123:weather:2026-01-16 → evaluation for Jan 16
// crag:abc123:weather:2026-01-17 → evaluation for Jan 17 (separate cache entry)
```

### Cache Interfaces (Redis-Ready)

Both caches implement async interfaces for easy Redis swap in production:

```typescript
// Weather cache interface
interface IWeatherCache {
  get(lat: number, lon: number): Promise<WeatherData | null>
  set(lat: number, lon: number, data: WeatherData, useForecastTtl?: boolean): Promise<void>
  // ... delete, has, getTtl, clear, size, getStats
}

// Crag score cache interface
interface ICragScoreCache {
  getStaticScores(cragId: string): Promise<CachedStaticScores | null>
  setStaticScores(cragId: string, scores: Omit<CachedStaticScores, 'cachedAt'>): Promise<void>
  getWeatherEvaluation(cragId: string, date: string): Promise<CachedWeatherEvaluation | null>
  setWeatherEvaluation(cragId: string, date: string, evaluation: ...): Promise<void>
  // ... invalidate, clear, getStats
}
```

### Per-Crag Weather Evaluation

Each crag's weather is evaluated considering all its sectors:

```typescript
// EvaluateCragSectorsConditionsUseCase workflow:
// 1. Fetch weather for crag coordinates (cached)
// 2. Load all sectors for the crag
// 3. For each sector:
//    - If aspect available: use ClimbingConditionsScoringService with aspect
//    - Else: fallback to seasonality-based scoring (boost if in-season)
// 4. Aggregate sector scores into CragWeatherEvaluation

const result = await evaluateCragSectorsUseCase.execute(crag, '2026-01-16')
// Returns: {
//   overallScore: 2.5,       // Average of sector scores
//   label: 'good',           // excellent/good/fair/poor
//   totalSectors: 5,
//   sectorsWithGoodConditions: 3,
//   sectorEvaluations: [...]
// }
```

## DO NOT Duplicate

**IMPORTANT: The following functionality already exists. DO NOT recreate:**

- ❌ Weather API fetching - use `WeatherService` or `WeatherCacheService`
- ❌ Condition scoring - use `ClimbingConditionsScoringService`
- ❌ Temperature aspect adjustments - use `TemperatureScore.calculate()`
- ❌ Wind/precipitation/humidity scoring - use respective value objects
- ❌ Weather caching - use `InMemoryWeatherCache` or `WeatherCacheService`
- ❌ Search weather integration - use `WeatherScoringStrategy`
- ❌ Crag weather evaluation - use `EvaluateCragSectorsConditionsUseCase`
- ❌ Crag score caching - use `InMemoryCragScoreCache` (implements `ICragScoreCache`)
- ❌ Weather evaluation value object - use `CragWeatherEvaluation`

## Related Documentation

- `docs/features/search/README.md` - Search scoring system
- `packages/weather/README.md` - Package overview
- `.cursor/rules/code-style-and-commands.mdc` - DDD patterns

## Testing

Run weather tests:

```bash
# All weather package tests
bun test packages/weather/

# Specific tests
bun test packages/weather/domain/value-objects/__tests__/
bun test packages/weather/domain/services/__tests__/
bun test packages/weather/infrastructure/cache/__tests__/

# Search weather strategy tests
bun test apps/api/src/search/domain/services/strategies/__tests__/weather-scoring.strategy.test.ts
```

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `METEOBLUE_API_KEY` | Meteoblue API key | Required |
| `METEOBLUE_API_SECRET` | Meteoblue API secret | Required |
