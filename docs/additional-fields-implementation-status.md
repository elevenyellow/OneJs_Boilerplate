# Implementación de Campos Adicionales - Alta y Media Prioridad

**Fecha:** 2026-01-09
**Status:** ✅ **SCHEMAS Y MIGRACIÓN COMPLETADOS** | ⚠️ **MAPPERS Y REPOSITORIOS PENDIENTES**

## ✅ Completado

### 1. Schemas de Base de Datos ✅

#### **SECTOR** - Nuevos campos agregados:
```prisma
- altNames          String[]  // Nombres alternativos
- locatedness       Int?      // Precisión de coordenadas (0-100)
- numberPhotos      Int?      // Número de fotos
- numberTopos       Int?      // Número de topos/croquis
- totalFavorites    Int?      // Total de favoritos
- isTLC             Boolean   // Top Level Crag (destacado)
- ascentCount       Int?      // Número total de ascensos
- maxPop            Int?      // Popularidad máxima
- permitNode        Json?     // Información sobre permisos
- siblingLabel      String?   // Etiqueta del hermano
- urlStub           String?   // URL en TheCrag
- urlAncestorStub   String?
- lastPDFSize       String?
- lastPDFStaticDate String?
```

**Índices creados:**
- `totalFavorites` (para rankings)
- `numberPhotos` (para filtros)
- `isTLC` (para sectores destacados)

#### **CRAG** - Nuevos campos agregados:
```prisma
- altNames          String[]  // Nombres alternativos
- locatedness       Int?      // Precisión de coordenadas (0-100)
- numberPhotos      Int?      // Número de fotos
- numberTopos       Int?      // Número de topos/croquis
- hasTopo           Boolean   // Tiene topos disponibles
- totalFavorites    Int?      // Total de favoritos
- kudos             Int?      // Kudos recibidos
- ascentCount       Int?      // Número total de ascensos
- maxPop            Int?      // Popularidad máxima
- priceCategory     String?   // Categoría de precio
- permitNode        Json?     // Información sobre permisos
- tagsRaw           Json?     // Tags originales
- urlStub           String?   // URL en TheCrag
- urlAncestorStub   String?
- lastPDFSize       String?
- lastPDFStaticDate String?
```

**Índices creados:**
- `totalFavorites`
- `numberPhotos`
- `hasTopo`

#### **AREA** - Nuevos campos agregados:
```prisma
- altNames     String[]  // Nombres alternativos
- seasonality  Int[]     // Temporada óptima (ahora también para áreas)
```

### 2. Value Objects Creados ✅

#### `AltNames` (`packages/shared/domain/value-objects/alt-names.vo.ts`)
- Representa nombres alternativos
- Normaliza y elimina duplicados
- Métodos: `has()`, `isEmpty()`, `toArray()`

#### `Locatedness` (`packages/shared/domain/value-objects/locatedness.vo.ts`)
- Representa precisión de coordenadas (0-100)
- Métodos: `isHighlyAccurate()`, `isReasonablyAccurate()`, `isPoorQuality()`, `getAccuracyLevel()`

#### `PermitInfo` (`packages/shared/domain/value-objects/permit-info.vo.ts`)
- Representa información de permisos/acceso
- Métodos: `hasPermitRequired()`, `getDescription()`

### 3. Entidades Actualizadas ✅

#### `SectorEntity` - Nuevos campos y métodos:
```typescript
// Nuevos campos
public readonly altNames: AltNames
public readonly locatedness: Locatedness | null
public readonly numberPhotos: number | null
public readonly numberTopos: number | null
public readonly totalFavorites: number | null
public readonly isTLC: boolean
public readonly ascentCount: number | null
public readonly maxPop: number | null
public readonly permitNode: PermitInfo
public readonly siblingLabel: string | null
public readonly urlStub: string | null
public readonly urlAncestorStub: string | null
public readonly lastPDFSize: string | null
public readonly lastPDFStaticDate: string | null

// Nuevos métodos
hasPhotos(): boolean
hasTopos(): boolean
isPopular(): boolean
hasAccurateLocation(): boolean
requiresPermit(): boolean
getTheCragUrl(): string | null
```

