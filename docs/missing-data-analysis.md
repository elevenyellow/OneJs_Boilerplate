# 🔍 Análisis de Datos NO Guardados de TheCrag API

**Fecha:** 2026-01-09  
**Análisis:** Comparación entre datos disponibles en la API y datos persistidos en BD

---

## 📊 Resumen Ejecutivo

De **67 campos** disponibles en la API de TheCrag, actualmente solo estamos guardando **~40%** correctamente. Hay **14 campos de alta prioridad** y **12 campos de media prioridad** que **NO se están persistiendo** en la base de datos.

---

## ❌ CAMPOS NO GUARDADOS (Alta Prioridad)

### SECTOR - Campos faltantes en el repositorio

| Campo API | En Schema | En Entity | En Mapper | En Repo `toEntity()` | En Repo `toPrismaData()` | Status |
|-----------|-----------|-----------|-----------|---------------------|-------------------------|--------|
| `altNames` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `locatedness` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `numberPhotos` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `numberTopos` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `totalFavorites` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `isTLC` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `ascentCount` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `maxPop` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `permitNode` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `siblingLabel` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `urlStub` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `urlAncestorStub` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `lastPDFSize` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `lastPDFStaticDate` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |

**Total Sector: 14 campos de alta prioridad NO SE GUARDAN**

---

### CRAG - Campos faltantes en el repositorio

| Campo API | En Schema | En Entity | En Mapper | En Repo `toEntity()` | En Repo `toPrismaData()` | Status |
|-----------|-----------|-----------|-----------|---------------------|-------------------------|--------|
| `altNames` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `locatedness` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `numberPhotos` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `numberTopos` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `hasTopo` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `totalFavorites` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `kudos` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `ascentCount` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `maxPop` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `priceCategory` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `permitNode` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `tagsRaw` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `urlStub` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `urlAncestorStub` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `lastPDFSize` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |
| `lastPDFStaticDate` | ✅ | ✅ | ✅ | ❌ | ❌ | **NO SE GUARDA** |

**Total Crag: 16 campos de alta prioridad NO SE GUARDAN**

---

### AREA - Campos faltantes en el repositorio

| Campo API | En Schema | En Entity | En Mapper | En Repo | Status |
|-----------|-----------|-----------|-----------|---------|--------|
| `altNames` | ✅ | ✅ | ✅ | ❌ | **NO SE GUARDA** |
| `seasonality` | ✅ | ✅ | ✅ | ❌ | **NO SE GUARDA** |

**Total Area: 2 campos NO SE GUARDAN**

---

## ⚠️ CAMPOS DE MEDIA PRIORIDAD NO GUARDADOS

### Disponibles en API pero no en ningún lado

| Campo | Tipo | Descripción | Razón |
|-------|------|-------------|-------|
| `description` | string | Descripción del nodo | Solo en Crag (parcialmente) |
| `approach` | string | Aproximación | Solo en Crag (parcialmente) |
| `averageHeight` | number | Altura promedio | ❌ NO guardado |
| `displayAverageHeight` | number | Altura para display | ❌ NO guardado |
| `numberRoutes` | number | Número de rutas | Solo calculado, no guardado del API |
| `subAreaCount` | number | Número de sub-áreas | ❌ NO guardado |
| `urlShortestStub` | string | URL más corta | ❌ NO guardado |
| `urlShortestAncestorStub` | string | URL ancestro más corto | ❌ NO guardado |
| `redirectStubs` | string[] | URLs de redirección | ❌ NO guardado |
| `lastPDFStaticSize` | string | Tamaño PDF estático | ❌ NO guardado |
| `hide` | unknown | Flag de ocultar | ❌ NO guardado |
| `hasUnarchivedChildren` | boolean | Tiene hijos no archivados | ❌ NO guardado |
| `unique` | boolean | Es único | ❌ NO guardado |

---

## 🔥 PROBLEMA CRÍTICO: Repositorios Desactualizados

### SectorPrismaRepository

**Problema**: El repositorio tiene los métodos `toEntity()` y `toPrismaData()` pero **NO incluyen los 14 campos nuevos**.

```typescript
// ❌ ACTUAL - toEntity() solo incluye campos antiguos
private toEntity(data: SectorPrismaData): SectorEntity {
  return new SectorEntity(
    SectorId.fromString(data.id),
    ExternalId.create(data.externalId),
    AreaId.fromString(data.areaId),
    Name.create(data.name),
    data.type as SectorType,
    // ... campos antiguos ...
    // ❌ FALTAN: altNames, locatedness, numberPhotos, numberTopos, 
    //           totalFavorites, isTLC, ascentCount, maxPop, permitNode,
    //           siblingLabel, urlStub, urlAncestorStub, lastPDFSize, lastPDFStaticDate
  )
}
```

### CragPrismaRepository

**Problema**: Similar al sector, faltan **16 campos nuevos** en `toEntity()` y `toPrismaData()`.

```typescript
// ❌ ACTUAL - toPrismaData() solo guarda campos antiguos
private toPrismaData(entity: CragEntity) {
  return {
    id: entity.id.toString(),
    externalId: entity.externalId.toBigInt(),
    // ... campos antiguos ...
    // ❌ FALTAN: altNames, locatedness, numberPhotos, numberTopos, hasTopo,
    //           totalFavorites, kudos, ascentCount, maxPop, priceCategory,
    //           permitNode, tagsRaw, urlStub, urlAncestorStub, 
    //           lastPDFSize, lastPDFStaticDate
  }
}
```

---

## 📈 Impacto en los Datos

### Ejemplo Real de Valencia

