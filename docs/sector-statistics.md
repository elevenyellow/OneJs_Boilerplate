# Sector and Crag Statistics System

This document describes the comprehensive statistics system for climbing sectors and crags (areas). The system calculates, stores, and exposes metrics useful for filtering, searching, and presenting climbing information to users.

## Overview

The statistics system follows **Domain-Driven Design (DDD)** principles:

- **Value Objects**: Immutable objects representing statistical concepts
- **Domain Services**: Pure business logic for calculations
- **Application Mappers**: Transform data for persistence
- **Prisma Models**: Pre-computed fields for efficient filtering

### Architecture Flow

```
Scraper Data → SectorStatsCalculatorService → ComprehensiveSectorStats → SectorStatsMapper → Prisma Fields
                         ↓
              RouteStatsData[] (per-route metrics)
```

## Value Objects

All statistics VOs are located in `packages/sectors/domain/value-objects/`.

### 1. GradeDistributionStats

**File:** `grade-distribution-stats.vo.ts`

Analyzes the distribution of route difficulties using the universal grade index system (10-52+).

**Input:** `gbRoutes: number[]` - Array where index = grade index, value = route count

**Key Metrics:**
- `totalRoutes`: Total number of routes
- `minGradeIndex`, `maxGradeIndex`: Difficulty range
- `modeGradeIndex`: Most common grade
- `medianGradeIndex`: Median difficulty
- `gradeRangeFrench`, `gradeRangeYds`: Human-readable range labels
- `beginnerCount`, `intermediateCount`, `advancedCount`, `eliteCount`: Routes per level
- `beginnerPercentage`, `intermediatePercentage`, etc.: Percentages per level
- `difficultySpread`: 1-5 scale (1=concentrated, 5=very spread)
- `concentrationScore`: Gini coefficient (0-1, higher = more concentrated)

**Grade Level Thresholds:**
```typescript
BEGINNER_MAX = 22      // Up to 5c (French) / 5.9 (YDS)
INTERMEDIATE_MAX = 28  // 6a-6c (French) / 5.10a-5.11a (YDS)
ADVANCED_MAX = 36      // 6c+-8a (French) / 5.11b-5.13a (YDS)
ELITE_MIN = 37         // 8a+ and above
```

**Usage Example:**
```typescript
import { GradeDistributionStats } from '@sectors/domain/value-objects'

const gbRoutes = new Array(60).fill(0)
gbRoutes[20] = 5  // 5 routes at 5b
gbRoutes[24] = 10 // 10 routes at 6a
gbRoutes[28] = 8  // 8 routes at 6c

const stats = GradeDistributionStats.createFrom(gbRoutes)
console.log(stats.getGradeRange('french')) // "5b - 6c"
console.log(stats.getBeginnerRoutesCount()) // 5
console.log(stats.getMostCommonGradeIndex()) // 24
```

---

### 2. StyleDistribution

**File:** `style-distribution.vo.ts`

Tracks climbing style breakdown across routes.

**Input:** `StyleCountsInput` with counts for each style

**Supported Styles:**
- `sport`: Sport climbing (bolted)
- `trad`: Traditional climbing (gear placement)
- `boulder`: Bouldering
- `aid`: Aid climbing
- `alpine`: Alpine routes
- `mixed`: Mixed climbing (rock + ice)
- `ice`: Ice climbing
- `topRope`: Top-rope only

**Key Metrics:**
- `sportCount`, `tradCount`, etc.: Absolute counts
- `sportPercentage`, `tradPercentage`, etc.: Percentages
- `primaryStyle`: Dominant style (or 'mixed' if none >50%)
- `isMultiStyle`: True if multiple styles present

**Usage Example:**
```typescript
import { StyleDistribution } from '@sectors/domain/value-objects'

const styles = StyleDistribution.createFrom({
  sport: 45,
  trad: 5,
  boulder: 0,
  aid: 0,
  alpine: 0,
  mixed: 0,
  ice: 0,
  topRope: 0,
})
console.log(styles.getPrimaryStyle()) // 'sport'
console.log(styles.getSportPercentage()) // 90
```

