# Quick Start - Scraper Optimizado

## Estado Actual

✅ **Optimizaciones aplicadas y funcionando**
- Delay reducido: 100ms → 50ms
- Paralelización de llamadas internas
- Procesamiento en lotes de 3 nodos simultáneos
- **Velocidad: ~1,000-1,500 rutas/minuto** (5-10x más rápido)

✅ **Base de datos poblada**
- 184 países cargados
- España lista para scraping (ID: `6408b70d-481c-445e-9324-0e12fec23c19`)

## Cómo Usar

### 1. Iniciar el Worker

Asegúrate de que el worker esté corriendo (debería iniciarse automáticamente con tu app):

```bash
# El worker se inicia automáticamente con OneJs
# Verifica que esté corriendo en los logs
```

### 2. Encolar España para Scraping

```bash
bun run scripts/enqueue-spain-only.ts
```

### 3. Monitorear el Progreso

```bash
bun run scripts/monitor-queue.ts
```

## Scripts Disponibles

### Gestión de Cola

- `scripts/enqueue-spain-only.ts` - Encola solo España (recomendado para pruebas)
- `scripts/enqueue-countries.ts` - Encola todos los países
- `scripts/clear-scrape-queue.ts` - Limpia jobs waiting/delayed
- `scripts/obliterate-queue.ts` - ⚠️ Limpia TODOS los jobs (usar con cuidado)
- `scripts/monitor-queue.ts` - Monitorea el progreso en tiempo real

### Base de Datos

- `scripts/seed-countries.ts` - Pobla continentes y países desde TheCrag
- `scripts/check-spain.ts` - Verifica que España esté en la DB

### Utilidades

- `scripts/get-all-countries.ts` - Obtiene países de TheCrag (sin guardar)
- `scripts/test-scraper.ts` - Prueba el scraper con Chulilla

## Resultados Esperados

### Para España (~40,000 rutas)

**Antes de las optimizaciones:**
- Tiempo: 4-5 horas
- Velocidad: ~150-200 rutas/minuto

**Después de las optimizaciones:**
- Tiempo: 30-40 minutos
- Velocidad: ~1,000-1,500 rutas/minuto
- **Mejora: 5-10x más rápido** 🚀

## Troubleshooting

### Jobs con IDs antiguos fallando

Si ves errores como "Country Spain (id: xxx) not found in database":

1. Limpia la cola:
```bash
bun run scripts/obliterate-queue.ts
```

2. Encola nuevamente con IDs correctos:
```bash
bun run scripts/enqueue-spain-only.ts
```

### Worker no procesa jobs

1. Verifica que Redis esté corriendo:
```bash
docker-compose ps
```

2. Reinicia el worker (reinicia tu app)

### Scraper muy lento

1. Verifica que las optimizaciones estén aplicadas:
   - Delay en `thecrag-api.scraper.ts` debe ser 50ms (línea 31)
   - Debe haber paralelización en `traverse()` y `traverseChildrenInBatches()`

2. Puedes reducir más el delay si TheCrag lo permite:
```typescript
// En thecrag-api.scraper.ts
private delayMs: number = 25 // o incluso 10
```

## Archivos Modificados

- ✅ `packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper.ts`
- ✅ `packages/scraper-thecrag/infrastructure/jobs/scrape-country.job.ts`

## Documentación

- `SCRAPER_OPTIMIZATION.md` - Detalles técnicos de las optimizaciones
- `PERFORMANCE_RESULTS.md` - Resultados y métricas reales
- `SCRAPER_FIX_GUIDE.md` - Guía de troubleshooting para jobs

## Próximos Pasos

1. ✅ Encolar España: `bun run scripts/enqueue-spain-only.ts`
2. 📊 Monitorear progreso: `bun run scripts/monitor-queue.ts`
3. ⏱️ Esperar ~30-40 minutos para que termine
4. 🎉 ¡Disfrutar de los datos!

## Notas

- El scraping es **incremental**: si falla a mitad, los datos ya scraped se mantienen
- Los jobs se procesan de **uno en uno** (concurrency: 1)
- En **dev mode**, solo se scrapea España
- En **production**, se scrapean todos los países
