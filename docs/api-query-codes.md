# API Query Parameter Codes

## Overview

This document defines compact numeric codes for ALL API query parameters to minimize
request payload size. All agents MUST use these codes when making API requests.

**Principles:**

- Parameter names are abbreviated (e.g., `gradeSystem` → `gs`)
- ALL enum values use numeric codes (no strings in requests)
- Grade ranges use universal grade index (10-46)
- Distance values are numeric with unit code
- Backward compatibility maintained during migration

---

## Quick Reference Table

| Parameter         | Short | Type   | Values              |
| ----------------- | ----- | ------ | ------------------- |
| latitude          | `lat` | number | Decimal (-90 to 90) |
| longitude         | `lng` | number | Decimal (-180..180) |
| radius            | `r`   | number | Numeric value       |
| distanceUnit      | `du`  | number | 1=km, 2=mi          |
| minGrade          | `gmin`| number | Grade index (10-46) |
| maxGrade          | `gmax`| number | Grade index (10-46) |
| gradeSystem       | `gs`  | number | 1-6                 |
| seasonPreference  | `sp`  | number | 0-2                 |
| exposurePreference| `ep`  | number | 0-2                 |
| limit             | `l`   | number | Integer             |
| weather           | `w`   | number | 1-7                 |
| crowd             | `cr`  | number | 1-4                 |
| walkTime          | `wt`  | number | 1-7                 |
| aspect            | `asp` | number | 1-8                 |
| family            | `fam` | number | 0-2                 |
| style             | `st`  | number | 1-8                 |

---

## Enum Codes

### Distance Unit (`du`)

| Code | Value      | Description |
| ---- | ---------- | ----------- |
| 1    | km         | Kilometers  |
| 2    | mi         | Miles       |

**Default:** `1` (kilometers)

**Conversion:** 1 mile = 1.60934 km

---

### Grade System (`gs`)

| Code | Value   | Example       |
| ---- | ------- | ------------- |
| 1    | french  | 6a, 7b+, 8c   |
| 2    | yds     | 5.10a, 5.12d  |
| 3    | uiaa    | VI, VII+, IX  |
| 4    | british | E1, HVS, E5   |
| 5    | font    | 6A, 7C+       |
| 6    | hueco   | V0, V5, V10   |

**Default:** `1` (french)

---

### Season Preference (`sp`)

| Code | Value  | Months   |
| ---- | ------ | -------- |
| 0    | any    | All      |
| 1    | summer | Jun-Sep  |
| 2    | winter | Dec-Mar  |

**Default:** `0` (any)

---

### Exposure Preference (`ep`) - Sun/Shadow

| Code | Value | Description          |
| ---- | ----- | -------------------- |
| 0    | any   | No preference        |
| 1    | sun   | Prefer sunny sectors |
| 2    | shade | Prefer shaded sectors|

**Default:** `0` (any)

---

### Weather Condition (`w`)

| Code | Value           | Description         |
| ---- | --------------- | ------------------- |
| 1    | ALL_DAY_SUN     | Sol todo el día     |
| 2    | MORNING_SUN     | Sol mañana          |
| 3    | NOON_SUN        | Sol mediodía        |
| 4    | AFTERNOON_SUN   | Sol tarde           |
| 5    | ALL_DAY_SHADE   | Sombra todo el día  |
| 6    | MORNING_SHADE   | Sombra mañana       |
| 7    | AFTERNOON_SHADE | Sombra tarde        |

---

### Crowd Level (`cr`)

| Code | Value    | Description    |
| ---- | -------- | -------------- |
| 1    | DESERTED | Desierto       |
| 2    | QUIET    | Tranquilo      |
| 3    | BUSY     | Concurrido     |
| 4    | CROWDED  | Muy concurrido |

---

### Walk-in Time (`wt`)

| Code | Value             | Description |
| ---- | ----------------- | ----------- |
| 1    | UNDER_5_MIN       | < 5 min     |
| 2    | FROM_5_TO_10_MIN  | 5-10 min    |
| 3    | FROM_10_TO_20_MIN | 10-20 min   |
| 4    | FROM_20_TO_30_MIN | 20-30 min   |
| 5    | FROM_30_TO_45_MIN | 30-45 min   |
| 6    | FROM_45_TO_60_MIN | 45-60 min   |
| 7    | OVER_60_MIN       | > 60 min    |

---

### Aspect Direction (`asp`)

| Code | Value |
| ---- | ----- |
| 1    | N     |
| 2    | NE    |
| 3    | E     |
| 4    | SE    |
| 5    | S     |
| 6    | SW    |
| 7    | W     |
| 8    | NW    |

---

### Family Friendly (`fam`)