---

### 3. QualityStats

**File:** `quality-stats.vo.ts`

Measures route quality based on ratings and classifications.

**Input:**
```typescript
interface QualityStatsInput {
  totalRoutes: number
  classicRoutesCount?: number    // Routes marked as "classic"
  recommendedRoutesCount?: number // Routes marked as "recommended"
  highQualityRoutesCount?: number // Routes with stars >= 3
  averageQualityScore?: number   // Average quality score (0-100)
  averageStars?: number          // Average star rating (0-4)
}
```

**Key Metrics:**
- `classicRoutesCount`, `classicRoutesPercentage`
- `recommendedRoutesCount`, `recommendedRoutesPercentage`
- `highQualityRoutesCount`, `highQualityPercentage`
- `averageQualityScore`: 0-100 scale
- `averageStars`: 0-4 scale
- `qualityRating`: 1-5 derived rating
- `hasClassics`: Boolean
- `isHighQualitySector`: True if quality score >= 70

**Quality Thresholds:**
```typescript
HIGH_QUALITY_THRESHOLD = 70      // averageQualityScore for "high quality"
HIGH_QUALITY_STARS_THRESHOLD = 3 // Stars threshold for "high quality route"
```

---

### 4. PopularityStats

**File:** `popularity-stats.vo.ts`

Tracks climbing activity and popularity.

**Input:**
```typescript
interface PopularityStatsInput {
  totalRoutes: number
  totalAscents?: number
  popularRoutesCount?: number      // Routes with >= 100 ascents
  veryPopularRoutesCount?: number  // Routes with >= 500 ascents
  mostClimbedRoute?: MostClimbedRoute
}
```

**Key Metrics:**
- `totalAscents`: Total ascents across all routes
- `averageAscentsPerRoute`: Mean ascents
- `popularRoutesCount`, `popularRoutesPercentage`
- `veryPopularRoutesCount`, `veryPopularRoutesPercentage`
- `popularityScore`: 0-100 derived score
- `popularityRating`: 1-5 derived rating
- `isPopularSector`: True if score >= 60
- `mostClimbedRoute`: { name, ascents }

**Popularity Thresholds:**
```typescript
POPULAR_ROUTE_ASCENTS = 100       // Ascents for "popular"
VERY_POPULAR_ROUTE_ASCENTS = 500  // Ascents for "very popular"
POPULAR_SECTOR_THRESHOLD = 60     // Score for "popular sector"
```

---

### 5. HeightStats

**File:** `height-stats.vo.ts`

Analyzes route heights and pitch counts.

**Input:**
```typescript
interface HeightStatsInput {
  totalRoutes: number
  totalHeight?: number        // Sum of all route heights (meters)
  maxHeight?: number          // Tallest route
  averageHeight?: number      // Mean height
  totalPitches?: number       // Sum of pitches
  averagePitches?: number     // Mean pitches per route
  multiPitchCount?: number    // Routes with > 1 pitch
  singlePitchCount?: number   // Routes with 1 pitch
}
```

**Key Metrics:**
- `maxHeight`, `averageHeight`: Height in meters
- `totalClimbableMeters`: Sum of all route heights
- `multiPitchCount`, `singlePitchCount`, `multiPitchPercentage`
- `averagePitches`: Mean pitches per route
- `isMultiPitchFocused`: True if > 50% multi-pitch
- `hasTallRoutes`: True if maxHeight >= 50m

**Height Thresholds:**
```typescript
TALL_ROUTE_HEIGHT = 50  // Meters for "tall route"
MULTI_PITCH_MIN = 2     // Pitches for "multi-pitch"
```

---

### 6. EquipmentStats

**File:** `equipment-stats.vo.ts`

Tracks equipment and documentation quality.