#### `CragEntity` - Nuevos campos y métodos:
```typescript
// Nuevos campos (similares a Sector)
public readonly altNames: AltNames
public readonly locatedness: Locatedness | null
public readonly numberPhotos: number | null
// ... (todos los campos listados arriba)

// Nuevos métodos
hasPhotos(): boolean
hasTopos(): boolean
isPopular(): boolean
hasAccurateLocation(): boolean
requiresPermit(): boolean
getTheCragUrl(): string | null
```

#### `AreaEntity` - Nuevos campos:
```typescript
public readonly altNames: AltNames
public readonly seasonality: Seasonality

// Nuevos métodos
getBestMonths(): number[]
isGoodMonth(month: number): boolean
```

### 4. Migración de Base de Datos ✅

**Migración:** `20260109103348_add_high_medium_priority_fields`

- ✅ Todos los campos agregados a PostgreSQL
- ✅ Índices creados para optimizar consultas
- ✅ Valores por defecto configurados
- ✅ Cliente de Prisma regenerado

---

## ⚠️ PENDIENTE: Mappers y Repositorios

### Tareas Restantes:

#### 1. **Actualizar Interfaces de Validated Data** ⚠️
Archivos: `packages/scraper-thecrag/application/services/scraped-data-mapper.service.ts`

Necesita:
- Actualizar `ValidatedCragData` con todos los campos nuevos
- Actualizar `ValidatedAreaData` con `altNames` y `seasonality`
- Actualizar `ValidatedSectorData` con todos los campos nuevos

#### 2. **Actualizar Métodos de Mapeo** ⚠️
Archivos: `packages/scraper-thecrag/application/services/scraped-data-mapper.service.ts`

Necesita:
- `mapToCrag()`: Extraer y crear Value Objects para todos los campos nuevos
- `mapToArea()`: Agregar `altNames` y `seasonality`
- `mapToSector()`: Extraer y crear Value Objects para todos los campos nuevos
- `createCragEntity()`, `createAreaEntity()`, `createSectorEntity()`: Pasar todos los parámetros nuevos

#### 3. **Actualizar Repositorios** ⚠️

**SectorRepository** (`packages/sector/infrastructure/persistence/prisma/sector.repository.ts`):
- Actualizar `SectorPrismaData` interface con todos los campos nuevos
- Actualizar `toEntity()` para hidratar todos los Value Objects nuevos
- Actualizar `toPrismaData()` para persistir todos los campos nuevos
- Agregar filtros opcionales: `hasPhotos`, `hasTopos`, `isPopular`, `isTLC`

**CragRepository** (`packages/crag/infrastructure/persistence/prisma/crag.repository.ts`):
- Actualizar `CragPrismaData` interface
- Actualizar `toEntity()` 
- Actualizar `toPrismaData()`
- Agregar filtros similares

**AreaRepository** (`packages/area/infrastructure/persistence/prisma/area.repository.ts`):
- Actualizar `AreaPrismaData` interface
- Actualizar `toEntity()`
- Actualizar `toPrismaData()`

---

## 📋 Checklist de Implementación

### Schemas y Migraciones
- [x] Actualizar schema de Sector
- [x] Actualizar schema de Crag
- [x] Actualizar schema de Area
- [x] Crear migración
- [x] Aplicar migración

### Value Objects
- [x] Crear `AltNames`
- [x] Crear `Locatedness`
- [x] Crear `PermitInfo`
- [x] Exportar desde `@climb-zone/shared`

### Entidades
- [x] Actualizar `SectorEntity`
- [x] Actualizar `CragEntity`
- [x] Actualizar `AreaEntity`

### Mappers
- [ ] Actualizar interfaces `ValidatedCragData`, `ValidatedAreaData`, `ValidatedSectorData`
- [ ] Actualizar método `mapToCrag()`
- [ ] Actualizar método `mapToArea()`
- [ ] Actualizar método `mapToSector()` (ya tiene algunos campos)
- [ ] Actualizar método `createCragEntity()`
- [ ] Actualizar método `createAreaEntity()`
- [ ] Actualizar método `createSectorEntity()`

### Repositorios
- [ ] Actualizar `SectorPrismaRepository`
- [ ] Actualizar `CragPrismaRepository`
- [ ] Actualizar `AreaPrismaRepository`

---

## 🔧 Cómo Completar la Implementación

### Paso 1: Actualizar Validated Interfaces

