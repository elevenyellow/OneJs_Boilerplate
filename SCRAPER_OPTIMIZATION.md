# Scraper Optimization - Performance Improvements

## Fecha: 2026-01-08

## Cambios Aplicados

### 1. **Reducción del delay entre requests**
- **Antes**: 100ms
- **Ahora**: 50ms
- **Archivo**: `packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper.ts`
- **Mejora esperada**: 2x más rápido en requests secuenciales

### 2. **Paralelización de llamadas internas en el scraper**
- **Cambio**: En el método `traverse()`, ahora se hacen las 3 llamadas principales en paralelo:
  - `getNodeInfo()`
  - `getChildren()`
  - `getRoutes()` (si aplica)
- **Antes**: Secuencial con delays entre cada llamada
- **Ahora**: Paralelo con `Promise.all()`
- **Archivo**: `packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper.ts`
- **Mejora esperada**: 3x más rápido por nodo

### 3. **Procesamiento de hijos en lotes con concurrencia limitada**
- **Nueva función**: `traverseChildrenInBatches()` en el scraper
- **Lógica**: Procesa 3 nodos hijos en paralelo a la vez
- **Archivo**: `packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper.ts`
- **Mejora esperada**: 3x más rápido en nodos con muchos hijos

### 4. **Paralelización en el Job de scraping**
- **Nueva función helper**: `processBatch()` para procesar items en lotes paralelos
- **Cambios aplicados en**:
  - Procesamiento de hijos de crags (líneas 268-279, 284-295)
  - Procesamiento de hijos de regiones (líneas 323-333)
  - Procesamiento de hijos de áreas (líneas 392-403, 424-434)
  - Paralelización de `getNodeInfo()` y `getRoutes()` en `scrapeAndSaveCragChild()`
  - Paralelización de `getNodeInfo()` y `checkHasRoutes()` en `scrapeAndSaveNode()`
- **Archivo**: `packages/scraper-thecrag/infrastructure/jobs/scrape-country.job.ts`
- **Mejora esperada**: 3-5x más rápido en el procesamiento general

## Mejora Total Esperada

**Estimación conservadora**: 5-8x más rápido
**Estimación optimista**: 10-15x más rápido (dependiendo de la estructura del crag)

## Ejemplo de Mejora

Si antes tardaba **30 minutos** en scrapear un país:
- Con estas optimizaciones: **4-6 minutos**

Si antes tardaba **2 horas**:
- Con estas optimizaciones: **15-24 minutos**

## Configuración de Concurrencia

- **Batch size**: 3 nodos en paralelo
- **Delay entre requests**: 50ms
- **Requests paralelos por nodo**: 2-3 (info, children, routes)

## Seguridad y Rate Limiting

- Se mantiene el delay de 50ms para evitar sobrecarga en TheCrag
- La concurrencia está limitada a 3 nodos simultáneos para evitar ser bloqueados
- El procesamiento sigue siendo incremental (guarda en DB inmediatamente)

## Cómo Probar

1. **Limpiar la cola actual**:
```bash
bun run scripts/clear-scrape-queue.ts
```

2. **Encolar países nuevamente**:
```bash
bun run scripts/enqueue-countries.ts
```

3. **Monitorear el progreso**:
- Los logs mostrarán el tiempo por región
- Comparar con los tiempos anteriores

## Rollback

Si hay problemas (ej: TheCrag bloquea las requests), puedes:

1. **Aumentar el delay**:
```typescript
// En thecrag-api.scraper.ts línea 31
private delayMs: number = 100 // o 200
```

2. **Reducir la concurrencia**:
```typescript
// En scrape-country.job.ts, cambiar el batch size
const BATCH_SIZE = 1 // procesamiento secuencial
```

## Notas Técnicas

- Los cambios son **backward compatible**
- No afecta la lógica de guardado en DB
- El job sigue siendo incremental y resistente a fallos
- Los progress updates se mantienen cada 30 segundos

## Próximas Optimizaciones (Opcionales)

Si se necesita aún más velocidad:
1. Aumentar batch size a 5 (si TheCrag lo permite)
2. Implementar pool de conexiones HTTP reutilizables
3. Cachear resultados de `getNodeInfo()` para nodos repetidos
4. Usar streaming para procesar datos más grandes