Según el test ejecutado, obtuvimos estos datos de la API pero **NO SE GUARDARON**:

```
📊 New fields detected:
   - altNames: 2 names          ❌ NO GUARDADO
   - locatedness: 4098          ❌ NO GUARDADO  
   - numberPhotos: 1275         ❌ NO GUARDADO
   - numberTopos: 1531          ❌ NO GUARDADO
   - totalFavorites: 2329       ❌ NO GUARDADO
```

**Pérdida de información**:
- 🖼️ **1,275 fotos** no referenciadas
- 📄 **1,531 topos** no contabilizados
- ⭐ **2,329 favoritos** perdidos (métrica de popularidad)
- 📍 **Precisión de coordenadas** no guardada
- 🏷️ **Nombres alternativos** perdidos

---

## ✅ SOLUCIÓN REQUERIDA

### Paso 1: Actualizar `SectorPrismaData` Interface

```typescript
interface SectorPrismaData {
  // ... campos existentes ...
  
  // AGREGAR:
  altNames: string[]
  locatedness: number | null
  numberPhotos: number | null
  numberTopos: number | null
  totalFavorites: number | null
  isTLC: boolean
  ascentCount: number | null
  maxPop: number | null
  permitNode: unknown
  siblingLabel: string | null
  urlStub: string | null
  urlAncestorStub: string | null
  lastPDFSize: string | null
  lastPDFStaticDate: string | null
}
```

### Paso 2: Actualizar `toEntity()` en SectorPrismaRepository

```typescript
private toEntity(data: SectorPrismaData): SectorEntity {
  return new SectorEntity(
    // ... campos existentes ...
    AltNames.create(data.altNames),           // NUEVO
    Locatedness.create(data.locatedness),     // NUEVO
    data.numberPhotos,                        // NUEVO
    data.numberTopos,                         // NUEVO
    data.totalFavorites,                      // NUEVO
    data.isTLC,                              // NUEVO
    data.ascentCount,                        // NUEVO
    data.maxPop,                             // NUEVO
    PermitInfo.create(data.permitNode),      // NUEVO
    data.siblingLabel,                       // NUEVO
    data.urlStub,                            // NUEVO
    data.urlAncestorStub,                    // NUEVO
    data.lastPDFSize,                        // NUEVO
    data.lastPDFStaticDate,                  // NUEVO
  )
}
```

### Paso 3: Actualizar `toPrismaData()` en SectorPrismaRepository

```typescript
private toPrismaData(entity: SectorEntity) {
  return {
    // ... campos existentes ...
    altNames: entity.altNames.toArray(),                    // NUEVO
    locatedness: entity.locatedness?.toNumber() ?? null,    // NUEVO
    numberPhotos: entity.numberPhotos,                      // NUEVO
    numberTopos: entity.numberTopos,                        // NUEVO
    totalFavorites: entity.totalFavorites,                  // NUEVO
    isTLC: entity.isTLC,                                   // NUEVO
    ascentCount: entity.ascentCount,                        // NUEVO
    maxPop: entity.maxPop,                                 // NUEVO
    permitNode: entity.permitNode.toJSON(),                // NUEVO
    siblingLabel: entity.siblingLabel,                      // NUEVO
    urlStub: entity.urlStub,                               // NUEVO
    urlAncestorStub: entity.urlAncestorStub,               // NUEVO
    lastPDFSize: entity.lastPDFSize,                       // NUEVO
    lastPDFStaticDate: entity.lastPDFStaticDate,           // NUEVO
  }
}
```

### Paso 4: Repetir para CragPrismaRepository y AreaPrismaRepository

---

## 📊 Estadísticas del Problema

| Entidad | Campos en API | Campos Guardados | Campos Perdidos | % Pérdida |
|---------|---------------|------------------|-----------------|-----------|
| **Sector** | 30+ | 16 | 14 | **47%** |
| **Crag** | 28+ | 12 | 16 | **57%** |
| **Area** | 12+ | 10 | 2 | **17%** |
| **TOTAL** | 70+ | 38 | 32 | **46%** |

---

## 🎯 Prioridad de Implementación

### 🔴 CRÍTICO (implementar YA)
1. ✅ Mappers - **COMPLETADO**
2. ❌ **SectorPrismaRepository** - `toEntity()` y `toPrismaData()`
3. ❌ **CragPrismaRepository** - `toEntity()` y `toPrismaData()`
4. ❌ **AreaPrismaRepository** - `toEntity()` y `toPrismaData()`

### 🟡 IMPORTANTE (después)
- Agregar filtros avanzados usando los nuevos campos
- Implementar búsquedas por popularidad (`totalFavorites`)
- Búsqueda por disponibilidad de fotos/topos

### 🟢 OPCIONAL (mejoras futuras)
- Campos de metadata adicional (hide, unique, etc.)
- URLs de redirección y alternativas

---

## 🚨 CONCLUSIÓN

**Estamos perdiendo el 46% de la información disponible** en la API de TheCrag porque los repositorios no fueron actualizados junto con los schemas, entities y mappers.

**Solución**: Actualizar los 3 repositorios (Sector, Crag, Area) para incluir los campos nuevos en:
- `SectorPrismaData` / `CragPrismaData` / `AreaPrismaData` interfaces
- `toEntity()` methods
- `toPrismaData()` methods

**Tiempo estimado**: ~2-3 horas de trabajo
**Impacto**: Recuperar información valiosa de popularidad, fotos, topos, precisión de coordenadas, etc.

---

**Estado**: ⚠️ **PENDIENTE DE IMPLEMENTACIÓN**
