# 🔧 Optimización del Backend - Reducir Tamaño de Responses

## 📊 Análisis del Problema

Las responses del API pueden ser muy grandes debido a:

1. **Datos completos de entidades** (incluye campos innecesarios)
2. **Sin compresión HTTP** (datos enviados sin comprimir)
3. **Objetos anidados pesados** (sector → crag → routes → todos los campos)
4. **Sin paginación eficiente** (carga todo de una vez)

### Impacto Estimado:
- **Response actual**: ~500KB - 2MB sin comprimir
- **Response optimizada**: ~100-400KB (60-80% reducción)
- **Con compresión gzip**: ~30-120KB (90% reducción total)

---

## 🚀 Optimizaciones a Implementar

### 1. **Compresión HTTP con ElysiaJS** (Prioridad Alta)

**Beneficio**: Reduce tamaño en 60-80%

#### Instalación:
```bash
cd apps/api
bun add @elysiajs/compress
```

#### Implementación:

```typescript
// apps/api/index.ts
import { ContainerProvider, logger, OneJs, PluginRegistry } from '@OneJs'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { PrismaPlugin } from '@OneJs/prisma'
import { Server, ServerPlugin } from '@OneJs/server'
import cors from '@elysiajs/cors'
import { compress } from '@elysiajs/compress'

// Register plugins
PluginRegistry.register(new ServerPlugin())
PluginRegistry.register(new PrismaPlugin())
PluginRegistry.register(new BootstrapLoader())

const oneJs = new OneJs(import.meta.url)
await oneJs.start()
const container = ContainerProvider.getContainer()

const server = container.get(Server)

server
  .setPrefix('/api')
  .use(cors({ credentials: true }) as any)
  // 🚀 NUEVA: Compresión automática de responses
  .use(compress({
    encoding: 'gzip',
    threshold: 1024, // Solo comprimir si >1KB
  }))
  .start(Number(process.env.PORT ?? 4000), () => {
    logger.info('api:startup', 'Server started on port 4000 with compression')
  })
```

**Resultado esperado**:
- Response de 1MB → ~200KB (80% reducción)
- Automático para todas las rutas
- Sin cambios en el cliente

---

### 2. **DTOs Ligeros (Data Transfer Objects)** (Prioridad Alta)

**Problema actual**: Se envían todos los campos de cada entidad

**Solución**: Crear versiones "slim" de los objetos con solo campos necesarios

#### Crear DTOs optimizados:

```typescript
// apps/api/src/sector/application/dtos/sector-search-response.dto.ts

/**
 * DTO ligero para búsqueda de sectores
 * Solo incluye campos necesarios para la lista
 */
export interface SectorSearchResultSlimDto {
  // IDs
  sectorId: string
  cragId: string
  
  // Nombres
  sectorName: string
  cragName: string
  
  // Ubicación
  coordinates: { lat: number; lon: number } | null
  distance: number
  
  // Estadísticas clave
  totalRoutes: number
  routesInRange: number
  avgStars: number | null
  
  // Características
  orientation: string | null
  sunExposure: string | null
  rockType: string | null
  
  // Scoring
  relevanceScore: number
  
  // Omitir:
  // - routes[] completos (solo stats)
  // - descriptions largas
  // - campos rarely used
}

/**
 * DTO completo solo para detalle de sector individual
 */
export interface SectorDetailDto extends SectorSearchResultSlimDto {
  description: string | null
  approach: string | null
  routes: RouteSlimDto[] // Solo cuando se pide explícitamente
}

/**
 * DTO ligero para rutas en listas
 */
export interface RouteSlimDto {
  id: string
  name: string
  grade: string | null
  gradeIndex: number | null
  stars: number | null
  height: number | null
  // Omitir campos pesados como descriptions, photos, etc
}
```

#### Modificar el controller:

