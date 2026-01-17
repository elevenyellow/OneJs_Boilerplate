# Grading Systems for Climbing Routes

This document describes the supported grading systems for displaying climbing route difficulties in the application.

## Overview

The application supports **6 international grading systems** for climbing routes. Users can select their preferred system in their profile settings, and all grade ranges will be displayed in that system.

**IMPORTANT:** All grading systems use a **unified index system** (indices 10-52+) internally. This ensures consistent grade conversion and comparison across systems.

## Supported Systems

### 1. French Sport Climbing (FRENCH) - Default

**Format:** `5a`, `6b+`, `7c`, etc.

**Range:** 3 to 9c (indices 10-46)

**Common grades:**
- Beginner: 4a - 5b (indices 12-20)
- Intermediate: 5c - 6b+ (indices 22-27)
- Advanced: 6c - 7b+ (indices 28-33)
- Expert: 7c - 8b+ (indices 34-39)
- Elite: 8c+ (indices 40+)

**Usage:** Most common system in Europe, especially in Spain, France, and Italy.

---

### 2. Yosemite Decimal System (YDS)

**Format:** `5.6`, `5.10a`, `5.12d`, etc.

**Range:** 5.2 to 5.15c (indices 10-46)

**Common grades:**
- Beginner: 5.5 - 5.8 (indices 14-20)
- Intermediate: 5.9 - 5.10d (indices 22-27)
- Advanced: 5.11a - 5.12d (indices 28-35)
- Expert: 5.13a - 5.14d (indices 36-43)
- Elite: 5.15a+ (indices 44+)

**Usage:** Standard system in the United States and Canada.

**Note:** Grades from 5.10 onwards use letter suffixes (a, b, c, d) for finer granularity.

---

### 3. UIAA Scale (UIAA)

**Format:** `IV`, `VI+`, `IX`, etc.

**Range:** III to XII (indices 10-46)

**Common grades:**
- Beginner: III - V (indices 10-18)
- Intermediate: V+ - VII (indices 20-26)
- Advanced: VII+ - IX (indices 28-34)
- Expert: IX+ - XI (indices 36-42)
- Elite: XI+ (indices 44+)

**Usage:** Used in Germany, Austria, Switzerland, and Eastern Europe.

**Note:** Uses Roman numerals with + and - modifiers.

---

### 4. British Adjectival (BRITISH)

**Format:** `M`, `VD`, `HVS`, `E1`, etc.

**Range:** M to E11 (indices 10-46)

**Common grades:**
- Beginner: M - S (indices 10-16)
- Intermediate: HS - VS (indices 18-20)
- Advanced: HVS - E3 (indices 24-30)
- Expert: E4 - E7 (indices 32-38)
- Elite: E8+ (indices 40+)

**Usage:** Used in the United Kingdom for trad climbing (adjectival grade).

**Note:** This is the adjectival grade (Moderate, Severe, E1, etc.), not the technical grade.

---

### 5. Fontainebleau (FONT) - Bouldering

**Format:** `6A`, `7C+`, etc.

**Range:** 3 to 8C+ (indices 10-52)

**Common grades:**
- Beginner: 3 - 5+ (indices 10-18)
- Intermediate: 6A - 6B+ (indices 20-24)
- Advanced: 6C - 7A+ (indices 26-32)
- Expert: 7B - 7C+ (indices 34-40)
- Elite: 8A+ (indices 42+)

**Usage:** Standard bouldering system in Europe.

**Note:** Uses uppercase letters (6A vs 6a) to distinguish from French sport grades.

---

### 6. Hueco V-Scale (HUECO) - Bouldering

**Format:** `V0`, `V5`, `V10`, etc.

**Range:** VB to V17 (indices 10-52)

**Common grades:**
- Beginner: VB - V1 (indices 10-18)
- Intermediate: V2 - V4 (indices 20-26)
- Advanced: V5 - V7 (indices 28-32)
- Expert: V8 - V11 (indices 34-40)
- Elite: V12+ (indices 42+)

**Usage:** Standard bouldering system in the United States.

**Note:** VB = "V-Basic", easier than V0.

---

## Implementation

### Architecture Overview

The grading system uses a **unified index system** across all components:

1. **Grade Tables** (`packages/grades/domain/tables/`): Define mappings from grade strings to universal indices
2. **GradeConverter** (`packages/grades/domain/services/grade-converter.ts`): Converts between systems using indices
3. **GradeDistributionBuilder** (`packages/the-crag/infrastructure/scraper/`): Builds `gbRoutes` arrays using universal indices
4. **GradeBands** (`packages/sectors/domain/value-objects/`): Displays grades from index arrays

### Backend (Domain Layer)

The grading system conversion uses `GradeConverter` internally:

```typescript
import { GradeBands, GradingSystem } from '@sectors/domain/value-objects'

// Get grade range in user's preferred system
const gradeRange = gradeBands.getGradeRange(GradingSystem.YDS)
// Returns: "5.10a - 5.12d"

// The gbRoutes array uses universal indices:
// gbRoutes[24] = routes at French 6a / YDS 5.10a
// gbRoutes[30] = routes at French 7a / YDS 5.11c
```