| Code | Value            | Description      |
| ---- | ---------------- | ---------------- |
| 0    | any              | No preference    |
| 1    | KID_FRIENDLY     | Apto niños       |
| 2    | NOT_KID_FRIENDLY | No apto niños    |

---

### Climbing Style (`st`)

| Code | Value    |
| ---- | -------- |
| 1    | SLAB     |
| 2    | VERTICAL |
| 3    | OVERHANG |
| 4    | ROOF     |
| 5    | CRACK    |
| 6    | ARETE    |
| 7    | CORNER   |
| 8    | CHIMNEY  |

---

## Universal Grade Index

### Full Grade Table

| Index | French | YDS       | UIAA      | Category |
| ----- | ------ | --------- | --------- | -------- |
| 10    | 3      | 5.3       | III       | easy     |
| 11    | 3+     | 5.4       | III+      | easy     |
| 12    | 4a     | 5.5       | IV-       | easy     |
| 13    | 4a+    | 5.5+      | IV        | easy     |
| 14    | 4b     | 5.6       | IV+       | easy     |
| 15    | 4b+    | 5.7       | V-        | easy     |
| 16    | 4c     | 5.7+      | V         | easy     |
| 17    | 4c+    | 5.8       | V+        | easy     |
| 18    | 5a     | 5.8+      | V+/VI-    | easy     |
| 19    | 5a+    | 5.9       | VI-       | easy     |
| 20    | 5b     | 5.9+      | VI-       | easy     |
| 21    | 5b+    | 5.10a     | VI        | easy     |
| 22    | 5c     | 5.10b     | VI+       | easy     |
| 23    | 5c+    | 5.10c     | VI+/VII-  | easy     |
| **24**| **6a** | 5.10c/d   | VII-      | **medium** |
| 25    | 6a+    | 5.10d     | VII       | medium   |
| 26    | 6b     | 5.11a     | VII+      | medium   |
| 27    | 6b+    | 5.11b     | VII+/VIII-| medium   |
| 28    | 6c     | 5.11c     | VIII-     | medium   |
| 29    | 6c+    | 5.11d     | VIII      | medium   |
| **30**| **7a** | 5.11d/12a | VIII+     | **hard** |
| 31    | 7a+    | 5.12a     | VIII+/IX- | hard     |
| 32    | 7b     | 5.12b     | IX-       | hard     |
| 33    | 7b+    | 5.12c     | IX        | hard     |
| 34    | 7c     | 5.12d     | IX+       | hard     |
| 35    | 7c+    | 5.13a     | IX+/X-    | hard     |
| **36**| **8a** | 5.13b     | X-        | **extreme** |
| 37    | 8a+    | 5.13c     | X         | extreme  |
| 38    | 8b     | 5.13d     | X+        | extreme  |
| 39    | 8b+    | 5.14a     | X+/XI-    | extreme  |
| 40    | 8c     | 5.14b     | XI-       | extreme  |
| 41    | 8c+    | 5.14c     | XI        | extreme  |
| 42    | 9a     | 5.14d     | XI+       | extreme  |
| 43    | 9a+    | 5.15a     | XI+/XII-  | extreme  |
| 44    | 9b     | 5.15b     | XII-      | extreme  |
| 45    | 9b+    | 5.15c     | XII       | extreme  |
| 46    | 9c     | 5.15d     | XII+      | extreme  |

### Category Thresholds

| Category | Index Range | French     |
| -------- | ----------- | ---------- |
| easy     | 10-23       | 3 to 5c+   |
| medium   | 24-29       | 6a to 6c+  |
| hard     | 30-35       | 7a to 7c+  |
| extreme  | 36-46       | 8a to 9c   |

---

## Request Examples

### Crag Search

**Before (verbose):**

```
GET /api/search/crags?latitude=41.7&longitude=1.8&radiusKm=50&minGrade=6a&maxGrade=7b&gradeSystem=french&seasonPreference=summer&limit=20
```

**140 bytes**

**After (compact):**

```
GET /api/search/crags?lat=41.7&lng=1.8&r=50&du=1&gmin=24&gmax=32&gs=1&sp=1&l=20
```

**78 bytes (44% smaller)**

### With Miles

```
GET /api/search/crags?lat=41.7&lng=1.8&r=30&du=2&gmin=24&gmax=32&gs=1&sp=0&ep=1&l=20
```

- `r=30` → 30 miles
- `du=2` → miles unit
- Backend converts: 30 × 1.60934 = 48.28 km

### Sector Routes

**Before:**

```
GET /api/sectors/abc123/routes?gradeSystem=french
```

**After:**

```
GET /api/sectors/abc123/routes?gs=1
```

---

## Backend Implementation

### Files

- `packages/shared/constants/query-codes.ts` - All code constants
- `packages/shared/utils/query-parser.ts` - Parser functions

### Usage in Controller

