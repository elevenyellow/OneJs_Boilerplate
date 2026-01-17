# Ascents Feature

## Overview

The Ascents feature allows users to log their climbing ascents and retrieve statistics about their climbing activity. The API uses compact numeric payloads where values are encoded as integers, and the frontend is responsible for decoding them using the provided mappings.

## Architecture

```
Mobile App                    API                         Database
    |                          |                              |
    |-- POST /api/ascents ---->|                              |
    |   Header: X-User-Id      |-- CreateAscentUseCase ------>|
    |   Body: numeric payload  |                              |
    |                          |   Ascent.create()            |
    |<-------------------------|<-----------------------------|
    |                          |                              |
    |-- GET /api/ascents/stats |                              |
    |   Header: X-User-Id      |-- GetUserStatsUseCase ------>|
    |                          |                              |
    |<-- { stats }             |<-----------------------------|
```

## Available Services/Classes

| Service/Class | Purpose | Location |
|---------------|---------|----------|
| `Ascent` | Domain entity for ascent | `packages/ascents/domain/entities/ascent.entity.ts` |
| `CreateAscentUseCase` | Create a new ascent | `packages/ascents/application/use-cases/create-ascent.use-case.ts` |
| `GetUserStatsUseCase` | Get user statistics | `packages/ascents/application/use-cases/get-user-stats.use-case.ts` |
| `AscentPrismaRepository` | Persistence layer | `packages/ascents/infrastructure/persistence/prisma/ascent.repository.ts` |
| `AscentsController` | HTTP endpoints | `apps/api/src/ascents/controllers/ascents.controller.ts` |

## Numeric Mappings

All values are stored as integers for compact API payloads. Import from `@ascents`:

### Ascent Style

| Value | Label | Constant |
|-------|-------|----------|
| 0 | onsight | `ASCENT_STYLE.ONSIGHT` |
| 1 | flash | `ASCENT_STYLE.FLASH` |
| 2 | redpoint | `ASCENT_STYLE.REDPOINT` |
| 3 | go | `ASCENT_STYLE.GO` |
| 4 | toprope | `ASCENT_STYLE.TOPROPE` |

### Grade Evaluation

| Value | Label | Constant |
|-------|-------|----------|
| 0 | soft | `GRADE_EVALUATION.SOFT` |
| 1 | normal | `GRADE_EVALUATION.NORMAL` |
| 2 | hard | `GRADE_EVALUATION.HARD` |

### Wall Type

| Value | Label | Constant |
|-------|-------|----------|
| 0 | slab | `WALL_TYPE.SLAB` |
| 1 | vertical | `WALL_TYPE.VERTICAL` |
| 2 | overhang | `WALL_TYPE.OVERHANG` |
| 3 | roof | `WALL_TYPE.ROOF` |
| null | none | - |

### Characteristics (Bitmask)

Combine flags with bitwise OR (`|`):

| Flag | Label | Constant |
|------|-------|----------|
| 1 | cruxy | `CHARACTERISTIC.CRUXY` |
| 2 | athletic | `CHARACTERISTIC.ATHLETIC` |
| 4 | slopers | `CHARACTERISTIC.SLOPERS` |
| 8 | endurance | `CHARACTERISTIC.ENDURANCE` |
| 16 | technical | `CHARACTERISTIC.TECHNICAL` |
| 32 | crimpy | `CHARACTERISTIC.CRIMPY` |

Example: `cruxy + athletic + crimpy = 1 | 2 | 32 = 35`

### Safety Concerns (Bitmask)

| Flag | Label | Constant |
|------|-------|----------|
| 1 | looseRock | `SAFETY_CONCERN.LOOSE_ROCK` |
| 2 | highFirstBolt | `SAFETY_CONCERN.HIGH_FIRST_BOLT` |
| 4 | badBolts | `SAFETY_CONCERN.BAD_BOLTS` |
| 8 | badAnchor | `SAFETY_CONCERN.BAD_ANCHOR` |

### Grade Band

| Value | Label | Constant |
|-------|-------|----------|
| 1 | beginner | `GRADE_BAND.BEGINNER` |
| 2 | intermediate | `GRADE_BAND.INTERMEDIATE` |
| 3 | advanced | `GRADE_BAND.ADVANCED` |
| 4 | expert | `GRADE_BAND.EXPERT` |
| 5 | elite | `GRADE_BAND.ELITE` |

## Public API

### POST /api/ascents

Create a new ascent.

**Headers:**
- `X-User-Id`: User identifier (optional, defaults to `mock-user-1`)

**Request Body:**

