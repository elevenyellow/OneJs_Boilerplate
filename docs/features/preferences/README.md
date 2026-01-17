# User Preferences System

## Overview

The User Preferences System provides persistent user settings for the climbing mobile app. Preferences are stored locally using AsyncStorage with support for future backend synchronization.

## Architecture

```
┌─────────────────────┐
│   AsyncStorage      │
│   (Local Storage)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ preferencesStorage  │
│   (Service Layer)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ PreferencesProvider │
│     (Context)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   usePreferences    │
│     (Hook)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│           Specialized Hooks              │
├─────────────────────────────────────────┤
│ useGradeSystem     │ Grade preferences  │
│ useUnits           │ Unit formatting    │
│ useSearchDefaults  │ Search defaults    │
└─────────────────────────────────────────┘
```

## Available Services/Classes

| Service/Class | Purpose | Location |
|---------------|---------|----------|
| `PreferencesProvider` | React context provider for preferences | `apps/mobile-app/src/contexts/PreferencesContext.tsx` |
| `usePreferences` | Main hook for accessing all preferences | `apps/mobile-app/src/contexts/PreferencesContext.tsx` |
| `useGradeSystemPreference` | Hook for grade system settings | `apps/mobile-app/src/contexts/PreferencesContext.tsx` |
| `useUnitPreferences` | Hook for unit settings | `apps/mobile-app/src/contexts/PreferencesContext.tsx` |
| `useSearchDefaultPreferences` | Hook for search defaults | `apps/mobile-app/src/contexts/PreferencesContext.tsx` |
| `useGradeSystem` | Utility hook with grade formatting | `apps/mobile-app/src/hooks/useGradeSystem.ts` |
| `useUnits` | Utility hook for unit formatting | `apps/mobile-app/src/hooks/useUnits.ts` |
| `useSearchDefaults` | Utility hook for search defaults | `apps/mobile-app/src/hooks/useSearchDefaults.ts` |
| `loadPreferences` | Load preferences from storage | `apps/mobile-app/src/services/storage/preferencesStorage.ts` |
| `savePreferences` | Save preferences to storage | `apps/mobile-app/src/services/storage/preferencesStorage.ts` |
| `resetPreferences` | Reset to default values | `apps/mobile-app/src/services/storage/preferencesStorage.ts` |

## Preference Categories

### Climbing Preferences

| Preference | Type | Default | Description |
|------------|------|---------|-------------|
| `gradeSystem` | `GradeSystemPreference` | `'french'` | Preferred grade system for displaying difficulties |
| `defaultDiscipline` | `ClimbingDiscipline` | `'all'` | Default climbing discipline filter |
| `showBoulderGrades` | `boolean` | `true` | Show Font/Hueco grades alongside sport grades |
| `showAidGrades` | `boolean` | `false` | Show A0-A5 grades for aid climbing |

### Unit Preferences

| Preference | Type | Default | Description |
|------------|------|---------|-------------|
| `distanceUnit` | `DistanceUnit` | `'metric'` | km/miles for search radius, approach |
| `heightUnit` | `HeightUnit` | `'meters'` | meters/feet for route heights |
| `temperatureUnit` | `TemperatureUnit` | `'celsius'` | Celsius/Fahrenheit for weather |

### Search Defaults

| Preference | Type | Default | Description |
|------------|------|---------|-------------|
| `defaultSearchRadiusKm` | `number` | `50` | Default search radius in km |
| `defaultMinGrade` | `number \| null` | `null` | Default minimum grade filter |
| `defaultMaxGrade` | `number \| null` | `null` | Default maximum grade filter |
| `rememberLastSearch` | `boolean` | `true` | Restore previous search on launch |

### Display Preferences

| Preference | Type | Default | Description |
|------------|------|---------|-------------|
| `language` | `LanguagePreference` | `'es'` | App language |
| `theme` | `ThemePreference` | `'dark'` | App theme |
| `compactRouteList` | `boolean` | `false` | Use denser layout for routes |
| `showGradeColors` | `boolean` | `true` | Color code grades by difficulty |

### Notification Preferences

| Preference | Type | Default | Description |
|------------|------|---------|-------------|
| `weatherAlerts` | `boolean` | `true` | Weather alerts for saved crags |
| `newRouteAlerts` | `boolean` | `false` | Notifications for new routes |
| `conditionAlerts` | `boolean` | `true` | Climbing condition updates |

### Offline Preferences

| Preference | Type | Default | Description |
|------------|------|---------|-------------|
| `autoDownloadSaved` | `boolean` | `false` | Auto-download saved areas |
| `downloadQuality` | `DownloadQuality` | `'medium'` | Quality for downloaded maps |
| `wifiOnlyDownloads` | `boolean` | `true` | Only download on WiFi |

### Safety Preferences

| Preference | Type | Default | Description |
|------------|------|---------|-------------|
| `emergencyContact` | `string` | `''` | Emergency contact phone |
| `showSafetyWarnings` | `boolean` | `true` | Show dangerous area warnings |
| `logClimbingSessions` | `boolean` | `false` | Track location during climbing |

## Usage Examples

### Basic Usage - Reading Preferences

```tsx
import { usePreferences } from '@/contexts/PreferencesContext'

function MyComponent() {
  const { preferences, isLoading } = usePreferences()

  if (isLoading) return <LoadingSpinner />

  return (
    <View>
      <Text>Grade System: {preferences.gradeSystem}</Text>
      <Text>Distance Unit: {preferences.distanceUnit}</Text>
    </View>
  )
}
```

### Updating Preferences