**Input:**
```typescript
interface EquipmentStatsInput {
  totalRoutes: number
  totalBolts?: number
  averageBolts?: number
  maxBolts?: number
  routesWithTopoCount?: number
  routesWithBetaCount?: number
}
```

**Key Metrics:**
- `averageBolts`, `maxBolts`: Bolt statistics
- `routesWithTopoCount`, `topoPercentage`
- `routesWithBetaCount`, `betaPercentage`
- `isWellEquipped`: True if avgBolts >= 8
- `isWellDocumented`: True if topoPercentage >= 70%

---

### 7. SeasonalityStats

**File:** `seasonality-stats.vo.ts`

Analyzes best climbing seasons.

**Input:** `seasonality: number[]` - 12-element array (Jan=0 to Dec=11), values represent climbing suitability

**Key Metrics:**
- `bestMonths`: Array of month indices (0-11)
- `bestMonthsLabels`: Human-readable month names
- `climbableMonthsCount`: Number of suitable months
- `isYearRound`: True if all 12 months are suitable
- `isWinterSector`: Best months are Dec-Feb
- `isSummerSector`: Best months are Jun-Aug
- `isSpringFallSector`: Best in shoulder seasons
- `getBestSeasonLabel()`: "Year-round", "Winter", "Summer", "Spring/Fall"

**Usage Example:**
```typescript
import { SeasonalityStats } from '@sectors/domain/value-objects'

const seasonality = [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0] // Mar-May, Sep-Nov
const stats = SeasonalityStats.createFrom(seasonality)
console.log(stats.getBestSeasonLabel()) // "Spring/Fall"
console.log(stats.getBestMonthsLabels()) // ["Mar", "Apr", "May", "Sep", "Oct", "Nov"]
```

---

### 8. AudienceProfile

**File:** `audience-profile.vo.ts`

Determines target audience based on grade distribution.

**Input:**
```typescript
interface AudienceProfileInput {
  totalRoutes: number
  beginnerRoutes?: number      // Routes suitable for beginners
  intermediateRoutes?: number
  advancedRoutes?: number
  eliteRoutes?: number
}
```

**Key Metrics:**
- `beginnerPercentage`, `intermediatePercentage`, `advancedPercentage`, `elitePercentage`
- `primaryAudience`: 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'mixed'
- `isBeginnerFriendly`: True if beginner% >= 30%
- `isFamilyFriendly`: True if beginner% >= 40%
- `getAudienceDescription()`: Human-readable description

---

### 9. ContentMetrics

**File:** `content-metrics.vo.ts`

Measures information completeness and documentation quality.

**Input:**
```typescript
interface ContentMetricsInput {
  totalRoutes: number
  routesWithTopo: number
  routesWithPhotos: number
  totalPhotos: number
  hasApproachInfo: boolean
  hasBetaInfo: boolean
  hasDescription: boolean
  hasCoordinates: boolean
}
```

**Key Metrics:**
- `toposCoverage`: Percentage of routes with topos (0-100)
- `photosDensity`: Average photos per route
- `informationCompleteness`: Overall score (0-100)
- `isWellDocumented`: True if topoCoverage >= 70% OR completeness >= 60%

**Completeness Weights:**
```typescript
TOPOS_COVERAGE = 30%    // Most important for climbers
APPROACH_INFO = 20%     // Important for access
PHOTOS_COVERAGE = 15%
DESCRIPTION = 15%
BETA_INFO = 10%
COORDINATES = 10%
```

---

### 10. ComprehensiveSectorStats

**File:** `comprehensive-sector-stats.vo.ts`

Composite VO that aggregates all statistics into a single object.

**Input:** All sub-statistics or primitives from other VOs

**Key Methods:**
- `getOverallScore()`: 0-100 weighted score
- `getSectorRating()`: 1-5 star rating
- `toPrimitives()`: Full serialization

**Overall Score Weights:**
```typescript
QUALITY = 25%
POPULARITY = 20%
GRADE_VARIETY = 15%
EQUIPMENT = 15%
CONTENT = 15%
SEASONALITY = 10%
```

