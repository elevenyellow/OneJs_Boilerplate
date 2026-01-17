# Grading System Feature Documentation

> **MANDATORY**: Read this document before implementing ANY grade-related functionality.

## Overview

The grading system provides a unified way to handle climbing route grades across multiple international grading systems. It uses a **Universal Grade Index** (integer 10-52+) as the internal representation, allowing seamless conversion between systems.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INPUT (Raw Grade String)                      │
│                     "7a+", "5.12a", "V5", "E3", etc.                 │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GradeSystemDetector.detect()                    │
│  Identifies: french, yds, uiaa, british, font, hueco                │
│  Returns: { system, confidence, normalizedValue }                    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GradeConverter.toIndex()                        │
│  Converts normalized grade → Universal Index (10-52+)               │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STORAGE (Universal Index)                       │
│                  route.gradeBand = 31 (e.g., 7a+)                   │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     OUTPUT (User's Preferred System)                 │
│                                                                      │
│  GradeConverter.fromIndex(31, 'yds') → "5.12a"                      │
│  getGradeCategory(31) → "hard"                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Package Location

```
packages/grades/
├── domain/
│   ├── services/
│   │   ├── grade-converter.ts        # Grade conversion between systems
│   │   ├── grade-system-detector.ts  # Auto-detect grade system
│   │   └── grade-category.ts         # Category calculation (easy/medium/hard/extreme)
│   ├── tables/
│   │   ├── french.table.ts           # French grade → index mapping
│   │   ├── yds.table.ts              # YDS grade → index mapping
│   │   ├── uiaa.table.ts             # UIAA grade → index mapping
│   │   ├── british.table.ts          # British grade → index mapping
│   │   ├── font.table.ts             # Font (bouldering) → index mapping
│   │   └── hueco.table.ts            # Hueco/V-scale → index mapping
│   ├── types/
│   │   └── grade-systems.types.ts    # Type definitions
│   └── value-objects/
│       └── normalized-grade.vo.ts    # NormalizedGrade value object
└── index.ts                          # Package exports
```

## Available Services

### 1. GradeConverter

**Purpose**: Convert grades between different grading systems using the universal index.

**Location**: `packages/grades/domain/services/grade-converter.ts`

**Import**: `import { GradeConverter } from '@grades'`

**Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `toIndex` | `(grade: string, system: GradeSystem)` | `number \| null` | Convert grade string to universal index |
| `fromIndex` | `(index: number, system: GradeSystem)` | `string \| null` | Convert universal index to grade string |
| `convert` | `(grade: string, from: GradeSystem, to: GradeSystem)` | `string \| null` | Convert grade between two systems |
| `getAllEquivalents` | `(grade: string, system: GradeSystem)` | `GradeEquivalents` | Get all system equivalents for a grade |
| `getEquivalentsFromIndex` | `(index: number)` | `GradeEquivalents` | Get all equivalents from index |
| `getDisplayGrade` | `(grade: string, from: GradeSystem, preferred: GradeSystem)` | `string` | Get display string for user's system |

**Example**:
```typescript
import { GradeConverter } from '@grades'

// Convert French grade to index
const index = GradeConverter.toIndex('7a+', 'french') // Returns 31

// Convert index to YDS
const yds = GradeConverter.fromIndex(31, 'yds') // Returns "5.12a"

// Direct conversion
const converted = GradeConverter.convert('7a+', 'french', 'yds') // Returns "5.12a"

// Get all equivalents
const equivalents = GradeConverter.getAllEquivalents('7a+', 'french')
// Returns: { french: '7a+', yds: '5.12a', uiaa: 'VIII', british: 'E4', font: '7A+', hueco: 'V6' }
```

### 2. GradeSystemDetector

**Purpose**: Automatically detect which grading system a grade string uses.

**Location**: `packages/grades/domain/services/grade-system-detector.ts`

**Import**: `import { GradeSystemDetector } from '@grades'`

**Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `detect` | `(rawGrade: string)` | `DetectionResult` | Auto-detect system from grade string |
| `isValidForSystem` | `(grade: string, system: GradeSystem)` | `boolean` | Check if grade matches system pattern |

**DetectionResult**:
```typescript
interface DetectionResult {
  system: GradeSystem        // Detected system
  confidence: 'exact' | 'pattern' | 'fallback'  // Detection confidence
  normalizedValue: string    // Normalized grade string
}
```

**Example**:
```typescript
import { GradeSystemDetector } from '@grades'

// Detect French grade
const result = GradeSystemDetector.detect('7a+')
// { system: 'french', confidence: 'exact', normalizedValue: '7a+' }

// Detect YDS grade
const yds = GradeSystemDetector.detect('5.12a')
// { system: 'yds', confidence: 'pattern', normalizedValue: '5.12a' }

// Detect Hueco/V-scale
const hueco = GradeSystemDetector.detect('V5')
// { system: 'hueco', confidence: 'exact', normalizedValue: 'V5' }
```

### 3. getGradeCategory

**Purpose**: Calculate difficulty category for UI display (colors, filters).

**Location**: `packages/grades/domain/services/grade-category.ts`

**Import**: `import { getGradeCategory } from '@grades'`

**Categories and Thresholds**:

| Category | Index Range | French Equivalent | UI Color |
|----------|-------------|-------------------|----------|
| `easy` | 0-23 | 3 to 5c+ | Green |
| `medium` | 24-29 | 6a to 6c+ | Yellow |
| `hard` | 30-35 | 7a to 7c+ | Red |
| `extreme` | 36+ | 8a and above | Purple |

**Example**:
```typescript
import { getGradeCategory } from '@grades'

getGradeCategory(20)  // 'easy'
getGradeCategory(26)  // 'medium'
getGradeCategory(32)  // 'hard'
getGradeCategory(40)  // 'extreme'
getGradeCategory(null) // 'easy' (default for unknown)
```

### 4. NormalizedGrade (Value Object)

**Purpose**: Immutable value object representing a fully normalized grade with all conversions.

**Location**: `packages/grades/domain/value-objects/normalized-grade.vo.ts`

**Import**: `import { NormalizedGrade } from '@grades'`

**Factory Methods**:
- `NormalizedGrade.fromString(rawGrade, knownSystem?)` - Create from string
- `NormalizedGrade.fromJSON(data)` - Create from persisted data
- `NormalizedGrade.create(data)` - Create with pre-computed values
- `NormalizedGrade.unknown(original)` - Create unknown/invalid grade

**Instance Methods**:
- `toSystem(system)` - Get grade in specific system
- `display(preferredSystem?)` - Get display string
- `compareTo(other)` - Compare difficulty
- `isHarderThan(other)` / `isEasierThan(other)` - Comparison helpers
- `toJSON()` - Serialize for persistence

**Example**:
```typescript
import { NormalizedGrade } from '@grades'

const grade = NormalizedGrade.fromString('7a+')

grade.french  // '7a+'
grade.yds     // '5.12a'
grade.toSystem('uiaa')  // 'VIII'
grade.display('yds')    // '5.12a'

// Comparison
const other = NormalizedGrade.fromString('6c')
grade.isHarderThan(other)  // true
```

## Supported Grading Systems

| System | Type | Examples | Region |
|--------|------|----------|--------|
| `french` | Sport/Trad | 6a, 7b+, 8c | Europe (primary) |
| `yds` | Sport/Trad | 5.10a, 5.12d, 5.14b | USA |
| `uiaa` | Trad | VI, VII+, IX- | Europe (alpine) |
| `british` | Trad | E1, E5, HVS | UK |
| `font` | Bouldering | 6A, 7C+, 8B | Font (uppercase) |
| `hueco` | Bouldering | V0, V5, V12 | USA |

## Universal Grade Index Reference

The index ranges from approximately 10 (easiest routes) to 52+ (world's hardest):

| Index | French | YDS | Category |
|-------|--------|-----|----------|
| 10 | 3 | 5.3 | easy |
| 16 | 5a | 5.7 | easy |
| 22 | 5c | 5.9 | easy |
| 24 | 6a | 5.10a | medium |
| 27 | 6b | 5.10d | medium |
| 30 | 7a | 5.11d | hard |
| 33 | 7b+ | 5.12c | hard |
| 36 | 8a | 5.13b | extreme |
| 42 | 8c | 5.14c | extreme |
| 48 | 9b | 5.15b | extreme |

## Integration Points

### Where Grade Conversion Happens

1. **Data Ingestion (Scraping)**
   - `ScrapedDataToRouteMapper.calculateUniversalGradeIndex()`
   - Uses `GradeSystemDetector` + `GradeConverter` to convert incoming grades

2. **API Response (Output)**
   - `RouteToResponseMapper.convertGradeToUserSystem()`
   - Uses `GradeConverter.fromIndex()` to convert to user's preferred system

3. **Grade Distribution Building**
   - `GradeDistributionBuilder.buildGbRoutes()`
   - Should use `GradeSystemDetector` (currently has duplicate logic - needs refactor)

### Database Storage

Grades are stored as:
- `route.grade` - Original grade string (preserved for reference)
- `route.gradeBand` - Universal grade index (integer)

## DO NOT Duplicate

**⚠️ CRITICAL: Do NOT create new implementations of:**

- ❌ Grade-to-index conversion (use `GradeConverter.toIndex`)
- ❌ Index-to-grade conversion (use `GradeConverter.fromIndex`)
- ❌ Grade system detection (use `GradeSystemDetector.detect`)
- ❌ Grade category calculation (use `getGradeCategory`)
- ❌ Pattern matching for grade formats (use existing patterns in `GradeSystemDetector`)
- ❌ Grade comparison logic (use `NormalizedGrade` methods)

**If you need grade-related functionality:**
1. Check if it exists in `GradeConverter`, `GradeSystemDetector`, or `NormalizedGrade`
2. If not, extend the existing service rather than creating a new one
3. Document any new methods added

## Known Issues / TODOs

### Pending: GradeNormalizer Service

Complex grades need pre-processing before conversion:
- **Ranges**: "7c+/8a" → take upper value "8a"
- **Aid grades**: "6b A1+" → extract free grade "6b", store aid "A1+" separately

This is tracked in the plan: `~/.cursor/plans/grade_normalization_aid_marking_*.plan.md`

### Migration Scripts Exception

Migration scripts in `scripts/` may use Prisma directly because they are one-time operations.
However, for regular application operations, always use repositories.

Current migration scripts:
- `scripts/migrate-route-grade-bands.ts` - Migrates route.gradeBand to universal index
- `scripts/migrate-grade-distribution.ts` - Rebuilds gbRoutes/gbAscents for crags/sectors

## Usage Examples

### Converting User Input to Storage

```typescript
import { GradeSystemDetector, GradeConverter } from '@grades'

function calculateUniversalGradeIndex(gradeString: string): number {
  if (!gradeString) return 0
  
  const detection = GradeSystemDetector.detect(gradeString)
  const index = GradeConverter.toIndex(detection.normalizedValue, detection.system)
  
  return index ?? 0
}
```

### Converting Storage to User Display

```typescript
import { GradeConverter, getGradeCategory } from '@grades'

function formatGradeForUser(gradeIndex: number, userSystem: GradeSystem) {
  return {
    gradeLabel: GradeConverter.fromIndex(gradeIndex, userSystem) ?? 'Unknown',
    gradeCategory: getGradeCategory(gradeIndex),
  }
}
```

### Building Grade Statistics

```typescript
import { getGradeCategory } from '@grades'

function calculateGradeDistribution(routes: Route[]): GradeDistribution {
  const stats = { easy: 0, medium: 0, hard: 0, extreme: 0 }
  
  for (const route of routes) {
    const category = getGradeCategory(route.gradeBand)
    stats[category]++
  }
  
  return stats
}
```

## Related Documentation

- `docs/grading-systems.md` - User-facing grading systems reference (supported systems, UI integration)
- `docs/features/routes/README.md` - Route entity and storage
- `.cursor/rules/feature-documentation.mdc` - Documentation requirements
- `packages/grades/index.ts` - Package exports

---

**Document purpose**: This document is for **developers and AI agents** implementing grade-related features.
For user-facing documentation about supported grading systems, see `docs/grading-systems.md`.
