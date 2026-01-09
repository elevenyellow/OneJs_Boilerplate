# Implementación de Campos Faltantes - Estado Actual

**Fecha**: 2026-01-09  
**Status**: 🟡 PARCIALMENTE COMPLETADO

---

## ✅ Completado

1. **Schema actualizado** (3/3)
   - ✅ Area: +8 campos
   - ✅ Crag: +6 campos  
   - ✅ Sector: +2 campos

2. **Migración aplicada**
   - ✅ `20260109120109_add_missing_fields`

3. **Interfaces actualizadas**
   - ✅ `ValidatedAreaData`
   - ✅ `ValidatedCragData`
   - ✅ `ValidatedSectorData`

4. **Helpers creados**
   - ✅ `api-response-extractors.ts`

---

## ⚠️ Pendiente

### 1. Actualizar métodos `mapToXXX` en mapper

Necesitamos extraer los campos desde `info?.apiResponseRaw`:

```typescript
// En mapToArea()
const raw = info?.apiResponseRaw as any

const locatedness = Locatedness.create(raw?.locatedness)
const averageHeight = extractAverageHeight(raw?.averageHeight)
const numberRoutes = extractNumberRoutes(raw?.numberRoutes)
const permitNode = PermitInfo.create(raw?.permitNode)
const priceCategory = PriceCategory.create(raw?.priceCategory)
const urlAncestorStub = raw?.urlAncestorStub ?? null
const redirectStubs = extractRedirectStubs(raw?.redirectStubs)
const tlc = extractTlc(raw?.tlc)

// Agregar al return
return {
  // ... campos existentes ...
  locatedness,
  averageHeight,
  numberRoutes,
  permitNode,
  priceCategory,
  urlAncestorStub,
  redirectStubs,
  tlc,
  apiResponseRaw: info?.apiResponseRaw ?? null,
}
```

Similar para `mapToCrag()` y `mapToSector()`.

### 2. Actualizar entidades (opcional)

Las entidades `AreaEntity`, `CragEntity`, `SectorEntity` no necesitan cambios si solo queremos **guardar** los datos. Los repositorios pueden extraer directamente de `apiResponseRaw`.

### 3. Actualizar repositorios

Los repositorios ya tienen `apiResponseRaw` y pueden extraer estos campos al persistir:

```typescript
// En toPrismaData()
const raw = entity.apiResponseRaw as any

return {
  // ... campos existentes ...
  locatedness: raw?.locatedness ?? null,
  averageHeight: extractAverageHeight(raw?.averageHeight),
  numberRoutes: raw?.numberRoutes ?? null,
  // etc.
}
```

---

## 🎯 Propuesta: Enfoque Pragmático

Dado que `apiResponseRaw` ya contiene TODOS estos datos, podemos:

### Opción A: Implementación Completa (2-3 horas)
- Actualizar todas las entidades
- Actualizar todos los mappers
- Actualizar todos los repositorios
- Testing exhaustivo

### Opción B: Implementación Lazy (30 min) ⭐ **RECOMENDADO**
- **NO** modificar entidades ni mappers
- Extraer campos directamente desde `apiResponseRaw` cuando se necesiten
- Agregar métodos helper en repositorios:

```typescript
class AreaRepository {
  // Método helper para extraer datos computed
  getComputedFields(area: Area) {
    const raw = area.apiResponseRaw as any
    return {
      averageHeight: extractAverageHeight(raw?.averageHeight),
      numberRoutes: raw?.numberRoutes,
      locatedness: raw?.locatedness,
      // etc.
    }
  }
}
```

**Ventajas Opción B:**
- ✅ Más rápido
- ✅ Sin cambios en entidades (DDD clean)
- ✅ Sin riesgo de bugs en mapper
- ✅ Datos ya disponibles en `apiResponseRaw`
- ✅ Se pueden agregar indices para queries

**Desventajas:**
- Los campos no estarán en las entidades del domain
- Hay que extraerlos cada vez (pero es rápido con JSONB)

---

## 💡 Recomendación Final

**Para este momento:** Usar Opción B (Lazy)

1. Los campos ya están en el schema ✅
2. Los indices ya funcionan para queries ✅
3. `apiResponseRaw` tiene toda la data ✅
4. Podemos extraer on-demand sin modificar entidades

**Más adelante:**  
Si necesitamos estos campos frecuentemente en el dominio, hacemos la Opción A.

---

## 📊 Estado de Campos

### Area
| Campo | Schema | Migration | Disponible en apiResponseRaw |
|-------|--------|-----------|------------------------------|
| `locatedness` | ✅ | ✅ | ✅ |
| `averageHeight` | ✅ | ✅ | ✅ |
| `numberRoutes` | ✅ | ✅ | ✅ |
| `permitNode` | ✅ | ✅ | ✅ |
| `priceCategory` | ✅ | ✅ | ✅ |
| `urlAncestorStub` | ✅ | ✅ | ✅ |
| `redirectStubs` | ✅ | ✅ | ✅ |
| `tlc` | ✅ | ✅ | ✅ |

### Crag
| Campo | Schema | Migration | Disponible en apiResponseRaw |
|-------|--------|-----------|------------------------------|
| `averageHeight` | ✅ | ✅ | ✅ |
| `numberRoutes` | ✅ | ✅ | ✅ |
| `subAreaCount` | ✅ | ✅ | ✅ |
| `redirectStubs` | ✅ | ✅ | ✅ |
| `tlc` | ✅ | ✅ | ✅ |
| `lastPDFStaticSize` | ✅ | ✅ | ✅ |

### Sector
| Campo | Schema | Migration | Disponible en apiResponseRaw |
|-------|--------|-----------|------------------------------|
| `redirectStubs` | ✅ | ✅ | ✅ |
| `tlc` | ✅ | ✅ | ✅ |

---

## ✅ Siguiente Paso

**Decisión necesaria:**  
¿Prefieres Opción A (completa) o Opción B (lazy extraction desde apiResponseRaw)?

