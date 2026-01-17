# Search Module

This module provides crag search functionality with multi-criteria scoring and ranking.

## Features

- **Geographic Search**: Find crags within a radius from coordinates (bounding box)
- **Grade Filtering**: Filter by grade range with multi-system support (French, YDS, Font, etc.)
- **Seasonality Matching**: Prefer crags with good climbing conditions in desired season
- **Weighted Scoring**: Rank results using configurable scoring strategies
- **Extensible Architecture**: Easy to add new scoring criteria

## Endpoint

```
GET /api/search/crags
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `latitude` | number | Yes | Search origin latitude | `41.7` |
| `longitude` | number | Yes | Search origin longitude | `1.8` |
| `radiusKm` | number | Yes | Search radius in kilometers (max 200) | `50` |
| `minGrade` | string | Yes | Minimum grade in specified system | `6a` |
| `maxGrade` | string | Yes | Maximum grade in specified system | `7b` |
| `gradeSystem` | string | No | Grade system (default: french) | `french`, `yds`, `font` |
| `seasonPreference` | string | No | Season preference (default: any) | `summer`, `winter`, `any` |
| `limit` | number | No | Max results (1-100, default: 20) | `20` |

### Example Request

```bash
curl "http://localhost:4000/api/search/crags?latitude=41.7&longitude=1.8&radiusKm=50&minGrade=6a&maxGrade=7b&gradeSystem=french&seasonPreference=summer&limit=10"
```

### Example Response

```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "externalId": "12345",
      "name": "Montserrat",
      "type": "crag",
      "subType": "sport",
      "latitude": 41.7,
      "longitude": 1.8,
      "numberRoutes": 250,
      "seasonality": [6, 7, 8, 9],
      "hasTopo": true,
      "totalScore": 87.5,
      "distanceKm": 2.3,
      "scoreBreakdown": {
        "distance": { "score": 95.4, "weight": 0.4, "weighted": 38.16 },
        "gradeMatch": { "score": 85.0, "weight": 0.3, "weighted": 25.5 },
        "seasonality": { "score": 100.0, "weight": 0.2, "weighted": 20.0 },
        "routeCount": { "score": 100.0, "weight": 0.1, "weighted": 10.0 }
      }
    }
  ],
  "total": 1,
  "criteria": {
    "latitude": 41.7,
    "longitude": 1.8,
    "radiusKm": 50,
    "minGrade": "6a",
    "maxGrade": "7b",
    "gradeSystem": "french",
    "seasonPreference": "summer",
    "limit": 10
  }
}
```

## Scoring System

Results are ranked using a weighted scoring system with default weights:

| Strategy | Weight | Description |
|----------|--------|-------------|
| **Distance** | 40% | Closer crags score higher (uses `Coordinates.distanceTo()` with Haversine formula) |
| **Grade Match** | 30% | Crags with more routes in desired range score higher |
| **Seasonality** | 20% | Crags with good conditions in preferred season score higher |
| **Route Count** | 10% | Crags with more routes get a small bonus |

Each strategy scores from 0-100, and the final score is the weighted sum.

## Architecture

### Domain Layer

- **Value Objects**:
  - `SearchCriteria` - Encapsulates all search parameters
  - `GradeRange` - Grade range with conversion support
  - `ScoredCragResult` - Scored result with breakdown

- **Types**:
  - `SeasonPreference` - Enum for season preferences
  - `IScoringStrategy` - Interface for scoring strategies

- **Services**:
  - `CragScoringService` - Coordinates multiple strategies
  - **Strategies**:
    - `DistanceScoringStrategy`
    - `GradeMatchScoringStrategy`
    - `SeasonalityScoringStrategy`
    - `RouteCountScoringStrategy`

### Application Layer

- **Use Cases**:
  - `SearchCragsWithScoringUseCase` - Main orchestration

- **Controllers**:
  - `SearchController` - HTTP endpoint handler

- **DTOs**:
  - `SearchCragsRequestDto` - Request validation
  - `SearchCragsResponseDto` - Response format

### Infrastructure Layer

- **Repositories**:
  - `SearchCragRepository` - Database queries with filtering

## Adding New Scoring Strategies

To add a new scoring criterion:

1. Create a new strategy implementing `IScoringStrategy`:

```typescript
import type { Crag } from '@crags/domain/entities/crag.entity'
import type { IScoringStrategy, ScoringResult } from '../../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'

export class MyNewScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'myNewCriterion'
  }

  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult {
    const score = // ... your logic (0-100)
    return {
      score,
      details: { /* optional metadata */ }
    }
  }
}
```

2. Add the strategy to the use case:

```typescript
this.scoringService = new CragScoringService([
  { strategy: new DistanceScoringStrategy(), weight: 0.35 },
  { strategy: new GradeMatchScoringStrategy(), weight: 0.25 },
  { strategy: new SeasonalityScoringStrategy(), weight: 0.20 },
  { strategy: new RouteCountScoringStrategy(), weight: 0.10 },
  { strategy: new MyNewScoringStrategy(), weight: 0.10 }, // New strategy
])
```

Note: Weights must sum to 1.0

## Testing

### Run Unit Tests

```bash
bun test apps/api/src/search/ --test-name-pattern "^(?!.*Integration)"
```

### Run Integration Tests (requires TEST_DATABASE_URL)

```bash
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/mato_test" \
  bun test apps/api/src/search/ --test-name-pattern Integration
```

### Test Coverage

- ✅ 10 tests for seasonality types and utilities
- ✅ 6 tests for `CragScoringService`
- ✅ 6 tests for `DistanceScoringStrategy`
- ✅ 6 tests for `GradeMatchScoringStrategy`
- ✅ 6 tests for `SeasonalityScoringStrategy`
- ✅ 8 tests for `RouteCountScoringStrategy`
- ✅ 9 tests for `SearchCriteria` VO
- ✅ 6 tests for `ScoredCragResult` VO
- ✅ 11 tests for `GradeRange` VO
- ✅ 5 tests for `SearchCragsWithScoringUseCase`
- ✅ 4 integration tests (require TEST_DATABASE_URL)

## Dependencies

- `@crags/domain` - Crag entity and value objects
- `@grades/domain` - Grade conversion services
- `@OneJs/core` - DI and controller decorators
- `@OneJs/prisma` - Database client

## Future Enhancements

Potential scoring strategies to add:
- **Popularity Score** - Based on ascent count, kudos, favorites
- **Photo Quality** - Number and quality of photos/topos
- **Approach Time** - Proximity to parking/access
- **Style Matching** - Match user's preferred climbing styles
- **Weather Conditions** - Real-time weather API integration
- **User History** - Personalized recommendations based on past activity