```tsx
import { usePreferences } from '@/contexts/PreferencesContext'

function SettingsComponent() {
  const { preferences, updatePreferences } = usePreferences()

  const handleGradeSystemChange = async (system: GradeSystemPreference) => {
    await updatePreferences({ gradeSystem: system })
    // Preference is automatically persisted to AsyncStorage
  }

  return (
    <Select
      value={preferences.gradeSystem}
      onValueChange={handleGradeSystemChange}
      options={gradeSystemOptions}
    />
  )
}
```

### Using Specialized Hooks

```tsx
import { useGradeSystem } from '@/hooks/useGradeSystem'
import { useUnits } from '@/hooks/useUnits'

function RouteCard({ route }: { route: Route }) {
  const { getGradeRange, categoryColors } = useGradeSystem()
  const { formatHeight, formatDistance } = useUnits()

  return (
    <View>
      <Text>Height: {formatHeight(route.heightMeters)}</Text>
      <Text>Approach: {formatDistance(route.approachKm)}</Text>
      <Text style={{ color: categoryColors[route.gradeCategory] }}>
        Grade: {getGradeRange(route.gradeCategory)}
      </Text>
    </View>
  )
}
```

### Using Search Defaults

```tsx
import { useCragSearch } from '@/hooks/useCragSearch'
import { usePreferences } from '@/contexts/PreferencesContext'

function ExplorerScreen() {
  const { preferences } = usePreferences()

  const preferenceDefaults = {
    radiusKm: preferences.defaultSearchRadiusKm,
    gradeSystem: preferences.gradeSystem,
  }

  const { sectors, isLoading } = useCragSearch(undefined, preferenceDefaults)

  // ...
}
```

### Resetting to Defaults

```tsx
import { usePreferences } from '@/contexts/PreferencesContext'

function ResetButton() {
  const { resetToDefaults } = usePreferences()

  const handleReset = async () => {
    await resetToDefaults()
    alert('Preferences reset to defaults')
  }

  return <Button onPress={handleReset}>Reset to Defaults</Button>
}
```

## Integration Points

### App.tsx - Provider Setup

The `PreferencesProvider` must wrap the app at the root level:

```tsx
// App.tsx
import { PreferencesProvider } from '@/contexts/PreferencesContext'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        {/* Navigation and other providers */}
      </PreferencesProvider>
    </QueryClientProvider>
  )
}
```

### i18n Integration

Language preference automatically syncs with i18n:

```tsx
// PreferencesContext handles this automatically
if (updates.language && updates.language !== i18n.language) {
  await i18n.changeLanguage(updates.language)
}
```

### Search Hook Integration

The `useCragSearch` hook accepts preference defaults:

```tsx
const preferenceDefaults = {
  radiusKm: preferences.defaultSearchRadiusKm,
  gradeSystem: preferences.gradeSystem,
}

const { sectors } = useCragSearch(undefined, preferenceDefaults)
```

## Storage Format

Preferences are stored in AsyncStorage with metadata for sync and migrations:

```json
{
  "version": 1,
  "updatedAt": "2025-01-16T10:30:00.000Z",
  "deviceId": "device_1705398600000_abc123xyz",
  "preferences": {
    "gradeSystem": "french",
    "distanceUnit": "metric",
    "language": "es",
    // ... all preference values
  }
}
```

## Schema Migrations

When `PREFERENCES_SCHEMA_VERSION` is incremented, migrations are handled automatically:

```typescript
// preferencesStorage.ts
function migratePreferences(stored: StoredPreferences): StoredPreferences {
  let currentVersion = stored.version
  const preferences = { ...stored.preferences }

  // Example migration from version 1 to 2
  if (currentVersion === 1) {
    preferences.newField = preferences.newField ?? 'default'
    currentVersion = 2
  }

  return { ...stored, version: currentVersion, preferences }
}
```

## Settings Screen

The Settings screen is available at `apps/mobile-app/src/screens/SettingsScreen.tsx` and provides a complete UI for all preferences.

Navigate to Settings via the bottom navigation bar (Settings tab) or programmatically:

```tsx
navigation.navigate('Settings')
```

## DO NOT Duplicate

**IMPORTANT: The following functionality already exists. DO NOT recreate:**

- ❌ Grade formatting/conversion - use `useGradeSystem()` hook
- ❌ Unit conversion (km/mi, m/ft, C/F) - use `useUnits()` hook
- ❌ Preference storage - use `preferencesStorage.ts` service
- ❌ Preference context - use `PreferencesProvider` and `usePreferences()`
- ❌ Settings UI components - use components in `apps/mobile-app/src/components/settings/`

## File Structure

```
apps/mobile-app/src/
├── contexts/
│   └── PreferencesContext.tsx  # Provider and hooks
├── services/storage/
│   └── preferencesStorage.ts   # AsyncStorage wrapper
├── types/
│   └── preferences.ts          # Type definitions
├── hooks/
│   ├── useGradeSystem.ts       # Grade utilities
│   ├── useUnits.ts             # Unit formatting
│   └── useSearchDefaults.ts    # Search defaults
├── components/settings/
│   ├── SettingSection.tsx      # Section grouping
│   ├── SettingRow.tsx          # Base row component
│   ├── SettingToggle.tsx       # Boolean switch
│   ├── SettingSelect.tsx       # Option picker
│   ├── SettingSlider.tsx       # Numeric slider
│   └── SettingInput.tsx        # Text input
└── screens/
    └── SettingsScreen.tsx      # Main settings UI
```

## Related Documentation

- `apps/mobile-app/src/utils/grades.ts` - Grade system utilities
- `apps/mobile-app/src/i18n/` - Internationalization setup
- `docs/features/grades/README.md` - Grade conversion documentation
