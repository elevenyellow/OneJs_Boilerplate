# 📊 Análisis de Campos Faltantes - TheCrag API

**Fecha**: 2026-01-09  
**Fuente**: apiResponseRaw guardado en BD

---

## 🎯 Resumen Ejecutivo

Después de agregar `tags` al request API, tenemos **datos completos guardados**. Este documento analiza qué campos de la API **NO** estamos guardando en el schema y cuáles deberíamos agregar.

---

## 📍 SECTOR - Campos Faltantes

### ❌ Campos que NO guardamos (13 campos):

| Campo | Tipo | Descripción | Prioridad | Acción |
|-------|------|-------------|-----------|--------|
| `asciiName` | String | Nombre sin acentos | 🟢 BAJA | Ya tenemos `name` |
| `averageHeight` | Array | Altura promedio [valor, unidad] | 🟡 MEDIA | ✅ **Agregar** |
| `displayAverageHeight` | Array | Altura formateada para display | 🟢 BAJA | Derivado de `averageHeight` |
| `childIDs` | Array | IDs de hijos (rutas) | 🟢 BAJA | Relación ya existe |
| `depth` | Int | Profundidad en árbol | 🟢 BAJA | Metadata interna |
| `hasUnarchivedChildren` | Boolean | Tiene hijos activos | 🟢 BAJA | Derivable |
| `hide` | Object | Info de ocultación | 🟢 BAJA | Admin feature |
| `id` | String | ID externo (ya en externalId) | 🟢 BAJA | Ya guardado |
| `numberRoutes` | Int | Número de rutas | 🔴 ALTA | ✅ **Agregar** (ya como `routeCount`) |
| `parentID` | String | ID del padre | 🟢 BAJA | Relación ya existe |
| `redirectStubs` | Array | URLs alternativas | 🟡 MEDIA | ✅ **Agregar** |
| `subType` | String | Subtipo (Sector, Cliff) | 🟡 MEDIA | Ya guardado como `type` |
| `tlc` | Object | Top Level Crag info | 🟡 MEDIA | ✅ **Agregar** |

### ✅ Recomendación Sector:
```typescript
// Agregar al schema:
averageHeight: number | null
tlc: Json | null  // Top Level Crag reference
redirectStubs: string[]
```

---

## ⛰️ CRAG - Campos Faltantes

### ❌ Campos que NO guardamos (20 campos):

| Campo | Tipo | Descripción | Prioridad | Acción |
|-------|------|-------------|-----------|--------|
| `altNames` | Array | Nombres alternativos | 🔴 ALTA | ✅ **YA GUARDADO** |
| `asciiName` | String | Nombre sin acentos | 🟢 BAJA | Ya tenemos `name` |
| `averageHeight` | Array | Altura promedio | 🟡 MEDIA | ✅ **Agregar** |
| `displayAverageHeight` | Array | Altura formateada | 🟢 BAJA | Derivado |
| `childIDs` | Array | IDs de áreas/sectores | 🟢 BAJA | Relación existe |
| `depth` | Int | Profundidad en árbol | 🟢 BAJA | Metadata |
| `hasUnarchivedChildren` | Boolean | Tiene hijos activos | 🟢 BAJA | Derivable |
| `hide` | Object | Info de ocultación | 🟢 BAJA | Admin |
| `id` | String | ID externo | 🟢 BAJA | Ya guardado |
| `isTLC` | Boolean | Es Top Level Crag | 🔴 ALTA | ✅ **YA GUARDADO** |
| `lastPDFStaticSize` | String | Tamaño PDF estático | 🟢 BAJA | Opcional |
| `numberRoutes` | Int | Total de rutas | 🔴 ALTA | ✅ **Agregar** |
| `parentID` | String | ID del padre | 🟢 BAJA | Relación existe |
| `redirectStubs` | Array | URLs alternativas | 🟡 MEDIA | ✅ **Agregar** |
| `siblingLabel` | String | Etiqueta hermano | 🟡 MEDIA | ✅ **YA GUARDADO** |
| `subAreaCount` | Int | Número de sub-áreas | 🟡 MEDIA | ✅ **Agregar** |
| `subType` | String | Subtipo (Crag, Field) | 🟢 BAJA | Ya en `type` |
| `tags` | Object | Tags estructurados | 🔴 ALTA | ✅ **YA GUARDADO** (como tagsRaw) |
| `tlc` | Object | TLC reference | 🟡 MEDIA | ✅ **Agregar** |
| `type` | String | Tipo de nodo | 🟢 BAJA | Derivable |

