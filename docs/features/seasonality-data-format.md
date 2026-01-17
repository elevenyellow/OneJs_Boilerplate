# Seasonality Data Format Reference

## Overview

The `seasonality` field in the `Crag` and `Sector` models stores information about when a climbing area is optimal for climbing. This document clarifies the data format to prevent future misinterpretation.

## Current Data Format (FORMAT 1 - Legacy)

### Structure
```typescript
seasonality: number[] // Array of month numbers (1-12)
```

### Interpretation
- **Array contains:** Month numbers when climbing is GOOD
- **Values:** Integers from 1-12 representing months (1=January, 12=December)
- **Array length:** Variable (1-12 months)
- **Empty array:** No seasonality data available

### Examples

#### Example 1: Winter Crag (Altura, Margalef)
```json
{
  "name": "Altura",
  "seasonality": [1, 2, 3, 11, 12]
}
```
**Interpretation:**
- ✅ Good in: January, February, March, November, December (winter months)
- ❌ Not optimal in: April-October (summer months too hot)

#### Example 2: Summer Crag (Montserrat, Siurana)
```json
{
  "name": "Montserrat", 
  "seasonality": [4, 5, 6, 7, 8, 9, 10]
}
```
**Interpretation:**
- ✅ Good in: April-October (spring, summer, autumn)
- ❌ Not optimal in: November-March (winter months too cold/wet)

#### Example 3: Year-Round Crag
```json
{
  "name": "Rodellar",
  "seasonality": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}
```
**Interpretation:**
- ✅ Good all year round (protected/varied aspects)

## Future Data Format (FORMAT 2 - Scores)

**⚠️ NOT YET IMPLEMENTED - Future enhancement when stats are regenerated**

### Structure
```typescript
seasonality: number[] // Array of 12 scores (one per month)
```

### Interpretation
- **Array contains:** Quality scores for each month (0-100)
- **Array length:** Always 12 (one score per month)
- **Index:** Position in array = month (0=Jan, 11=Dec)
- **Score ranges:**
  - 80-100: Excellent (peak season) ⭐⭐⭐
  - 60-79: Good ⭐⭐
  - 40-59: Fair ⭐
  - 0-39: Poor (off-season) ❌

### Example (Future Format)
```json
{
  "name": "Altura",
  "seasonality": [85, 90, 80, 65, 45, 30, 25, 28, 40, 60, 75, 88]
}
```

**Interpretation by month:**
| Month | Index | Score | Quality |
|-------|-------|-------|---------|
| Jan | 0 | 85 | ⭐⭐⭐ Excellent |
| Feb | 1 | 90 | ⭐⭐⭐ Excellent |
| Mar | 2 | 80 | ⭐⭐⭐ Excellent |
| Apr | 3 | 65 | ⭐⭐ Good |
| May | 4 | 45 | ⭐ Fair |
| Jun | 5 | 30 | ❌ Poor |
| Jul | 6 | 25 | ❌ Poor |
| Aug | 7 | 28 | ❌ Poor |
| Sep | 8 | 40 | ⭐ Fair |
| Oct | 9 | 60 | ⭐⭐ Good |
| Nov | 10 | 75 | ⭐⭐ Good |
| Dec | 11 | 88 | ⭐⭐⭐ Excellent |

**Summary:** Peak season in winter (Nov-Mar), off-season in summer (Jun-Aug)

## Format Detection

When implementing FORMAT 2 support, use this detection logic:

```typescript
function detectSeasonalityFormat(seasonality: number[]): 'months' | 'scores' {
  // FORMAT 2: Array of 12 scores
  if (seasonality.length === 12 && seasonality.some(v => v > 12)) {
    return 'scores'
  }
  
  // FORMAT 1: Array of month numbers
  return 'months'
}
```

## Code Implementation Status

### Backend
- ✅ `packages/crags/domain/value-objects/seasonality.vo.ts` - Handles FORMAT 1, documented for FORMAT 2
- ✅ `packages/sectors/domain/value-objects/seasonality-stats.vo.ts` - Similar handling
- ⚠️ Database: Currently stores FORMAT 1 data

### Frontend
- ✅ `apps/mobile-app/src/utils/cragHelpers.ts` - `isInOptimalSeason()` handles FORMAT 1, documented for FORMAT 2
- ✅ `apps/mobile-app/src/components/shared/SeasonBadge.tsx` - Uses `isInOptimalSeason()`

### Scoring System
- ⚠️ `apps/api/src/search/domain/services/strategies/seasonality-scoring.strategy.ts` - Currently uses FORMAT 1

## Migration Plan (Future)

When stats are recalculated to use FORMAT 2:

1. **Update Database Schema** (if needed)
   - No schema change required (both formats use `Int[]`)

2. **Update Domain Layer**
   - Add format detection to `Seasonality` value object
   - Implement score-based evaluation methods
   - Maintain backwards compatibility

3. **Update Scoring Strategy**
   - Modify `SeasonalityScoringStrategy` to handle scores
   - Update scoring algorithm to use monthly scores

4. **Update Frontend**
   - Implement score-based season detection
   - Update UI to show quality indicators (⭐⭐⭐)
   - Add monthly breakdown view (optional)

5. **Data Migration**
   - Run script to recalculate all seasonality data
   - Generate 12-month scores based on:
     - Historical weather data
     - Route ascent patterns
     - Community ratings
     - Expert knowledge

## Common Pitfalls

### ❌ INCORRECT Interpretation
```typescript
// WRONG: Assuming array contains BAD months
if (!seasonality.includes(currentMonth)) {
  return true // "Not in array = good month"
}
```

### ✅ CORRECT Interpretation
```typescript
// CORRECT: Array contains GOOD months
if (seasonality.includes(currentMonth)) {
  return true // "In array = good month"
}
```

## Related Documentation

- Database Schema: `packages/crags/infrastructure/persistence/prisma/crag.model.prisma`
- Domain Logic: `packages/crags/domain/value-objects/seasonality.vo.ts`
- Frontend Logic: `apps/mobile-app/src/utils/cragHelpers.ts`
- Scoring: `apps/api/src/search/domain/services/strategies/seasonality-scoring.strategy.ts`

## Questions?

If you're unsure about the format:
1. Check the array length: `length < 12` → likely FORMAT 1
2. Check values: all values `<= 12` → likely FORMAT 1
3. Check values: some values `> 12` → likely FORMAT 2 (scores)
4. Refer to this document for clarification

---

**Last Updated:** 2025-01-17  
**Format Version:** FORMAT 1 (Legacy - Month Numbers)  
**Status:** Production - Active