---

## Domain Service

### SectorStatsCalculatorService

**File:** `packages/sectors/domain/services/sector-stats-calculator.service.ts`

Pure domain service that calculates comprehensive statistics from route-level data.

**Input Interface:**
```typescript
interface RouteStatsData {
  gradeBand: number           // Universal grade index (10-52)
  stars: number | null        // Star rating (0-4)
  qualityScore: number | null // Quality score (0-100)
  ascents: number | null      // Number of ascents
  popularity: number | null   // Popularity score
  height: number | null       // Height in meters
  pitches: number | null      // Number of pitches
  bolts: number | null        // Number of bolts
  hasTopo: boolean            // Has topo image
  isSport: boolean            // Sport climbing
  isTrad: boolean             // Traditional climbing
  isBoulder: boolean          // Bouldering
  isAid: boolean              // Aid climbing
  isAlpine: boolean           // Alpine
  isMixed: boolean            // Mixed climbing
  isIce: boolean              // Ice climbing
  isTopRope: boolean          // Top-rope
  name?: string               // Route name (for mostClimbed)
}
```

**Usage:**
```typescript
import { SectorStatsCalculatorService } from '@sectors/domain/services/sector-stats-calculator.service'

const routes: RouteStatsData[] = [
  { gradeBand: 24, stars: 3, ascents: 150, isSport: true, ... },
  { gradeBand: 28, stars: 4, ascents: 300, isSport: true, ... },
]

const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
console.log(stats.getOverallScore()) // 75
console.log(stats.getSectorRating()) // 4
```

---

## Application Mappers

### SectorStatsMapper

**File:** `packages/sectors/application/mappers/sector-stats.mapper.ts`

Transforms statistics into Prisma-compatible fields.

**Methods:**
- `calculateFromRoutes(routes)`: Full calculation from route data
- `calculateFromGradeBands(gbRoutes, seasonality)`: Partial calculation from arrays
- `mapToDatabaseFields(primitives)`: Convert primitives to DB fields

**Output Interface:**
```typescript
interface SectorStatisticsFields {
  // Grade Distribution
  gradeRangeFrench: string | null
  gradeRangeYds: string | null
  minGradeIndex: number | null
  maxGradeIndex: number | null
  modeGradeIndex: number | null
  beginnerRoutesCount: number | null
  intermediateRoutesCount: number | null
  advancedRoutesCount: number | null
  eliteRoutesCount: number | null
  beginnerPercentage: number | null
  intermediatePercentage: number | null
  advancedPercentage: number | null
  elitePercentage: number | null
  difficultySpread: number | null
  concentrationScore: number | null
  
  // Style Distribution
  sportCount: number | null
  tradCount: number | null
  boulderCount: number | null
  aidCount: number | null
  alpineCount: number | null
  mixedCount: number | null
  iceCount: number | null
  topRopeCount: number | null
  primaryStyle: string | null
  isMultiStyle: boolean | null
  
  // Quality Stats
  classicRoutesCount: number | null
  recommendedRoutesCount: number | null
  highQualityRoutesCount: number | null
  averageQualityScore: number | null
  averageStars: number | null
  qualityRating: number | null
  isHighQualitySector: boolean | null
  
  // Popularity Stats
  totalAscents: number | null
  popularRoutesCount: number | null
  veryPopularRoutesCount: number | null
  averageAscentsPerRoute: number | null
  popularityScore: number | null
  isPopularSector: boolean | null
  
  // Height Stats
  maxHeight: number | null
  totalClimbableMeters: number | null
  multiPitchCount: number | null
  singlePitchCount: number | null
  averagePitches: number | null
  isMultiPitchFocused: boolean | null
  hasTallRoutes: boolean | null
  
  // Equipment Stats
  averageBolts: number | null
  maxBolts: number | null
  routesWithTopoCount: number | null
  isWellEquipped: boolean | null
  isWellDocumented: boolean | null
  
  // Seasonality Stats
  bestMonths: number[] | null
  climbableMonthsCount: number | null
  isYearRound: boolean | null
  
  // Audience Profile
  primaryAudience: string | null
  isBeginnerFriendly: boolean | null
  isFamilyFriendly: boolean | null
  
  // Overall Scores
  overallScore: number | null
  sectorRating: number | null
}
```

