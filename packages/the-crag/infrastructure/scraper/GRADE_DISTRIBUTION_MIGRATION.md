# Grade Distribution System - Migration from TheCrag GB to Universal Index

## Problem

Previously, the scraper was using TheCrag's `gbRoutes` and `gbAscents` arrays directly from their API. These arrays use TheCrag's internal **Grade Band (GB)** system, which does NOT match our universal grading index system (indices 10-47 based on French grades).

### Example of the mismatch:
```typescript
// TheCrag's system
gbRoutes[24] = ??? (unknown what grade this represents in TheCrag's system)

// Our system
gbRoutes[24] = routes at 6a French (index 24 in our universal system)
```

This mismatch caused incorrect grade filtering in the search functionality, as the scoring system expected our universal indices but received TheCrag's GB indices.

## Solution

We now **build our own `gbRoutes` and `gbAscents` arrays** from individual route grades using our universal grading system.

### New Component: `GradeDistributionBuilder`

Located at: `packages/the-crag/infrastructure/scraper/grade-distribution-builder.ts`

This service:
1. Takes individual routes with their grade strings ("6a", "5.10a", "V5", etc.)
2. Detects the grading system used (French, YDS, Hueco, Font, UIAA, British)
3. Converts each grade to our universal index using `GradeConverter`
4. Counts routes and ascents at each universal index
5. Aggregates distributions for parent crags with multiple sectors

### Key Features

#### 1. Multi-system Grade Detection
Automatically detects grade systems from:
- Grade format (e.g., "5.10a" → YDS, "V5" → Hueco, "6A" → Font)
- `gradeStyle` field from TheCrag API
- Falls back to French if ambiguous

#### 2. Handles Edge Cases
- Skips routes without grades
- Filters out "Project", "?", "Unknown" grades
- Handles mixed grade systems in the same area
- Supports all 6 grading systems (French, YDS, UIAA, British, Font, Hueco)

#### 3. Hierarchical Aggregation
For crags with multiple sectors:
- Each sector calculates its own `gbRoutes` from its routes
- Parent crags aggregate `gbRoutes` from all child sectors
- Maintains correct distribution throughout the hierarchy

## Changes Made

### Modified Files

1. **`Scraper.ts`**
   - Import `GradeDistributionBuilder`
   - In `buildAreas()`: Build `gbRoutes`/`gbAscents` from routes or aggregate from sub-areas
   - In `virtualCrag()`: Build `gbRoutes`/`gbAscents` from routes
   - In `realCrag()`: Aggregate `gbRoutes`/`gbAscents` from all areas
   - In `buildProcessedAreaFromFlatten()`: Initialize with empty arrays instead of TheCrag's data

2. **`api.interfaces.ts`**
   - Added `gbRoutes` and `gbAscents` fields to `ScrapedCrag` interface

3. **`grade-distribution-builder.ts`** (NEW)
   - `buildGbRoutes()`: Converts route grades to universal indices and counts
   - `buildGbAscents()`: Converts route grades and sums ascent counts
   - `aggregateGbRoutes()`: Combines distributions from multiple areas
   - `aggregateGbAscents()`: Combines ascent distributions from multiple areas
   - `detectGradeSystem()`: Auto-detects grade system from format

### Test Coverage

Created comprehensive test suite at:
`packages/the-crag/infrastructure/scraper/__tests__/grade-distribution-builder.test.ts`

**12 tests covering:**
- French grade conversion (6a, 7b+, etc.)
- YDS grade conversion (5.10a, 5.12d, etc.)
- Font boulder grades (6A, 7C+, etc.)
- Hueco V-scale (V0, V5, etc.)
- Skipping invalid grades (null, "Project", "?")
- Ascent count aggregation
- Multi-area aggregation
- Mixed grade systems
- Grade system auto-detection

**All tests passing ✓**

## Usage Example

### Before (Incorrect)
```typescript
// Used TheCrag's gbRoutes directly
gbRoutes: areaInfo?.data.gbRoutes || null,
```

### After (Correct)
```typescript
// Build from individual routes using our universal system
const routes = [
  { grade: "6a", ascentCount: 10 },  // index 24
  { grade: "7a", ascentCount: 5 },   // index 30
  { grade: "5.10a", ascentCount: 8 } // index 24 (YDS → French)
]

const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)
// Result: [0, 0, ..., 2, 0, ..., 1, 0, ...]
//         gbRoutes[24] = 2  (6a + 5.10a)
//         gbRoutes[30] = 1  (7a)
```

## Benefits

1. **Correct Grade Filtering**: Search now filters by actual grade ranges
2. **Accurate Scoring**: Grade match scoring uses correct distributions
3. **System Consistency**: All parts of the app use the same universal index system
4. **Multi-system Support**: Handles all 6 grade systems correctly
5. **Future-proof**: Easy to add new grade systems or adjust mappings

## Impact on Existing Data

**⚠️ IMPORTANT**: Existing data in the database still has the old TheCrag `gbRoutes` format.

### Migration Required

You need to:
1. **Re-scrape all crags** to populate with new universal index `gbRoutes`
2. **Or** create a migration script that rebuilds `gbRoutes` from existing route data

Until then, search results may be incorrect for data scraped before this change.

## Related Files

- `packages/grades/domain/services/grade-converter.ts` - Universal grade conversion
- `packages/grades/domain/tables/` - Grade system tables (French, YDS, etc.)
- `packages/search/domain/value-objects/grade-range.vo.ts` - Uses universal indices
- `apps/api/src/search/domain/services/strategies/grade-match-scoring.strategy.ts` - Scoring strategy

## Future Improvements

1. **Migration Script**: Rebuild `gbRoutes` for existing database records
2. **Grade Normalization**: Store normalized grade alongside original for faster querying
3. **Grade Confidence**: Track confidence level of grade system detection
4. **Performance**: Cache grade conversions if performance becomes an issue