```typescript
import {
  parseLatitude,
  parseLongitude,
  parseRadiusToKm,
  parseGradeIndex,
  parseGradeSystem,
  parseSeasonPreference,
  parseExposurePreference,
  parseNumber,
  QueryParam,
} from '@shared'

@Get('/crags')
async searchCrags(ctx: Context) {
  const q = ctx.query as Record<string, string>

  // Parse with short names first, fallback to legacy
  const latitude = parseLatitude(q[QueryParam.LATITUDE] ?? q.latitude)
  const longitude = parseLongitude(q[QueryParam.LONGITUDE] ?? q.longitude)
  const radiusKm = parseRadiusToKm(
    q[QueryParam.RADIUS] ?? q.radiusKm,
    q[QueryParam.DISTANCE_UNIT] ?? q.distanceUnit
  )
  const minGradeIndex = parseGradeIndex(q[QueryParam.MIN_GRADE] ?? q.minGrade, 'gmin')
  const maxGradeIndex = parseGradeIndex(q[QueryParam.MAX_GRADE] ?? q.maxGrade, 'gmax')
  const gradeSystem = parseGradeSystem(q[QueryParam.GRADE_SYSTEM] ?? q.gradeSystem)
  const seasonPreference = parseSeasonPreference(q[QueryParam.SEASON] ?? q.seasonPreference)
  const exposurePreference = parseExposurePreference(q[QueryParam.EXPOSURE])
  const limit = parseNumber(q[QueryParam.LIMIT] ?? q.limit, 20)

  // Create domain objects
  const coords = Coordinates.createFrom(latitude, longitude)
  const gradeRange = GradeRange.create(minGradeIndex, maxGradeIndex)

  // ... rest of implementation
}
```

---

## Mobile App Implementation

### File: `apps/mobile-app/src/constants/query-codes.ts`

```typescript
// Distance Unit
export const DistanceUnitCode = {
  KILOMETERS: 1,
  MILES: 2,
} as const

// Grade System
export const GradeSystemCode = {
  FRENCH: 1,
  YDS: 2,
  UIAA: 3,
  BRITISH: 4,
  FONT: 5,
  HUECO: 6,
} as const

// Season
export const SeasonCode = {
  ANY: 0,
  SUMMER: 1,
  WINTER: 2,
} as const

// Exposure
export const ExposureCode = {
  ANY: 0,
  SUN: 1,
  SHADE: 2,
} as const

// Grade Index bounds
export const GradeIndex = {
  MIN: 10,
  MAX: 46,
} as const
```

### Build Query Function

```typescript
import { DistanceUnitCode, GradeSystemCode, SeasonCode, ExposureCode } from '../constants/query-codes'

interface SearchParams {
  latitude: number
  longitude: number
  radius: number
  distanceUnit: 1 | 2
  minGradeIndex: number
  maxGradeIndex: number
  gradeSystemCode: number
  seasonCode?: number
  exposureCode?: number
  limit?: number
}

export function buildSearchQuery(params: SearchParams): string {
  const query = new URLSearchParams({
    lat: params.latitude.toString(),
    lng: params.longitude.toString(),
    r: params.radius.toString(),
    du: params.distanceUnit.toString(),
    gmin: params.minGradeIndex.toString(),
    gmax: params.maxGradeIndex.toString(),
    gs: params.gradeSystemCode.toString(),
  })

  if (params.seasonCode !== undefined) {
    query.set('sp', params.seasonCode.toString())
  }
  if (params.exposureCode !== undefined) {
    query.set('ep', params.exposureCode.toString())
  }
  if (params.limit) {
    query.set('l', params.limit.toString())
  }

  return query.toString()
}
```

---

## Migration Checklist

### Backend

- [x] Create `packages/shared/constants/query-codes.ts`
- [x] Create `packages/shared/utils/query-parser.ts`
- [x] Export from `packages/shared/index.ts`
- [ ] Update `SearchController` to use parsers
- [ ] Update sector routes endpoint
- [ ] Add unit tests for all parsers

### Mobile App

- [ ] Create `apps/mobile-app/src/constants/query-codes.ts`
- [ ] Update `cragSearch.ts` to use codes
- [ ] Update `sectorApi.ts` to use codes
- [ ] Update user settings to store unit preference
- [ ] Test all API calls

---

## Rules

### DO

- ✅ Use numeric codes for ALL enums
- ✅ Use grade index (10-46) for grade ranges
- ✅ Use distance unit code with radius
- ✅ Support both short and long param names in backend
- ✅ Validate all numeric ranges

### DO NOT

- ❌ Change existing code values
- ❌ Use string values in new code
- ❌ Send grade strings like "6a" (use index 24)
- ❌ Skip unit code when sending radius
- ❌ Skip validation of numeric ranges
