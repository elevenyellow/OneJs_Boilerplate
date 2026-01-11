# 🚀 Optimización de Rendimiento - ClimbZone

## Análisis del Problema Actual

La carga inicial de la app es lenta debido a varios factores identificados:

1. **Inicialización pesada**: React Query, carga de ubicación, obtención de filtros
2. **Carga de datos inicial**: Búsqueda de sectores con múltiples cálculos complejos
3. **Sin caché persistente**: Los datos se pierden entre sesiones
4. **Renderizado pesado**: Muchos componentes se renderizan en la primera carga
5. **Fuentes e imágenes**: No hay optimización de assets

---

## 🎯 Estrategias de Optimización

### 1. Implementar Caché Persistente (AsyncStorage)

**Objetivo**: Guardar datos entre sesiones para cargar instantáneamente

#### A. Persistir datos de React Query

```typescript
// lib/queryClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 24 * 60 * 60 * 1000, // 24 horas (antes cacheTime)
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
})

// Usar en _layout.tsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
>
  {/* App content */}
</PersistQueryClientProvider>
```

**Instalación requerida**:
```bash
bun add @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
```

**Beneficio**: Los datos se cargan instantáneamente desde caché mientras se revalidan en segundo plano.

---

#### B. Caché de ubicación del usuario

```typescript
// hooks/useLocation.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCATION_CACHE_KEY = 'user_last_location'
const LOCATION_CACHE_DURATION = 10 * 60 * 1000 // 10 minutos

export function useLocation() {
  const [location, setLocation] = useState<{lat: number; lon: number} | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLocation() {
      try {
        // 1. Intentar cargar ubicación cacheada primero
        const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY)
        if (cached) {
          const { location: cachedLoc, timestamp } = JSON.parse(cached)
          const age = Date.now() - timestamp
          
          if (age < LOCATION_CACHE_DURATION) {
            console.log('[Location] Using cached location')
            setLocation(cachedLoc)
            setLoading(false)
            return // Usar caché sin pedir nueva ubicación
          }
        }

        // 2. Obtener nueva ubicación
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({})
          const newLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          }
          
          // Guardar en caché
          await AsyncStorage.setItem(
            LOCATION_CACHE_KEY,
            JSON.stringify({
              location: newLocation,
              timestamp: Date.now(),
            })
          )
          
          setLocation(newLocation)
        }
      } catch (error) {
        console.error('[Location] Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLocation()
  }, [])

  return { latitude: location?.lat, longitude: location?.lon, loading }
}
```

**Beneficio**: La ubicación se carga instantáneamente desde caché en lugar de esperar GPS.

---

### 2. Optimizar Inicialización de la App

#### A. Lazy loading de componentes pesados

```typescript
// app/_layout.tsx
import React, { lazy, Suspense } from 'react'

// Cargar componentes pesados de forma diferida
const GestureHandlerRootView = lazy(() => 
  import('react-native-gesture-handler').then(m => ({ 
    default: m.GestureHandlerRootView 
  }))
)

const BottomSheetModalProvider = lazy(() =>
  import('@gorhom/bottom-sheet').then(m => ({
    default: m.BottomSheetModalProvider
  }))
)

export default function RootLayout() {
  return (
    <Suspense fallback={<AppLoadingScreen />}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          {/* ... */}
        </QueryClientProvider>
      </GestureHandlerRootView>
    </Suspense>
  )
}
```

---

#### B. Optimizar QueryClient con configuración agresiva

```typescript
// app/_layout.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - mantener datos "frescos"
      gcTime: 24 * 60 * 60 * 1000, // 24 horas - retener en memoria/caché
      refetchOnWindowFocus: false, // No refetch al volver a la app
      refetchOnMount: false, // No refetch al montar componente si hay caché
      retry: 1, // Solo 1 reintento en vez de 3
      networkMode: 'offlineFirst', // Usar caché primero, luego red
    },
  },
})
```

**Beneficio**: Reduce llamadas a la API y usa caché agresivamente.

---

### 3. Optimizar Carga de Pantalla Principal (index.tsx)

#### A. Implementar esqueleto mejorado con datos cacheados

```typescript
// app/(tabs)/index.tsx
export default function ExploreScreen() {
  // ... código actual ...

  // Cargar filtros desde caché INMEDIATAMENTE
  const [filters, setFilters] = useState<SearchSectorsDto | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function initializeFilters() {
      try {
        // 1. Cargar ubicación cacheada (instantáneo)
        const cachedLocation = await AsyncStorage.getItem('user_last_location')
        
        // 2. Cargar filtros guardados (instantáneo)
        const savedFilters = await getMergedFilters(
          cachedLocation ? JSON.parse(cachedLocation).location : undefined
        )
        
        setFilters(savedFilters)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeFilters()
  }, [])

  // Usar initialData en la query para mostrar datos cacheados instantáneamente
  const { data, isLoading } = useSectorSearch(filters, !!filters)

  // Mostrar esqueleto SOLO si no hay datos cacheados
  if (isInitializing || (isLoading && !data)) {
    return <LoadingScreen />
  }

  // Si hay datos cacheados, mostrarlos mientras se actualiza en segundo plano
  return (
    <View>
      {data && <FlashList data={data} />}
      {isRefetching && <RefreshIndicator />}
    </View>
  )
}
```