### CragStatsMapper

**File:** `packages/crags/application/mappers/crag-stats.mapper.ts`

Similar to SectorStatsMapper but includes aggregation fields:
- `sectorCount`: Number of sectors
- `bestSectorId`, `bestSectorName`, `bestSectorScore`: Top sector info

---

## Prisma Models

### Sector Model

**File:** `packages/sectors/infrastructure/persistence/prisma/sector.model.prisma`

All computed statistics fields are stored for efficient filtering:

```prisma
model Sector {
  // ... existing fields ...
  
  // Grade Distribution
  gradeRangeFrench        String?
  gradeRangeYds           String?
  minGradeIndex           Int?
  maxGradeIndex           Int?
  modeGradeIndex          Int?
  beginnerRoutesCount     Int?
  intermediateRoutesCount Int?
  advancedRoutesCount     Int?
  eliteRoutesCount        Int?
  // ... more fields
  
  // Overall Scores
  overallScore            Int?
  sectorRating            Int?
  
  // Boolean filters
  isHighQualitySector     Boolean @default(false)
  isPopularSector         Boolean @default(false)
  isBeginnerFriendly      Boolean @default(false)
  isFamilyFriendly        Boolean @default(false)
  isMultiPitchFocused     Boolean @default(false)
  isWellEquipped          Boolean @default(false)
  isWellDocumented        Boolean @default(false)
  isYearRound             Boolean @default(false)
}
```

### Crag Model

**File:** `packages/crags/infrastructure/persistence/prisma/crag.model.prisma`

Same fields as Sector plus:
```prisma
model Crag {
  // ... same fields as Sector ...
  
  // Aggregation fields
  sectorCount       Int?
  bestSectorId      String?
  bestSectorName    String?
  bestSectorScore   Int?
}
```

---

## Integration in Scraper Pipeline

### Calculating Stats During Scraping

```typescript
import { SectorStatsMapper, RouteDataForStats } from '@sectors/application/mappers/sector-stats.mapper'

// In scraped-data-to-sector.mapper.ts
function mapScrapedDataToSector(scrapedData: ScrapedSectorData): SectorPrismaInput {
  // Extract route-level data
  const routes: RouteDataForStats[] = scrapedData.routes.map(route => ({
    gradeBand: route.gradeBand ?? 0,
    stars: route.stars,
    qualityScore: route.qualityScore,
    ascents: route.ascents,
    popularity: route.popularity,
    height: route.height,
    pitches: route.pitches,
    bolts: route.bolts,
    hasTopo: route.hasTopo ?? false,
    isSport: route.isSport ?? false,
    isTrad: route.isTrad ?? false,
    isBoulder: route.isBoulder ?? false,
    isAid: route.isAid ?? false,
    isAlpine: route.isAlpine ?? false,
    isMixed: route.isMixed ?? false,
    isIce: route.isIce ?? false,
    isTopRope: route.isTopRope ?? false,
    name: route.name,
  }))
  
  // Calculate statistics
  const statsFields = SectorStatsMapper.calculateFromRoutes(routes)
  
  return {
    // ... other sector fields ...
    ...statsFields,
  }
}
```

### Using gbRoutes Fallback

When route-level data isn't available but `gbRoutes` array exists:

```typescript
import { SectorStatsMapper } from '@sectors/application/mappers/sector-stats.mapper'

const partialStats = SectorStatsMapper.calculateFromGradeBands(
  sector.gbRoutes,    // number[] - grade distribution
  sector.seasonality  // number[] - month suitability
)
```

