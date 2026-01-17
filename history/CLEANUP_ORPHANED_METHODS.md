# Eliminación de Endpoints Huérfanos - Resumen Final

## Fecha
15 de enero de 2025

## Contexto
Se eliminaron los endpoints `/api/sectors/:sectorId/details-with-hierarchy` y `/api/sectors/:sectorId/topos-with-areas` del controlador de sectores, junto con todos los métodos y DTOs huérfanos que solo eran usados por estos endpoints.

## Archivos Eliminados

### Controllers
- ❌ `/apps/api/src/sectors/controllers/sectors.controller.ts`
- ❌ `/apps/api/src/sectors/` (carpeta completa)

### Use Cases
- ❌ `/packages/sectors/application/use-cases/get-sector-details-with-hierarchy.use-case.ts`
- ❌ `/packages/topos/application/use-cases/get-topos-for-sector-with-areas.use-case.ts`

### Tests
- ❌ `/packages/sectors/application/use-cases/__tests__/get-sector-details-with-hierarchy.use-case.test.ts`

### DTOs (solo los relacionados con sectores)
- ❌ `/packages/sectors/application/dtos/sector-details-with-hierarchy.dto.ts`
- ❌ `/packages/sectors/application/dtos/sector-photo-with-areas.dto.ts`
- ❌ `/packages/topos/application/dtos/topo-with-areas.dto.ts`
- ❌ `/packages/topos/application/dtos/route-line-annotation.dto.ts`

### Documentación
- ❌ `SECTOR_PHOTO_VIEWER_TESTING.md`
- ❌ `SECTOR_PHOTO_VIEWER_IMPLEMENTATION_COMPLETE.md`

## Archivos MANTENIDOS (porque SÍ se usan)

### Use Cases
- ✅ `/packages/crags/application/use-cases/get-crag-overview-with-sectors.use-case.ts` - Usado por `CragsController`

### DTOs
- ✅ `/packages/crags/application/dtos/crag-overview-with-sectors.dto.ts` - Usado por el endpoint de crags
- ✅ `/packages/topos/application/dtos/sector-area-annotation.dto.ts` - Usado por `CragOverviewPhotoDto`

### Endpoints activos
- ✅ `GET /api/crags/:cragId/overview-photo-with-sectors` - Funcional en `CragsController`

## Métodos Huérfanos Eliminados de Repositorios

### RouteRepository (`packages/routes/infrastructure/persistence/prisma/route.repository.ts`)
Eliminados (no se usaban en ningún lado):
- ❌ `findById(id: Id)`
- ❌ `findByCragId(cragId: Id)`
- ❌ `findBySectorId(sectorId: SectorId)`
- ❌ `findByGradeBand(cragId: Id, gradeBand: GradeBand)`
- ❌ `findClassics(cragId: Id, minStars: Stars)`
- ❌ `findSportRoutes(cragId: Id)`
- ❌ `findTradRoutes(cragId: Id)`
- ❌ `findBoulderProblems(cragId: Id)`

Mantenidos (sí se usan):
- ✅ `findByExternalId(externalId: ExternalId)` - Usado por `ScrapeCragUseCase`
- ✅ `save(route: Route)` - Usado por `ScrapeCragUseCase`
- ✅ `existsByExternalId(externalId: ExternalId)` - Método auxiliar

### TopoPrismaRepository (`packages/topos/infrastructure/persistence/prisma/topo.repository.ts`)
Eliminados (no se usaban):
- ❌ `findById(id: Id)`
- ❌ `findByCragId(cragId: Id)`
- ❌ `findBySectorId(sectorId: SectorId)`

Mantenidos (sí se usan):
- ✅ `findByExternalId(externalId: ExternalId)` - Usado por mapper
- ✅ `findOverviewTopos(cragId: Id)` - Usado por `GetCragOverviewWithSectorsUseCase`
- ✅ `save(topo: Topo)` - Usado por `ScrapeCragUseCase`
- ✅ `existsByExternalId(externalId: ExternalId)` - Método auxiliar

## Imports Eliminados

Se removieron imports no utilizados:
- ❌ `import { GradeBand, Id, Stars } from '../../../domain/value-objects'` (RouteRepository)
- ❌ `import { Id as SectorId } from '@sectors/domain/value-objects'` (ambos repositorios)

## Archivos Actualizados

### Index Files
- ✅ `/packages/sectors/application/dtos/index.ts` - Limpiado (no exports)
- ✅ `/packages/topos/application/dtos/index.ts` - Mantiene `SectorAreaAnnotationDto`
- ✅ `/packages/crags/application/dtos/index.ts` - Mantiene `CragOverviewWithSectorsDto` y `CragOverviewPhotoDto`

### Repositorios
- ✅ `/packages/routes/infrastructure/persistence/prisma/route.repository.ts` - 8 métodos eliminados
- ✅ `/packages/topos/infrastructure/persistence/prisma/topo.repository.ts` - 3 métodos eliminados, 1 refactorizado (`save`)

## Cambios en el Método `save` de TopoPrismaRepository

El método `save` usaba `findById` internamente. Se refactorizó para usar `findOne` directamente:

```typescript
// ANTES
const result = await this.findById(Id.createFrom(data.id))
return result!

// DESPUÉS
const result = await this.findOne({
  where: { id: data.id },
  include: { annotations: true },
})

if (!result) {
  throw new Error(`Failed to fetch saved topo with id ${data.id}`)
}

return this.mapToDomain(result)
```

## Verificación

✅ Compilación TypeScript: Sin errores en archivos modificados
✅ Referencias rotas: Ninguna encontrada
✅ Métodos huérfanos: Todos eliminados
✅ Imports no utilizados: Limpiados

## Impacto

- **API**: Los endpoints `/api/sectors/:sectorId/details-with-hierarchy` y `/api/sectors/:sectorId/topos-with-areas` ya NO existen
- **Repositorios**: Más limpios, solo contienen métodos que realmente se usan
- **Código**: Reducción significativa de código muerto
- **Mantenibilidad**: Mejorada, menos código que mantener

## Notas

Los métodos y DTOs eliminados eran específicos de los endpoints de sectores que ya no existen.

**Corrección importante**: El use case `GetCragOverviewWithSectorsUseCase` y sus DTOs SÍ se mantienen porque:
- ✅ Existe el endpoint `/api/crags/:cragId/overview-photo-with-sectors` en `CragsController`
- ✅ Este endpoint es funcional y se usa en la app mobile
- ✅ Los DTOs `CragOverviewWithSectorsDto`, `CragOverviewPhotoDto` y `SectorAreaAnnotationDto` son necesarios

Si en el futuro se necesitan los endpoints de sectores eliminados, se pueden reimplementar cuando realmente se requieran (siguiendo YAGNI - You Aren't Gonna Need It).
