# Routes Feature

## Overview

The Routes package handles climbing route data management, including route information, grades, styles, and quality metrics. Routes are the core climbing content that belong to sectors and crags.

## Architecture

```
packages/routes/
├── domain/
│   ├── entities/
│   │   └── route.entity.ts       # Route aggregate root
│   ├── value-objects/
│   │   ├── style-flags.vo.ts     # Climbing style bitmask
│   │   ├── stars.vo.ts           # Quality rating (0-3)
│   │   ├── grade-band.vo.ts      # Universal grade index
│   │   └── ...
│   └── dtos/
│       ├── route-create.dto.ts   # Input for creating routes
│       └── route-response.dto.ts # API response format
├── application/
│   └── mappers/
│       └── route-to-response.mapper.ts
└── infrastructure/
    └── persistence/
        └── prisma/
            └── route.model.prisma
```

## StyleFlags System

Routes use a bitmask-based style system to efficiently store multiple climbing styles.

### ClimbingStyle Enum Values

| Style    | Bit Value | Description           |
|----------|-----------|----------------------|
| SPORT    | 1         | Sport climbing       |
| TRAD     | 2         | Traditional climbing |
| BOULDER  | 4         | Bouldering           |
| AID      | 8         | Aid climbing         |
| ALPINE   | 16        | Alpine climbing      |
| MIXED    | 32        | Mixed climbing       |
| ICE      | 64        | Ice climbing         |
| TOP_ROPE | 128       | Top rope only        |

### Example Combinations

- Sport only: `styleFlags = 1`
- Sport + Trad: `styleFlags = 3` (1 + 2)
- Sport + Trad + Boulder: `styleFlags = 7` (1 + 2 + 4)
- All styles: `styleFlags = 255`

## Available Services/Classes

| Service/Class | Purpose | Location |
|--------------|---------|----------|
| `Route` | Route entity (aggregate root) | `packages/routes/domain/entities/route.entity.ts` |
| `StyleFlags` | Climbing style bitmask VO | `packages/routes/domain/value-objects/style-flags.vo.ts` |
| `RouteToResponseMapper` | Entity to API DTO mapper | `packages/routes/application/mappers/route-to-response.mapper.ts` |

## Public API

### `StyleFlags`

Value object for managing climbing style flags using a bitmask.

#### `StyleFlags.createFrom(value: number | null): StyleFlags`

Create from numeric bitmask (from database).

```typescript
const flags = StyleFlags.createFrom(3) // Sport + Trad
flags.isSport() // true
flags.isTrad() // true
flags.isBoulder() // false
```

#### `StyleFlags.createFromData(data: StyleFlagsData): StyleFlags`

Create from scraper data format (IsSport, IsTrad, etc.).

```typescript
const flags = StyleFlags.createFromData({
  IsSport: 1,
  IsTrad: 1,
  IsBoulder: 0,
})
flags.getValue() // 3
```

#### `StyleFlags.createFromBooleans(...): StyleFlags`

Create from individual boolean values.

```typescript
const flags = StyleFlags.createFromBooleans(
  true,  // sport
  true,  // trad
  false, // boulder
  false, // aid
  false, // alpine
  false, // mixed
  false, // ice
  false, // topRope
)
```

#### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getValue()` | `number` | Raw bitmask value (for database) |
| `isSport()` | `boolean` | Check if sport style is set |
| `isTrad()` | `boolean` | Check if trad style is set |
| `isBoulder()` | `boolean` | Check if boulder style is set |
| `isAid()` | `boolean` | Check if aid style is set |
| `isAlpine()` | `boolean` | Check if alpine style is set |
| `isMixed()` | `boolean` | Check if mixed style is set |
| `isIce()` | `boolean` | Check if ice style is set |
| `isTopRope()` | `boolean` | Check if top rope style is set |
| `hasStyle(style)` | `boolean` | Check if specific style is set |
| `getPrimaryStyle()` | `string` | Get primary style label |
| `getActiveStyles()` | `string[]` | Get all active style labels |
| `getStyleCount()` | `number` | Count of active styles |
| `isMultiStyle()` | `boolean` | Whether route has multiple styles |
| `isEmpty()` | `boolean` | Whether no styles are set |

## Usage Examples

### Creating a Route with Style Flags

```typescript
import { Route } from '@routes/domain/entities'
import type { RouteCreateDto } from '@routes/domain/dtos'

const dto: RouteCreateDto = {
  id: 'route-123',
  externalId: 'ext-456',
  name: 'La Dura Dura',
  gradeBand: 52, // 9b+
  cragId: 'crag-789',
  styleFlags: 1, // Sport climbing
}

const route = Route.create(dto)
route.isSport() // true
route.getStyleFlags().getPrimaryStyle() // 'Sport'
```

### Converting Route to API Response

```typescript
import { RouteToResponseMapper } from '@routes/application/mappers'

const route = await routeRepository.findById(routeId)
const response = RouteToResponseMapper.toResponseDto(route, 'french')

// Response includes:
// - styleFlags: 1
// - primaryStyle: 'Sport'
// - gradeLabel: '9b+'
// - gradeCategory: 'extreme'
```

### Decoding Style Flags in Stats Calculation

```typescript
import { ClimbingStyle } from '@routes/domain/value-objects'

const isSport = (route.styleFlags & ClimbingStyle.SPORT) !== 0
const isTrad = (route.styleFlags & ClimbingStyle.TRAD) !== 0
const isBoulder = (route.styleFlags & ClimbingStyle.BOULDER) !== 0
```

## Database Schema

The Route model stores style as a single integer bitmask:

```prisma
model Route {
  // ... other fields
  
  // Style (bitmask for efficient filtering)
  // Bit 0 (1): Sport, Bit 1 (2): Trad, Bit 2 (4): Boulder
  // Bit 3 (8): Aid, Bit 4 (16): Alpine, Bit 5 (32): Mixed
  // Bit 6 (64): Ice, Bit 7 (128): TopRope
  styleFlags Int @default(0)
  
  @@index([styleFlags])
}
```

### Querying by Style

```sql
-- Find all sport routes
SELECT * FROM Route WHERE styleFlags & 1 != 0

-- Find sport + trad routes
SELECT * FROM Route WHERE styleFlags & 3 = 3

-- Find routes that are sport OR trad
SELECT * FROM Route WHERE styleFlags & 3 != 0
```

## DO NOT Duplicate

**IMPORTANT: The following functionality already exists. DO NOT recreate:**

- ❌ Style flag encoding/decoding - use `StyleFlags` value object
- ❌ Primary style detection - use `StyleFlags.getPrimaryStyle()`
- ❌ Style counting - use `StyleFlags.getStyleCount()`
- ❌ Route-to-response mapping - use `RouteToResponseMapper`
- ❌ Grade conversion - see `docs/features/grades/README.md`

## Related Documentation

- `docs/features/grades/README.md` - Grade conversion and categories
- `packages/sectors/domain/services/sector-stats-calculator.service.ts` - Uses style flags for stats