### ✅ Recomendación Crag:
```typescript
// Agregar al schema:
averageHeight: number | null
numberRoutes: Int  // Total de rutas en el crag
subAreaCount: Int | null  // Número de áreas
redirectStubs: string[]
tlc: Json | null
lastPDFStaticSize: string | null
```

---

## 🗺️ AREA - Campos Faltantes

### ❌ Campos que NO guardamos (17 campos):

| Campo | Tipo | Descripción | Prioridad | Acción |
|-------|------|-------------|-----------|--------|
| `asciiName` | String | Nombre sin acentos | 🟢 BAJA | Ya tenemos `name` |
| `averageHeight` | Array | Altura promedio | 🟡 MEDIA | ✅ **Agregar** |
| `displayAverageHeight` | Array | Altura formateada | 🟢 BAJA | Derivado |
| `canDelete` | Boolean | Se puede borrar | 🟢 BAJA | Admin |
| `childIDs` | Array | IDs de sectores | 🟢 BAJA | Relación existe |
| `depth` | Int | Profundidad | 🟢 BAJA | Metadata |
| `hasUnarchivedChildren` | Boolean | Tiene hijos activos | 🟢 BAJA | Derivable |
| `hide` | Object | Info ocultación | 🟢 BAJA | Admin |
| `id` | String | ID externo | 🟢 BAJA | Ya guardado |
| `locatedness` | Int | Precisión GPS | 🔴 ALTA | ✅ **Agregar** |
| `numberRoutes` | Int | Total rutas | 🟡 MEDIA | ✅ **Agregar** |
| `parentID` | String | ID del padre | 🟢 BAJA | Relación existe |
| `permitNode` | Object | Info permisos | 🔴 ALTA | ✅ **Agregar** |
| `priceCategory` | String | Categoría precio | 🟡 MEDIA | ✅ **Agregar** |
| `redirectStubs` | Array | URLs alternativas | 🟡 MEDIA | ✅ **Agregar** |
| `siblingLabel` | String | Etiqueta hermano | 🟢 BAJA | Opcional |
| `subType` | String | Subtipo | 🟢 BAJA | Ya en `type` |
| `tlc` | Object | TLC reference | 🟡 MEDIA | ✅ **Agregar** |
| `urlAncestorStub` | String | URL ancestral | 🟡 MEDIA | ✅ **Agregar** |

### ✅ Recomendación Area:
```typescript
// Agregar al schema:
locatedness: Int | null
averageHeight: number | null
numberRoutes: Int | null
permitNode: Json | null
priceCategory: String | null
urlAncestorStub: String | null
redirectStubs: string[]
tlc: Json | null
```

---

## 🎯 Priorización de Campos a Agregar

### 🔴 ALTA PRIORIDAD (Agregar YA)

1. **`numberRoutes`** (Sector, Crag, Area)
   - **Utilidad**: Mostrar cantidad total de rutas
   - **Nota**: Ya guardado como `routeCount` en Sector

2. **`locatedness`** (Area)
   - **Utilidad**: Precisión de coordenadas GPS
   - **Nota**: Ya guardado en Sector y Crag

3. **`permitNode`** (Area)
   - **Utilidad**: Información de permisos/acceso
   - **Nota**: Ya guardado en Sector y Crag

### 🟡 MEDIA PRIORIDAD (Agregar después)