### Use Case

The `GetZoneOverviewWithSectorsUseCase` accepts an optional `gradingSystem` parameter:

```typescript
const result = await getZoneOverviewWithSectorsUseCase.execute(
  zoneId,
  GradingSystem.FRENCH // Optional, defaults to FRENCH
)
```

### Frontend (Mobile App)

Users can select their preferred grading system in settings:

```typescript
// In ZoneSectorsScreen.tsx
const { data: userPreferences } = useUserPreferences()
const gradingSystem = userPreferences?.gradingSystem || 'FRENCH'

const { data: zoneData } = useZoneOverview(zoneId, { gradingSystem })
```

### API Endpoint

The API endpoint accepts a query parameter:

```
GET /zones/:zoneId/overview?gradingSystem=YDS
GET /zones/:zoneId/overview?gradingSystem=FRENCH
GET /zones/:zoneId/overview (defaults to FRENCH)
```

---

## Universal Index System

All grades are converted to a universal index (10-52+) for internal storage and comparison.

### Index Reference Table

| Index | French | YDS | UIAA | British | Font | Hueco |
|-------|--------|-----|------|---------|------|-------|
| 10 | 3 | 5.2 | III | M | 3 | VB |
| 12 | 4a | 5.4 | IV- | D | 4 | - |
| 14 | 4b | 5.5 | IV | VD | 4+ | V0 |
| 16 | 4c | 5.6 | IV+ | S | 5 | - |
| 18 | 5a | 5.7 | V | HS | 5+ | V1 |
| 20 | 5b | 5.8 | V+ | VS | 6A | V2 |
| 22 | 5c | 5.9 | VI | - | 6B | V3 |
| 24 | 6a | 5.10a | VI+ | HVS | 6B+ | - |
| 26 | 6b | 5.10c | VII | E1 | 6C | V4 |
| 28 | 6c | 5.11a | VII+ | E2 | 6C+ | V5 |
| 30 | 7a | 5.11c | VIII | E3 | 7A | V6 |
| 32 | 7b | 5.12a | VIII+ | E4 | 7A+ | V7 |
| 34 | 7c | 5.12c | IX | E5 | 7B | V8 |
| 36 | 8a | 5.13a | IX+ | E6 | 7B+ | V9 |
| 38 | 8b | 5.13c | X | E7 | 7C | V10 |
| 40 | 8c | 5.14a | X+ | E8 | 7C+ | V11 |
| 42 | 9a | 5.14c | XI | E9 | 8A | V12 |
| 44 | 9b | 5.15a | XI+ | E10 | 8A+ | V13 |
| 46 | 9c | 5.15c | XII | E11 | 8B | V14 |

**Note:** These conversions are approximate. Different sources may vary slightly.

---

## Testing

All grading systems are fully tested with 25+ test cases covering:

- ✅ Default system (French)
- ✅ All 6 systems (French, YDS, UIAA, British, Font, Hueco)
- ✅ Single grade display
- ✅ Grade ranges
- ✅ Null/empty handling
- ✅ Consistency with GradeDistributionBuilder indices

**Test files:**
- `packages/sectors/domain/value-objects/__tests__/grade-bands.test.ts`
- `packages/the-crag/infrastructure/scraper/__tests__/grade-distribution-builder.test.ts`
- `packages/search/domain/value-objects/__tests__/grade-range.vo.test.ts`

---

## Future Enhancements

### User Preferences

Create a user preferences system to store the selected grading system:

```typescript
interface UserPreferences {
  gradingSystem: GradingSystem
  // ... other preferences
}
```

### Settings Screen

Add a settings screen where users can select their preferred grading system:

```tsx
<Select
  label="Sistema de graduación"
  value={preferences.gradingSystem}
  onChange={(value) => updatePreferences({ gradingSystem: value })}
>
  <Option value="FRENCH">Francés (5a, 6b+, 7c)</Option>
  <Option value="YDS">YDS (5.10a, 5.12d)</Option>
  <Option value="UIAA">UIAA (IV, VI+, IX)</Option>
  <Option value="BRITISH">Británico (M, HVS, E1)</Option>
  <Option value="FONT">Font Boulder (6A, 7C+)</Option>
  <Option value="HUECO">V-Scale (V0, V5, V10)</Option>
</Select>
```

### Persistence

Store the preference in:
- Local storage (mobile app)
- User profile (backend database)
- Sync across devices

---

## References

- [Wikipedia: Grade (climbing)](https://en.wikipedia.org/wiki/Grade_(climbing))
- [Mountain Project: Climbing Grades](https://www.mountainproject.com/international-climbing-grades)
- [TheCrag: Grading Systems](https://www.thecrag.com/en/article/grades)

---

## Developer Documentation

For developers implementing grade-related features, see:
- `docs/features/grades/README.md` - Technical implementation guide (services, APIs, usage examples)