```typescript
// apps/api/src/sector.controller.ts

@Post('/search')
async search(context: Context) {
  const body = context.body as SearchSectorsDto
  
  // Validación...
  
  const response = await this.searchSectorsUseCase.execute(body)
  
  // 🚀 NUEVA: Transformar a DTO ligero
  const slimResponse = {
    results: response.results.map(cragGroup => ({
      crag: {
        id: cragGroup.crag.id,
        name: cragGroup.crag.name,
        latitude: cragGroup.crag.latitude,
        longitude: cragGroup.crag.longitude,
        distance: cragGroup.distance,
        // Omitir: description, approach, altNames, etc
      },
      sectors: cragGroup.sectors.map(sector => ({
        sectorId: sector.sector.id,
        sectorName: sector.sector.name,
        cragName: sector.sector.cragName,
        coordinates: sector.sector.coordinates,
        distance: sector.distance,
        totalRoutes: sector.sector.routes?.length || 0,
        routesInRange: sector.routesInUserRange,
        avgStars: sector.sector.avgStars,
        orientation: sector.sector.orientation,
        sunExposure: sector.sector.sunExposure,
        rockType: sector.sector.rockType,
        relevanceScore: sector.relevanceScore,
        // Omitir: routes completos, descriptions, etc
      }))
    })),
    total: response.total,
    totalSectors: response.totalSectors,
    metadata: response.metadata,
  }
  
  context.set.status = 200
  return slimResponse
}

@Get('/:id/routes')
async getSectorRoutes(context: Context) {
  // ... código existente ...
  
  // 🚀 NUEVA: DTO ligero para rutas
  return {
    sectorId: id,
    total: routes.length,
    routes: routes.map(route => ({
      id: route.id,
      name: route.name,
      grade: route.grade,
      gradeIndex: route.gradeIndex,
      stars: route.stars,
      height: route.height,
      bolts: route.bolts,
      pitches: route.pitches,
      ascents: route.ascents,
      // Omitir: description, fa, photos, etc
    }))
  }
}
```

**Resultado esperado**:
- Response de sector search: ~50% más pequeña
- Solo datos necesarios para la UI
- Detalles completos solo cuando se necesitan

---

### 3. **Caché HTTP con Headers** (Prioridad Media)

**Beneficio**: El navegador/app cachea automáticamente

```typescript
// apps/api/src/sector.controller.ts

@Post('/search')
async search(context: Context) {
  const body = context.body as SearchSectorsDto
  
  // ... búsqueda ...
  
  const response = await this.searchSectorsUseCase.execute(body)
  
  // 🚀 NUEVA: Headers de caché HTTP
  context.set.headers['Cache-Control'] = 'private, max-age=300' // 5 minutos
  context.set.headers['Vary'] = 'Accept-Encoding'
  
  // ETags para validación de caché
  const etag = generateETag(response)
  context.set.headers['ETag'] = etag
  
  // Si el cliente tiene la misma versión, no enviar datos
  if (context.request.headers.get('If-None-Match') === etag) {
    context.set.status = 304 // Not Modified
    return
  }
  
  context.set.status = 200
  return response
}

// Función auxiliar para generar ETag
function generateETag(data: any): string {
  const hash = require('crypto')
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex')
  return `"${hash}"`
}
```

---

### 4. **Paginación Optimizada** (Ya implementado ✅)

Tu app ya usa paginación con offset/limit, pero podemos optimizar:

```typescript
// Confirmar que limit por defecto es pequeño
const DEFAULT_PAGE_SIZE = 10 // ✅ Ya implementado
const MAX_PAGE_SIZE = 50

// En el use case:
const limit = Math.min(dto.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
```

---

### 5. **Lazy Loading de Rutas** (Recomendado)

**Problema**: Actualmente se cargan todas las rutas de cada sector

**Solución**: No cargar rutas en el search, solo en el detalle

```typescript
// Modificar SearchSectorsUseCase para NO incluir routes por defecto

export class SearchSectorsUseCase {
  async execute(dto: SearchSectorsDto): Promise<SearchSectorsResponse> {
    // ... búsqueda de sectores ...
    
    // 🚀 CAMBIO: NO cargar routes aquí
    const sectors = await this.sectorRepository.findNearbyWithoutRoutes({
      coordinates,
      maxDistance: dto.maxDistance,
      // ...
    })
    
    // Las rutas se cargan solo cuando el usuario abre el sector
    // vía GET /sectors/:id/routes
  }
}
```

---

## 📊 Comparación de Tamaño

### Antes (sin optimizaciones):

