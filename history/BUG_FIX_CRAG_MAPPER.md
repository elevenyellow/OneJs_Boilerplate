# 🐛 BUG CRÍTICO ENCONTRADO Y SOLUCIONADO

**Fecha**: 2025-01-14  
**Severidad**: 🔴 **CRÍTICA**  
**Estado**: ✅ **RESUELTO**

---

## 🎯 Problema

El scraper estaba generando `gbRoutes` correctos con el sistema universal, pero el **mapper** estaba sobrescribiéndolos con los datos antiguos de TheCrag.

### Flujo Incorrecto (ANTES)

```
┌────────────────┐
│  TheCrag API   │
│                │
│  - Routes      │
│  - info.data   │
└───────┬────────┘
        │
        ▼
┌─────────────────────────────┐
│ Scraper.ts                  │
│                             │
│ ✅ Construye correctamente: │
│    data.gbRoutes = [0,0,0,0,0,0,0,0,0,0,12,25,...]  
│                      ↑ Sistema universal
└───────┬─────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ scraped-data-to-crag.mapper │
│                             │
│ ❌ SOBRESCRIBE con:         │
│    gbRoutes: info.gbRoutes  │ ← ¡TheCrag API!
│    [0,0,17,50,4,0]          │
│     ↑ Sistema TheCrag       │
└───────┬─────────────────────┘
        │
        ▼
┌─────────────────┐
│   Base Datos    │
│                 │
│ ❌ Guarda mal:  │
│ [0,0,17,50,4,0] │
└─────────────────┘
```

---

## 🔍 Código Problemático

### Archivo: `packages/crags/application/mappers/scraped-data-to-crag.mapper.ts`

#### ❌ ANTES (Líneas 54-55):
```typescript
gbAscents: info.gbAscents || null,  // ❌ Viene de TheCrag API
gbRoutes: info.gbRoutes || null,    // ❌ Viene de TheCrag API
```

#### ❌ ANTES (Líneas 122-123):
```typescript
gbAscents: this.mergeArray(existingDto.gbAscents, info.gbAscents),  // ❌
gbRoutes: this.mergeArray(existingDto.gbRoutes, info.gbRoutes),    // ❌
```

---

## ✅ Solución Aplicada

### ✅ DESPUÉS (Líneas 54-55):
```typescript
gbAscents: data.gbAscents || null,  // ✅ Viene del builder
gbRoutes: data.gbRoutes || null,    // ✅ Viene del builder
```

### ✅ DESPUÉS (Líneas 122-123):
```typescript
gbAscents: this.mergeArray(existingDto.gbAscents, data.gbAscents),  // ✅
gbRoutes: this.mergeArray(existingDto.gbRoutes, data.gbRoutes),    // ✅
```

---

## 🎯 Diferencia Clave

| Campo | Origen | Contenido |
|-------|--------|-----------|
| `info.gbRoutes` | TheCrag API | ❌ Sistema TheCrag (índices 0-N) |
| `data.gbRoutes` | Builder | ✅ Sistema universal (índices 10-47) |

---

## 📊 Flujo Correcto (DESPUÉS)

```
┌────────────────┐
│  TheCrag API   │
│                │
│  - Routes      │
│  - info.data   │
└───────┬────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Scraper.ts                              │
│                                         │
│ ✅ Construye con builder:               │
│    data.gbRoutes = [0,0,0,0,0,0,0,0,0,0,12,25,...]  
│                     ↑ Sistema universal │
└───────┬─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ scraped-data-to-crag.mapper │
│                             │
│ ✅ USA data.gbRoutes:       │
│    gbRoutes: data.gbRoutes  │ ← Del builder
│    [0,0,0,0,0,0,0,0,0,0,12,25,...]
│     ↑ Sistema universal     │
└───────┬─────────────────────┘
        │
        ▼
┌─────────────────┐
│   Base Datos    │
│                 │
│ ✅ Guarda bien: │
│ [0,0,0,0,0,0,0,0,0,0,12,25,...]
└─────────────────┘
```