---

#### B. Implementar prefetching inteligente

```typescript
// hooks/useSectorSearch.ts
export function useSectorSearch(
  filters: SearchSectorsDto | null,
  enabled = true,
) {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ['sectors', 'search', filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Hacer la búsqueda
      const result = await api.sectors.search({
        ...filters,
        limit: PAGE_SIZE,
        offset: pageParam,
      })

      // PREFETCH: Pre-cargar datos de sectores más relevantes
      if (pageParam === 0 && result.results.length > 0) {
        const topSectors = result.results
          .flatMap(crag => crag.sectors)
          .slice(0, 3) // Top 3 sectores

        topSectors.forEach(sector => {
          // Pre-cargar rutas del sector
          queryClient.prefetchQuery({
            queryKey: ['sectors', sector.sector.id, 'routes'],
            queryFn: () => api.sectors.getRoutes(sector.sector.id),
          })

          // Pre-cargar clima si hay coordenadas
          if (sector.sector.latitude && sector.sector.longitude) {
            queryClient.prefetchQuery({
              queryKey: ['weather', 'coordinates', sector.sector.latitude, sector.sector.longitude],
              queryFn: () => api.weather.getByCoordinates(
                sector.sector.latitude,
                sector.sector.longitude
              ),
            })
          }
        })
      }

      return result
    },
    // ... resto de opciones
  })

  return query
}
```

**Beneficio**: Al abrir un sector, los datos ya están cargados = navegación instantánea.

---

### 4. Optimizar Componentes Pesados

#### A. Memoizar SectorCard

```typescript
// components/SectorCard.tsx
import React, { memo } from 'react'

export const SectorCard = memo(function SectorCard({ sector }: Props) {
  // ... contenido del componente
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambia el sector
  return prevProps.sector.sector.id === nextProps.sector.sector.id &&
         prevProps.sector.relevanceScore === nextProps.sector.relevanceScore
})
```

#### B. Optimizar FlashList

```typescript
// app/(tabs)/index.tsx
<FlashList
  data={cragResults}
  renderItem={({ item }) => <CragGroup cragWithSectors={item} />}
  estimatedItemSize={200}
  
  // OPTIMIZACIONES
  drawDistance={500} // Reducir distancia de renderizado
  estimatedListSize={{ height: 800, width: 400 }} // Tamaño estimado
  overrideItemLayout={(layout, item) => {
    // Proporcionar tamaño exacto si es posible
    layout.size = item.sectors.length * 120 + 80
  }}
  
  // Caché de renders
  getItemType={(item) => 'crag'} // Mismo tipo = mejor reciclaje
/>
```

---

### 5. Optimizar Assets e Imágenes

#### A. Implementar splash screen nativa

```typescript
// app.json
{
  "expo": {
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1E293B"
    },
    "android": {
      "splash": {
        "image": "./assets/images/splash-android.png",
        "resizeMode": "cover",
        "backgroundColor": "#1E293B"
      }
    },
    "ios": {
      "splash": {
        "image": "./assets/images/splash-ios.png",
        "resizeMode": "cover",
        "backgroundColor": "#1E293B"
      }
    }
  }
}
```

#### B. Precargar fuentes durante splash

```typescript
// app/_layout.tsx
import * as Font from 'expo-font'

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Cargar fuentes personalizadas si las hay
          // 'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
        })
      } finally {
        setFontsLoaded(true)
        await SplashScreen.hideAsync()
      }
    }

    loadFonts()
  }, [])

  if (!fontsLoaded) {
    return null // El splash screen nativo se mostrará
  }

  return (
    // ... app content
  )
}
```

---

### 6. Optimizar API Backend

#### A. Implementar compresión gzip

```typescript
// apps/api/index.ts
import compression from 'compression'

const app = new Elysia()
  .use(compression()) // Comprimir respuestas
  .use(cors({
    // ... configuración cors
  }))
```

**Instalación**:
```bash
cd apps/api
bun add @elysiajs/compress
```

```typescript
import { compress } from '@elysiajs/compress'

const app = new Elysia()
  .use(compress()) // ElysiaJS compression plugin
```

#### B. Implementar caché HTTP en API