```json
{
  "routeId": "uuid-of-the-route",
  "style": 2,
  "gradeBand": 3,
  "gradeEvaluation": 1,
  "wallType": 2,
  "characteristics": 25,
  "safetyConcerns": 0,
  "quality": 4,
  "tries": 3,
  "isRepeat": false,
  "comments": "Great route!",
  "ascentDate": "2025-01-16T10:00:00Z"
}
```

**Response (201 Created):**

```json
{
  "ascent": {
    "id": "generated-uuid",
    "userId": "mock-user-1",
    "routeId": "uuid-of-the-route",
    "style": 2,
    "gradeBand": 3,
    "gradeEvaluation": 1,
    "wallType": 2,
    "characteristics": 25,
    "safetyConcerns": 0,
    "quality": 4,
    "tries": 3,
    "isRepeat": false,
    "comments": "Great route!",
    "ascentDate": "2025-01-16T10:00:00.000Z",
    "createdAt": "2025-01-16T12:00:00.000Z"
  }
}
```

### GET /api/ascents/stats

Get user ascent statistics.

**Headers:**
- `X-User-Id`: User identifier (optional, defaults to `mock-user-1`)

**Response (200 OK):**

```json
{
  "stats": {
    "totalAscents": 42,
    "byGradeBand": {
      "1": 5,
      "2": 12,
      "3": 15,
      "4": 8,
      "5": 2
    },
    "byStyle": {
      "0": 3,
      "1": 8,
      "2": 25,
      "3": 4,
      "4": 2
    }
  }
}
```

## Usage Examples

### Creating an Ascent (Frontend)

```typescript
import {
  ASCENT_STYLE,
  GRADE_EVALUATION,
  WALL_TYPE,
  CHARACTERISTIC,
  SAFETY_CONCERN,
} from '@ascents'

const payload = {
  routeId: route.id,
  style: ASCENT_STYLE.REDPOINT,
  gradeBand: route.gradeBand,
  gradeEvaluation: GRADE_EVALUATION.NORMAL,
  wallType: WALL_TYPE.OVERHANG,
  characteristics: CHARACTERISTIC.CRUXY | CHARACTERISTIC.TECHNICAL,
  safetyConcerns: SAFETY_CONCERN.LOOSE_ROCK,
  quality: 4,
  tries: 2,
  isRepeat: false,
  comments: 'Amazing route!',
  ascentDate: new Date().toISOString(),
}

const response = await fetch('/api/ascents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  },
  body: JSON.stringify(payload),
})
```

### Decoding Stats (Frontend)

```typescript
import { ASCENT_STYLE_LABELS, GRADE_BAND_LABELS } from '@ascents'

const stats = await fetchStats()

// Decode gradeBand stats
const gradeBandStats = Object.entries(stats.byGradeBand).map(([key, count]) => ({
  label: GRADE_BAND_LABELS[Number(key)],
  count,
}))

// Decode style stats
const styleStats = Object.entries(stats.byStyle).map(([key, count]) => ({
  label: ASCENT_STYLE_LABELS[Number(key)],
  count,
}))
```

### Using Value Objects (Backend)

```typescript
import { Ascent, AscentStyle, Characteristics } from '@ascents'

// Create ascent entity
const ascent = Ascent.create({
  userId: 'user-123',
  routeId: 'route-456',
  style: 2, // Will be converted to AscentStyle value object
  gradeBand: 3,
  gradeEvaluation: 1,
  wallType: 2,
  characteristics: 25,
  safetyConcerns: 0,
  quality: 4,
  tries: 2,
  isRepeat: false,
  ascentDate: new Date(),
})

// Access via value objects
console.log(ascent.getStyle().getLabel()) // 'redpoint'
console.log(ascent.getCharacteristics().getLabels()) // ['cruxy', 'endurance', 'technical']
```

## DO NOT Duplicate

**IMPORTANT: The following functionality already exists. DO NOT recreate:**

- Grade band values and labels - use `GRADE_BAND` from `@ascents/domain/mappings`
- Ascent style encoding - use `ASCENT_STYLE` from `@ascents/domain/mappings`
- Bitmask operations for characteristics - use `Characteristics.fromFlags()` or `Characteristics.createFrom()`
- User stats calculation - use `GetUserStatsUseCase`
- Ascent validation - use `Ascent.create()` which validates all inputs

## Related Documentation

- `packages/routes/domain/value-objects/grade-band.vo.ts` - GradeBand value object in routes
- `apps/mobile-app/src/components/logbook/types.ts` - Frontend form types (reference only)
