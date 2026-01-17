# Grade Distribution System - Implementation Summary

## Changes Implemented

### ✅ Problem Solved

**BEFORE**: The system was using TheCrag's `gbRoutes` directly, which uses their internal Grade Band (GB) indexing system that doesn't match our universal grading index (10-47 based on French grades).

**AFTER**: We now build our own `gbRoutes` and `gbAscents` arrays from individual route grades, converting them to our universal index system using `GradeConverter`.

---

## Files Changed

### 1. **NEW: `grade-distribution-builder.ts`**
Location: `packages/the-crag/infrastructure/scraper/grade-distribution-builder.ts`

**Purpose**: Service to build grade distribution arrays from individual routes

**Key Methods**:
- `buildGbRoutes(routes)` - Counts routes at each universal grade index
- `buildGbAscents(routes)` - Sums ascents at each universal grade index
- `aggregateGbRoutes(areas)` - Combines distributions from multiple areas
- `aggregateGbAscents(areas)` - Combines ascent distributions
- `detectGradeSystem(route)` - Auto-detects grade system from route data

**Features**:
- ✅ Supports all 6 grade systems (French, YDS, UIAA, British, Font, Hueco)
- ✅ Auto-detects grade system from format or gradeStyle field
- ✅ Handles edge cases (null grades, "Project", "?", "Unknown")
- ✅ Aggregates hierarchically for crags with sectors

**Tests**: 12 tests, all passing ✓

---

### 2. **MODIFIED: `Scraper.ts`**
Location: `packages/the-crag/infrastructure/scraper/Scraper.ts`

**Changes**:
1. Import `GradeDistributionBuilder`
2. Import `TagsMap` type (was missing)
3. `buildProcessedAreaFromFlatten()`: Initialize `gbRoutes` and `gbAscents` as empty arrays instead of using TheCrag's data
4. `buildAreas()`: After processing routes or subareas, calculate `gbRoutes` and `gbAscents`
5. `virtualCrag()`: Build distributions from routes
6. `realCrag()`: Aggregate distributions from subareas

**Impact**: All future scrapes will automatically use the correct grading system

---

### 3. **MODIFIED: `api.interfaces.ts`**
Location: `packages/the-crag/infrastructure/scraper/api.interfaces.ts`

**Changes**:
1. `ProcessedArea`: Changed `gbRoutes` and `gbAscents` from `number[] | null` to `number[]` (always present)
2. `ScrapedCrag`: Added `gbRoutes` and `gbAscents` fields (optional)

**Impact**: Type safety ensures distributions are always calculated

---

### 4. **MODIFIED: `search-crag.repository.ts`**
Location: `apps/api/src/search/infrastructure/persistence/search-crag.repository.ts`

**Changes**:
1. Uncommented grade range filtering (was disabled)
2. Re-enabled `gradeRange.hasRoutesInRange()` filtering

**Impact**: Search now correctly filters crags by grade range

---

### 5. **NEW: Migration Script**
Location: `scripts/migrate-grade-distribution.ts`

**Purpose**: Rebuild `gbRoutes` and `gbAscents` for existing database records

**Usage**:
```bash
bun run scripts/migrate-grade-distribution.ts
```

**What it does**:
- Processes all sectors: fetches routes, rebuilds distributions
- Processes all crags: fetches routes, rebuilds distributions
- Updates database with new universal index arrays
- Logs progress and errors

---

### 6. **NEW: Documentation**
Location: `packages/the-crag/infrastructure/scraper/GRADE_DISTRIBUTION_MIGRATION.md`

Complete documentation of the problem, solution, and migration process.

---

## Test Coverage

### New Tests Created

**`grade-distribution-builder.test.ts`** (12 tests):
- ✅ French grade conversion
- ✅ YDS grade conversion  
- ✅ Font boulder grades
- ✅ Hueco V-scale grades
- ✅ Skip invalid grades
- ✅ Ascent count aggregation
- ✅ Multi-area aggregation
- ✅ Grade system auto-detection
- ✅ Mixed grade systems

**All tests passing**: ✓

### Existing Tests Still Pass

- ✅ `grade-range.vo.test.ts` (11 tests)
- ✅ `grade-match-scoring.strategy.test.ts` (6 tests)

---

## Grade System Support

The implementation correctly handles all 6 grading systems:

| System | Examples | Index Range |
|--------|----------|-------------|
| **French** | 6a, 7b+, 8c | 10-46 |
| **YDS** | 5.10a, 5.12d, 5.14c | 10-46 |
| **UIAA** | VI+, VII, VIII+ | 10-46 |
| **British** | HVS, E1, E5 | 10-46 |
| **Font** | 6A, 7C+, 8B (boulder) | 10-52 |
| **Hueco** | V0, V5, V12 (boulder) | 10-52 |

---

## How Grade Detection Works

### 1. From `gradeStyle` field (if present)
```typescript
gradeStyle: "french" → system = 'french'
gradeStyle: "yds" → system = 'yds'
```

### 2. From grade string pattern
```typescript
"5.10a" → detected as YDS
"V5" → detected as Hueco
"6A" → detected as Font (uppercase)
"E5" → detected as British
"VII+" → detected as UIAA
"6a" → detected as French (default)
```

### 3. Fallback
If detection fails, defaults to French system.

---

## Migration Required

**⚠️ IMPORTANT**: Existing data in the database still uses TheCrag's GB system.

### To Fix Existing Data

Run the migration script:
```bash
bun run scripts/migrate-grade-distribution.ts
```

This will:
1. Process all sectors and crags
2. Rebuild `gbRoutes` and `gbAscents` from route grades
3. Update database with correct distributions

### Verification After Migration

```bash
# Test grade filtering
curl "http://localhost:3000/api/search/crags?lat=41.7&lng=1.8&radius=50&minGrade=6a&maxGrade=7a&system=french"

# Check a known crag
curl "http://localhost:3000/api/search/crags?lat=41.7&lng=1.8&radius=5"
```

---

## Benefits

✅ **Correct grade filtering**: Search accurately finds crags with routes in the specified grade range

✅ **Accurate scoring**: Grade match scoring uses correct distribution percentages

✅ **Multi-system support**: All 6 grading systems work correctly with automatic conversion

✅ **Future-proof**: New crags scraped will automatically use the correct system

✅ **Maintainable**: Clear separation between TheCrag's data and our grading logic

---

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `grade-distribution-builder.ts` | Core conversion logic | ✅ Created, tested |
| `grade-distribution-builder.test.ts` | Test coverage | ✅ Created, 12 tests passing |
| `Scraper.ts` | Use builder in scraper | ✅ Modified, working |
| `api.interfaces.ts` | Type definitions | ✅ Updated |
| `search-crag.repository.ts` | Enable grade filtering | ✅ Updated |
| `migrate-grade-distribution.ts` | Migration script | ✅ Created |
| `GRADE_DISTRIBUTION_MIGRATION.md` | Migration docs | ✅ Created |
| `IMPLEMENTATION_SUMMARY.md` | This file | ✅ Created |

---

## Next Steps

1. **Run migration script** to update existing data:
   ```bash
   bun run scripts/migrate-grade-distribution.ts
   ```

2. **Test search functionality** with various grade ranges

3. **Verify scoring accuracy** in production

4. **Monitor for edge cases** (unusual grade formats from TheCrag)

---

## Technical Details

### Universal Index System

Our system uses indices 10-100:
- **10-46**: French sport grades (3 to 9c)
- **47-52**: Extended boulder grades (Font 8B+ to 8C+)
- **53-99**: Reserved for future expansion

### Grade Conversion Flow

```
Route Grade String (from TheCrag)
         ↓
  Detect Grade System
         ↓
  GradeConverter.toIndex()
         ↓
  Universal Index (10-52)
         ↓
  gbRoutes[index]++
```

### Example Conversion

```typescript
// Input: routes from TheCrag
routes = [
  { grade: "6a", gradeStyle: "french" },    // → index 24
  { grade: "5.10a", gradeStyle: "yds" },    // → index 24
  { grade: "7a", gradeStyle: "french" },    // → index 30
  { grade: "V5", gradeStyle: "hueco" },     // → index 28
]

// Output: gbRoutes array
gbRoutes = [
  0, 0, ..., 0,  // indices 0-23
  2,             // index 24: 6a + 5.10a (2 routes)
  0, 0, 0,       // indices 25-27
  1,             // index 28: V5 (1 route)
  0,             // index 29
  1,             // index 30: 7a (1 route)
  0, 0, ...      // indices 31-99
]
```

---

## Support

If you encounter issues:
1. Check the logs for grade conversion errors
2. Verify route data has valid `grade` field
3. Review `GRADE_DISTRIBUTION_MIGRATION.md` for troubleshooting
4. Run tests to ensure system integrity

---

**Status**: ✅ Implementation complete, ready for migration