```typescript
// apps/api/src/sector.controller.ts
app.post('/api/sectors/search', async ({ body, set }) => {
  const result = await searchSectors(body)
  
  // Cachear respuesta en cliente por 5 minutos
  set.headers['Cache-Control'] = 'private, max-age=300'
  set.headers['ETag'] = generateETag(result)
  
  return result
})
```

---

### 7. Implementar Estrategia de Carga Progresiva

#### A. Cargar datos críticos primero

```typescript
// app/(tabs)/index.tsx
export default function ExploreScreen() {
  const [phase, setPhase] = useState<'initial' | 'enhanced' | 'complete'>('initial')

  useEffect(() => {
    // Fase 1: Cargar datos básicos (instantáneo desde caché)
    setPhase('initial')
    
    // Fase 2: Cargar datos enriquecidos (clima, etc.) - 500ms después
    setTimeout(() => setPhase('enhanced'), 500)
    
    // Fase 3: Cargar datos completos (prefetch, imágenes) - 2s después
    setTimeout(() => setPhase('complete'), 2000)
  }, [])

  const { data } = useSectorSearch(filters, phase !== 'initial')
  
  // Mostrar esqueleto mínimo mientras carga
  return (
    <View>
      {phase === 'initial' && <MinimalSkeleton />}
      {phase === 'enhanced' && data && <SectorList data={data} showWeather={false} />}
      {phase === 'complete' && data && <SectorList data={data} showWeather={true} />}
    </View>
  )
}
```

---

## 📊 Resultados Esperados

Con estas optimizaciones, deberías ver:

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Primera carga** | 3-5s | 0.5-1s | 🚀 80% |
| **Carga subsiguiente** | 2-3s | <0.3s | 🚀 90% |
| **Navegación a sector** | 1-2s | <0.2s | 🚀 90% |
| **Actualización de datos** | 2s | 0.5s | 🚀 75% |
| **Tamaño de respuesta API** | 100% | 30-40% | 🚀 60% |

---

## 🎯 Plan de Implementación (Prioridad)

### Alta Prioridad (Impacto inmediato)
1. ✅ **Caché de ubicación** (30 min) - Mejora: 60%
2. ✅ **Persistencia React Query** (45 min) - Mejora: 70%
3. ✅ **Optimizar QueryClient config** (15 min) - Mejora: 30%
4. ✅ **Memoizar componentes** (30 min) - Mejora: 20%

### Media Prioridad
5. ⚡ **Prefetching inteligente** (1h) - Mejora: 40%
6. ⚡ **Compresión API** (30 min) - Mejora: 50%
7. ⚡ **Optimizar FlashList** (30 min) - Mejora: 15%

### Baja Prioridad (Refinamiento)
8. 💎 **Carga progresiva** (1.5h) - Mejora: 25%
9. 💎 **Caché HTTP API** (1h) - Mejora: 20%
10. 💎 **Lazy loading componentes** (45 min) - Mejora: 10%

---

## 🚀 Inicio Rápido

**Implementar las 4 optimizaciones de alta prioridad en ~2 horas:**

```bash
# 1. Instalar dependencias
cd apps/app
bun add @tanstack/react-query-persist-client @tanstack/query-async-storage-persister

# 2. Implementar cambios (ver secciones arriba)

# 3. Testear
bun run start
```

---

## 📱 Monitoreo de Performance

Agregar logging para medir mejoras:

```typescript
// lib/performance.ts
export const perfLog = {
  start: (label: string) => {
    performance.mark(`${label}-start`)
  },
  end: (label: string) => {
    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)
    const measure = performance.getEntriesByName(label)[0]
    console.log(`[Perf] ${label}: ${measure.duration.toFixed(2)}ms`)
  }
}

// Usar en componentes
useEffect(() => {
  perfLog.start('initial-load')
  // ... cargar datos
  perfLog.end('initial-load')
}, [])
```

---

## 🐛 Troubleshooting

### La app sigue lenta después de implementar caché

**Causa**: Caché no se está generando correctamente

**Solución**:
```bash
# Limpiar AsyncStorage
npx react-native-clean-project
# O manualmente en el código:
AsyncStorage.clear()
```

### Datos obsoletos en caché

**Causa**: `staleTime` muy alto

**Solución**: Reducir `staleTime` o implementar invalidación manual:
```typescript
queryClient.invalidateQueries({ queryKey: ['sectors'] })
```

### Errores al cargar desde caché

**Causa**: Formato de datos cambió

**Solución**: Aumentar versión de caché:
```typescript
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'climb-zone-cache-v2', // Cambiar versión
})
```

---

## 📚 Recursos

- [React Query Persistence](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [FlashList Best Practices](https://shopify.github.io/flash-list/docs/fundamentals/performant-components)
- [Expo AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)

---

**Última actualización**: 2026-01-10