```json
// Response: ~1.5MB sin comprimir
{
  "results": [
    {
      "crag": {
        "id": "...",
        "name": "...",
        "description": "... (5KB de texto)",
        "approach": "... (3KB de texto)",
        "altNames": [...],
        "urlStub": "...",
        "priceCategory": "...",
        // ... 15 campos más
      },
      "sectors": [
        {
          "sector": {
            "id": "...",
            "name": "...",
            "description": "... (mucho texto)",
            "routes": [ // 50+ rutas con todos los campos
              {
                "id": "...",
                "name": "...",
                "description": "...",
                "firstAscent": "...",
                "photos": [...],
                // ... 20 campos por ruta
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Después (optimizado):

```json
// Response: ~200KB sin comprimir, ~50KB con gzip
{
  "results": [
    {
      "crag": {
        "id": "...",
        "name": "...",
        "latitude": 39.5,
        "longitude": -0.5,
        "distance": 5.2
      },
      "sectors": [
        {
          "sectorId": "...",
          "sectorName": "...",
          "coordinates": { "lat": 39.5, "lon": -0.5 },
          "distance": 5.2,
          "totalRoutes": 45,
          "routesInRange": 23,
          "avgStars": 2.5,
          "orientation": "S",
          "sunExposure": "sun",
          "rockType": "Limestone",
          "relevanceScore": 85
          // Sin routes, sin descriptions
        }
      ]
    }
  ]
}
```

**Reducción**: 1.5MB → 50KB = **97% menos datos**

---

## 🎯 Plan de Implementación

### Fase 1: Rápido (30 min) - Impacto Alto

1. ✅ Instalar `@elysiajs/compress`
2. ✅ Agregar compresión en `index.ts`
3. ✅ Agregar headers de caché en controllers

**Resultado**: 60-80% reducción inmediata

### Fase 2: Medio (2h) - Impacto Medio

4. ⚡ Crear DTOs ligeros
5. ⚡ Modificar controllers para usar DTOs
6. ⚡ Actualizar tipos en frontend

**Resultado**: 80-90% reducción total

### Fase 3: Avanzado (3h) - Impacto Bajo

7. 💎 Lazy loading de rutas
8. 💎 Implementar ETags
9. 💎 Optimizar queries de DB

**Resultado**: 95%+ reducción total

---

## 🚀 Implementación Rápida (30 min)

Empecemos con lo que da más impacto:

```bash
# 1. Instalar compresión
cd apps/api
bun add @elysiajs/compress

# 2. Modificar index.ts (ver código arriba)

# 3. Reiniciar servidor
bun run start:dev
```

**Testing**:
```bash
# Sin compresión
curl -X POST http://localhost:4000/api/sectors/search \
  -H "Content-Type: application/json" \
  -d '{"userLocation":{"lat":39.4699,"lon":-0.3763},"gradeRange":{"min":"6a","max":"7b"},"maxDistance":30}' \
  | wc -c

# Con compresión
curl -X POST http://localhost:4000/api/sectors/search \
  -H "Content-Type: application/json" \
  -H "Accept-Encoding: gzip" \
  -d '{"userLocation":{"lat":39.4699,"lon":-0.3763},"gradeRange":{"min":"6a","max":"7b"},"maxDistance":30}' \
  --compressed | wc -c
```

---

## 📱 Actualizar Frontend

El frontend (React Native) automáticamente acepta compresión gzip:

```typescript
// lib/api.ts - NO requiere cambios
// fetch() automáticamente maneja gzip

// Pero podemos medir el impacto:
async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const startTime = performance.now()

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate', // ✅ Ya incluido por fetch
      ...options?.headers,
    },
  })

  const data = await response.json()
  const duration = performance.now() - startTime
  
  console.log(`[API] ${endpoint} - ${duration.toFixed(0)}ms`)
  
  return data
}
```

---

## 📊 Métricas Esperadas

| Optimización | Reducción | Tiempo | Prioridad |
|--------------|-----------|--------|-----------|
| Compresión gzip | 60-80% | 30 min | 🔥 Alta |
| DTOs ligeros | 40-60% | 2h | 🔥 Alta |
| Caché HTTP | 50-90% (hits) | 1h | ⚡ Media |
| Lazy loading | 30-50% | 2h | ⚡ Media |

---

## 🎯 ¿Qué implementamos primero?

**Recomendación**: Empezar con **Compresión gzip** (30 min, 80% mejora)

¿Quieres que implemente la compresión ahora?