---

## Filtering Examples

### Finding Beginner-Friendly Sectors

```typescript
const beginnerSectors = await prisma.sector.findMany({
  where: {
    isBeginnerFriendly: true,
    beginnerRoutesCount: { gte: 10 },
  },
  orderBy: { beginnerPercentage: 'desc' },
})
```

### Finding High-Quality Sport Sectors

```typescript
const qualitySportSectors = await prisma.sector.findMany({
  where: {
    primaryStyle: 'sport',
    isHighQualitySector: true,
    averageStars: { gte: 3 },
  },
  orderBy: { overallScore: 'desc' },
})
```

### Finding Multi-Pitch Areas

```typescript
const multiPitchAreas = await prisma.sector.findMany({
  where: {
    isMultiPitchFocused: true,
    hasTallRoutes: true,
    maxHeight: { gte: 100 },
  },
})
```

### Finding Year-Round Destinations

```typescript
const yearRoundSectors = await prisma.sector.findMany({
  where: {
    isYearRound: true,
    isWellDocumented: true,
  },
})
```

### Complex Search Example

```typescript
const perfectSector = await prisma.sector.findMany({
  where: {
    AND: [
      { minGradeIndex: { lte: 24 } },  // Has routes <= 6a
      { maxGradeIndex: { gte: 30 } },  // Has routes >= 7a
      { isWellEquipped: true },
      { averageStars: { gte: 2.5 } },
      { popularRoutesCount: { gte: 5 } },
    ],
  },
  orderBy: [
    { sectorRating: 'desc' },
    { overallScore: 'desc' },
  ],
  take: 20,
})
```

---

## Testing

### Test Files Location

```
packages/sectors/domain/value-objects/__tests__/
├── grade-distribution-stats.test.ts
├── style-distribution.test.ts
├── quality-stats.test.ts
├── popularity-stats.test.ts
├── height-stats.test.ts
├── equipment-stats.test.ts
├── seasonality-stats.test.ts
├── audience-profile.test.ts
├── content-metrics.test.ts
└── comprehensive-sector-stats.test.ts

packages/sectors/domain/services/__tests__/
└── sector-stats-calculator.service.test.ts

packages/sectors/application/mappers/__tests__/
└── sector-stats.mapper.test.ts

packages/crags/application/mappers/__tests__/
└── crag-stats.mapper.test.ts
```

### Running Tests

```bash
# All sector tests
bun test packages/sectors

# All crag tests  
bun test packages/crags

# Specific VO tests
bun test packages/sectors/domain/value-objects/__tests__/quality-stats.test.ts

# With verbose output
TEST_LOGGER=1 bun test packages/sectors
```

---

## Future Enhancements

### Pending Tasks

1. **Run Prisma Migration**: Apply schema changes to database
   ```bash
   bunx prisma migrate dev --name add_sector_statistics_fields
   bun db:generate
   ```

2. **Update Repositories**: Ensure `SectorPrismaRepository` and `CragPrismaRepository` handle new fields

3. **Integrate with Scraper**: Wire `SectorStatsMapper` into `scraped-data-to-sector.mapper.ts`

4. **Add API Endpoints**: Expose filtering capabilities through REST/GraphQL endpoints

### Potential New Statistics

- **AccessibilityStats**: Approach difficulty, parking, altitude
- **SafetyStats**: Loose rock, rescue access, mobile coverage
- **CrowdStats**: Peak seasons, waiting times, capacity
- **WeatherStats**: Typical conditions by season
- **HistoricalStats**: First ascent dates, development timeline

---

## References

- **Grade Systems**: See `docs/grading-systems.md` for universal index details
- **GradeConverter**: `packages/grades/domain/services/grade-converter.ts`
- **TDD Cycle**: All VOs developed following `.cursor/rules/tdd-cycle.mdc`
- **DDD Patterns**: Following `.cursor/rules/code-style-and-commands.mdc`