En `scraped-data-mapper.service.ts`, agregar los campos faltantes:

```typescript
export interface ValidatedCragData {
  // ... campos existentes ...
  altNames: AltNames
  locatedness: Locatedness | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  totalFavorites: number | null
  kudos: Kudos | null
  ascentCount: number | null
  maxPop: number | null
  priceCategory: PriceCategory | null
  permitNode: PermitInfo
  tagsRaw: Record<string, unknown> | null
  urlStub: string | null
  urlAncestorStub: string | null
  lastPDFSize: string | null
  lastPDFStaticDate: string | null
}
```

### Paso 2: Actualizar Métodos de Mapeo

Extraer los campos de `info`:

```typescript
mapToCrag(...) {
  // ... código existente ...
  
  const altNames = AltNames.create(info?.altNames)
  const locatedness = Locatedness.create(info?.locatedness)
  const numberPhotos = info?.numberPhotos ?? null
  const numberTopos = info?.numberTopos ?? null
  const hasTopo = Boolean(info?.hasTopo)
  const totalFavorites = info?.totalFavorites ?? null
  const kudos = Kudos.create(info?.kudos)
  const ascentCount = info?.ascentCount ?? null
  const maxPop = info?.maxPop ?? null
  const priceCategory = PriceCategory.create(info?.priceCategory)
  const permitNode = PermitInfo.create(info?.permitNode)
  const tagsRaw = info?.tags ?? null
  const urlStub = info?.urlStub ?? null
  const urlAncestorStub = info?.urlAncestorStub ?? null
  const lastPDFSize = info?.lastPDFSize ?? null
  const lastPDFStaticDate = info?.lastPDFStaticDate ?? null
  
  return {
    // ... campos existentes ...
    altNames,
    locatedness,
    numberPhotos,
    numberTopos,
    hasTopo,
    totalFavorites,
    kudos,
    ascentCount,
    maxPop,
    priceCategory,
    permitNode,
    tagsRaw,
    urlStub,
    urlAncestorStub,
    lastPDFSize,
    lastPDFStaticDate,
  }
}
```

### Paso 3: Actualizar Repositorios

Agregar campos a las interfaces y métodos de serialización/deserialización.

---

## 🎯 Campos Disponibles en ScrapedNodeInfo

Todos estos campos están disponibles en el scraper y solo necesitan ser mapeados:

- ✅ `altNames`
- ✅ `locatedness`
- ✅ `ascentCount`
- ✅ `numberRoutes` (Sector ya lo calcula, pero está disponible)
- ✅ `numberPhotos`
- ✅ `numberTopos`
- ✅ `hasTopo`
- ✅ `totalFavorites`
- ✅ `kudos`
- ✅ `maxPop`
- ✅ `priceCategory`
- ✅ `permitNode`
- ✅ `siblingLabel` (solo Sector)
- ✅ `urlStub`
- ✅ `urlAncestorStub`
- ✅ `lastPDFSize`
- ✅ `lastPDFStaticDate`

---

## 📊 Estado Actual

- **Base de Datos:** ✅ Lista (migración aplicada)
- **Value Objects:** ✅ Creados y exportados
- **Entidades:** ✅ Actualizadas con nuevos campos y métodos
- **Mappers:** ⚠️ Parcialmente actualizados (faltan campos de alta/media prioridad)
- **Repositorios:** ⚠️ Pendientes de actualización
- **Scraper:** ✅ Ya captura todos los datos necesarios

---

## 🚀 Próximos Pasos

1. Completar las interfaces `ValidatedCragData`, `ValidatedAreaData`, `ValidatedSectorData`
2. Actualizar los métodos `mapToCrag()`, `mapToArea()`, `mapToSector()`
3. Actualizar los métodos `createCragEntity()`, `createAreaEntity()`, `createSectorEntity()`
4. Actualizar los 3 repositorios (Sector, Crag, Area)
5. Verificar compilación
6. Probar con un scraping real

---

## 💡 Notas Importantes

- Los campos de **ALTA PRIORIDAD** son críticos para la funcionalidad de la app
- Los campos de **MEDIA PRIORIDAD** son útiles para features avanzadas
- Todos los índices están optimizados para consultas frecuentes
- Los Value Objects incluyen validación automática
- Los métodos de utilidad facilitan el uso de los nuevos datos