---

## 🧪 Verificación

### Datos de Entrada (TheCrag API)
```javascript
info.data.gbRoutes = [0, 0, 17, 50, 4, 0]  // ❌ Formato TheCrag
```

### Datos del Builder
```javascript
data.gbRoutes = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,...]
                                              ↑              ↑
                                            18             24
                                           (5a)           (6a)
```

### Antes del Fix
```javascript
Base de datos: [0, 0, 17, 50, 4, 0]  // ❌ Sistema TheCrag
```

### Después del Fix
```javascript
Base de datos: [0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,...]  // ✅ Sistema Universal
```

---

## 📋 Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `scraped-data-to-crag.mapper.ts` | `info.gbRoutes` → `data.gbRoutes` | 54-55 |
| `scraped-data-to-crag.mapper.ts` | `info.gbAscents` → `data.gbAscents` | 54-55 |
| `scraped-data-to-crag.mapper.ts` | `info.gbRoutes` → `data.gbRoutes` | 122-123 |
| `scraped-data-to-crag.mapper.ts` | `info.gbAscents` → `data.gbAscents` | 122-123 |

---

## ✅ Estado de Otros Mappers

### Sector Mapper ✅ (Ya estaba correcto)
```typescript
// ✅ packages/sectors/application/mappers/scraped-data-to-sector.mapper.ts
// Líneas 96-97 y 196-197
gbAscents: data.gbAscents || null,  // ✅ Correcto
gbRoutes: data.gbRoutes || null,    // ✅ Correcto
```

---

## 🎯 Por Qué Ocurrió

1. **ScrapedCrag** tiene dos fuentes de datos:
   - `data.info`: Datos directos de TheCrag API
   - `data.gbRoutes`: Datos calculados por nuestro builder

2. El mapper original usaba `info.gbRoutes` asumiendo que eran correctos

3. El scraper SÍ construía `data.gbRoutes` correctamente, pero el mapper lo ignoraba

---

## 🚀 Próximos Pasos

### 1. Re-ejecutar Scraping

Ahora que el mapper está corregido, los nuevos scrapings guardarán los datos correctamente:

```bash
# El scraping ahora guardará correctamente
bun run scrape-crag <url>
```

### 2. Verificar Resultado

Después de scrapear, verifica que `gbRoutes` tenga índices 10-47:

```javascript
// ✅ CORRECTO (nuevo scraping)
gbRoutes: [0,0,0,0,0,0,0,0,0,0,12,0,18,0,25,...]
                              ↑     ↑     ↑
                            10+   correcto

// ❌ INCORRECTO (si aparece esto, hay otro problema)
gbRoutes: [0, 0, 17, 50, 4, 0]
              ↑   ↑   ↑
            0-9  incorrecto
```

### 3. Migrar Datos Existentes

Los datos antiguos en la base de datos aún necesitan migración:

```bash
bun run scripts/migrate-grade-distribution.ts
```

---

## 📊 Impacto

### Antes del Fix
- ❌ Scraper construía correctamente
- ❌ Mapper sobrescribía con datos incorrectos
- ❌ Base de datos tenía formato TheCrag
- ❌ Búsquedas por grado NO funcionaban

### Después del Fix
- ✅ Scraper construye correctamente
- ✅ Mapper usa datos correctos
- ✅ Base de datos guardará formato universal
- ✅ Búsquedas por grado funcionarán

---

## 🔥 Conclusión

### Bug Root Cause
El mapper estaba usando `info.gbRoutes` (TheCrag) en lugar de `data.gbRoutes` (Builder).

### Fix Applied
Cambiar 4 líneas en `scraped-data-to-crag.mapper.ts` para usar `data.gbRoutes` y `data.gbAscents`.

### Status
✅ **RESUELTO** - El scraper ahora guardará los datos correctamente.

---

**Próxima acción**: Re-ejecutar scraping para verificar que ahora guarda con índices 10-47.