4. **`averageHeight`** (Sector, Crag, Area)
   - **Utilidad**: Altura promedio de rutas
   - **Formato**: `[17, "m"]` → convertir a número

5. **`subAreaCount`** (Crag)
   - **Utilidad**: Cuántas áreas tiene el crag
   - **Uso**: Filtros, estadísticas

6. **`redirectStubs`** (Sector, Crag, Area)
   - **Utilidad**: URLs alternativas/alias
   - **Uso**: SEO, redirecciones

7. **`tlc`** (Sector, Crag, Area)
   - **Utilidad**: Referencia al Top Level Crag
   - **Uso**: Navegación, contexto

8. **`priceCategory`** (Area)
   - **Utilidad**: Categoría de precio
   - **Nota**: Ya guardado en Sector y Crag

9. **`urlAncestorStub`** (Area)
   - **Utilidad**: URL del padre
   - **Nota**: Ya guardado en Sector y Crag

### 🟢 BAJA PRIORIDAD (Opcional)

10. **`asciiName`** - Nombre sin acentos (útil para búsqueda)
11. **`depth`** - Profundidad en árbol (útil para debugging)
12. **`lastPDFStaticSize`** - Tamaño PDF estático
13. **`subType`** - Subtipo más específico

---

## 📋 Plan de Acción Recomendado

### Fase 1: Completar campos faltantes críticos

```prisma
// Area - agregar campos críticos
model Area {
  // ... campos existentes ...
  
  locatedness: Int?
  permitNode: Json?
  priceCategory: String?
  urlAncestorStub: String?
  averageHeight: Float?
  numberRoutes: Int?
  
  // ... resto ...
}

// Crag - agregar campos faltantes
model Crag {
  // ... campos existentes ...
  
  averageHeight: Float?
  numberRoutes: Int  // Total de rutas
  subAreaCount: Int?
  redirectStubs: String[] @default([])
  tlc: Json?
  lastPDFStaticSize: String?
  
  // ... resto ...
}

// Sector - agregar campos faltantes
model Sector {
  // ... campos existentes ...
  
  averageHeight: Float?
  redirectStubs: String[] @default([])
  tlc: Json?
  
  // ... resto ...
}
```

### Fase 2: Actualizar mappers

Procesar estos campos desde `apiResponseRaw`:
- `averageHeight`: extraer el número del array `[17, "m"]`
- `numberRoutes`: mapear directamente
- `subAreaCount`: mapear directamente
- `redirectStubs`: mapear array
- `tlc`: mapear objeto completo

### Fase 3: Índices recomendados

```prisma
@@index([numberRoutes])  // Filtrar por cantidad de rutas
@@index([averageHeight])  // Filtrar por altura
@@index([locatedness])  // Filtrar por precisión GPS
```

---

## 💡 Campos que YA tenemos pero no aparecen en algunos nodos

Algunos campos aparecen en el schema pero no en todos los nodos de la API:
- `tags`: Solo 64% de sectores tienen tags
- `numberPhotos`: No todos los nodos tienen fotos
- `numberTopos`: No todos tienen topos
- `totalFavorites`: Solo algunos nodos

Esto es **normal y esperado** - no todos los nodos tienen todos los campos.

---

## ✅ Conclusión

### Campos más importantes a agregar:

1. ✅ **`averageHeight`** - En Sector, Crag, Area
2. ✅ **`numberRoutes`** - En Crag, Area (ya en Sector como `routeCount`)
3. ✅ **`subAreaCount`** - En Crag
4. ✅ **`locatedness`**, `permitNode`, `priceCategory`, `urlAncestorStub` - En Area
5. ✅ **`redirectStubs`**, `tlc` - En todos

**Nota**: La mayoría de campos "faltantes" son metadata interna o derivables. Los campos críticos para usuarios (orientación, tipo de roca, fotos, topos, favoritos, etc.) **ya los tenemos** ✅

