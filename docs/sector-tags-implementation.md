# Implementación de Tags del Sector

**Fecha:** 2026-01-09

## Resumen

Se ha implementado la funcionalidad para guardar y procesar los tags de los sectores provenientes de TheCrag en campos estructurados separados, en lugar de mantenerlos como un objeto JSON sin procesar.

## Cambios Realizados

### 1. Schema de Base de Datos

Se agregaron los siguientes campos al modelo `Sector` en Prisma:

```prisma
model Sector {
  // ... campos existentes ...
  
  // Nuevos campos de características físicas
  orientation       String?  // N, S, E, W, NE, NW, SE, SW, Variable
  rockType          String?  // Limestone, Granite, Sandstone, etc
  climbingStyle     String[] // Overhang, Slab, Vertical, Roof, Arete
  sunExposure       String?  // Shaded, Sun, Morning, Afternoon, Mixed
  sheltered         Boolean? // true = protegido, false = expuesto
  tagsRaw           Json?    // Tags originales de TheCrag sin procesar
  
  // Índices para búsquedas eficientes
  @@index([orientation])
  @@index([rockType])
}
```

**Migración:** `20260109102517_add_sector_tags_fields`

### 2. Value Objects

Se crearon 4 nuevos Value Objects para validar y normalizar los datos:

#### `Orientation` (`packages/sector/domain/value-objects/orientation.vo.ts`)
- Valida direcciones cardinales: N, S, E, W, NE, NW, SE, SW, Variable
- Normaliza variaciones comunes (North → N, N-E → NE, etc.)
- Métodos de utilidad:
  - `getsSun()`: Retorna si la orientación recibe sol directo
  - `isGoodForSummer()`: Retorna si es buena para verano (sombra)
  - `isGoodForWinter()`: Retorna si es buena para invierno (sol)

#### `RockType` (`packages/sector/domain/value-objects/rock-type.vo.ts`)
- Valida tipos de roca: Limestone, Granite, Sandstone, Conglomerate, Slate, Gneiss, Basalt, Quartzite, Volcanic, Schist, Other
- Normaliza nombres en diferentes idiomas (caliza → Limestone, granito → Granite, etc.)
- Métodos de utilidad:
  - `hasGoodFriction()`: Retorna si el tipo de roca tiene buena adherencia
  - `isPocketed()`: Retorna si el tipo de roca típicamente tiene agujeros

#### `ClimbingStyle` (`packages/sector/domain/value-objects/climbing-style.vo.ts`)
- Valida estilos de escalada: Slab, Vertical, Overhang, Roof, Arete, Crack, Chimney, Dihedral, Tufa, Pockets, Crimps
- Soporta múltiples valores (un sector puede tener varios estilos)
- Normaliza términos en diferentes idiomas (desplome → Overhang, diedro → Dihedral, etc.)
- Métodos de utilidad:
  - `hasOverhangs()`: Retorna si tiene desplomes o techos
  - `isTechnical()`: Retorna si requiere escalada técnica
  - `isGoodForEndurance()`: Retorna si es bueno para entrenamiento de resistencia

#### `SunExposure` (`packages/sector/domain/value-objects/sun-exposure.vo.ts`)
- Valida exposición solar: Shaded, Sun, Morning, Afternoon, Mixed
- Normaliza variaciones comunes (sombra → Shaded, sol de mañana → Morning, etc.)
- Métodos de utilidad:
  - `isGoodForHotDays()`: Retorna si es bueno para días calurosos
  - `isGoodForColdDays()`: Retorna si es bueno para días fríos
  - `isShaded()`: Retorna si está principalmente en sombra
  - `isFullSun()`: Retorna si recibe sol completo

### 3. Entidad de Dominio

Se actualizó `SectorEntity` para incluir los nuevos campos y métodos:

```typescript
export class SectorEntity {
  constructor(
    // ... campos existentes ...
    public readonly orientation: Orientation | null,
    public readonly rockType: RockType | null,
    public readonly climbingStyle: ClimbingStyle,
    public readonly sunExposure: SunExposure | null,
    public readonly sheltered: boolean | null,
    public readonly tagsRaw: Record<string, unknown> | null,
    // ...
  ) {}
  
  // Nuevos métodos de utilidad
  hasOrientation(): boolean
  isGoodForSummer(): boolean
  isGoodForWinter(): boolean
  hasOverhangs(): boolean
  isShaded(): boolean
}
```

### 4. Scraper

Se actualizó el scraper de TheCrag para parsear los tags y extraer campos estructurados:

**Archivo:** `packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper.ts`

Se agregó el método `parseTagsToStructuredFields()` que extrae:
- Orientación de `tags.orientation`, `tags.facing` o `tags.aspect`
- Tipo de roca de `tags.rockType`, `tags.rock` o `tags['rock-type']`
- Estilos de escalada de `tags.style`, `tags.climbingStyle`, `tags.type`, `tags.angle`, `tags.feature` o `tags.features`
- Exposición solar de `tags.sun`, `tags.shade`, `tags.exposure` o `tags.sunExposure`
- Protección de `tags.sheltered`, `tags.protected` o `tags.wind`

### 5. Mapper

Se actualizó el `ScrapedDataMapperService` para procesar los nuevos campos:

```typescript
mapToSector(
  rawExternalId: number,
  rawName: string,
  areaId: AreaId,
  geometryData: GeometryData | null | undefined,
  info: ScrapedNodeInfo | null,
  rawType?: string,
): ValidatedSectorData {
  // ... código existente ...
  
  // Parse new tag fields
  const orientation = Orientation.create(info?.orientation)
  const rockType = RockType.create(info?.rockType)
  const climbingStyle = ClimbingStyle.create(info?.climbingStyle)
  const sunExposure = SunExposure.create(info?.sunExposure)
  const sheltered = info?.sheltered ?? null
  const tagsRaw = info?.tags ?? null
  
  // ...
}
```

### 6. Repositorio

Se actualizó `SectorPrismaRepository` para:
- Persistir los nuevos campos
- Hidratar las entidades con los Value Objects correctos
- Filtrar sectores por orientación, tipo de roca y estilos de escalada

```typescript
export interface SectorFilter {
  // ... filtros existentes ...
  orientation?: string
  rockType?: string
  hasOverhangs?: boolean
}
```

## Uso

### Ejemplos de Consultas

```typescript
// Buscar sectores orientados al norte o noreste
const northFacingSectors = await sectorRepository.findWithFilters({
  orientation: 'N',
  limit: 20
})

// Buscar sectores de caliza con desplomes
const overhangsLimestone = await sectorRepository.findWithFilters({
  rockType: 'Limestone',
  hasOverhangs: true
})

// Buscar sectores a la sombra (buenos para verano)
const shadedSectors = await sectorRepository.findWithFilters({
  sunExposure: 'Shaded'
})
```

### Acceso desde la Entidad

```typescript
const sector = await sectorRepository.findById(sectorId)

// Información de orientación
if (sector.hasOrientation()) {
  console.log(`Orientación: ${sector.orientation}`)
  console.log(`Bueno para verano: ${sector.isGoodForSummer()}`)
  console.log(`Bueno para invierno: ${sector.isGoodForWinter()}`)
}

// Tipo de roca
if (sector.rockType) {
  console.log(`Tipo de roca: ${sector.rockType}`)
  console.log(`Buena adherencia: ${sector.rockType.hasGoodFriction()}`)
}

// Estilos de escalada
if (!sector.climbingStyle.isEmpty()) {
  console.log(`Estilos: ${sector.climbingStyle.toArray().join(', ')}`)
  console.log(`Tiene desplomes: ${sector.hasOverhangs()}`)
}

// Exposición solar
if (sector.sunExposure) {
  console.log(`Exposición: ${sector.sunExposure}`)
  console.log(`Bueno para días calurosos: ${sector.sunExposure.isGoodForHotDays()}`)
}

// Protección
if (sector.sheltered !== null) {
  console.log(`Protegido del viento: ${sector.sheltered}`)
}
```

## Ventajas

1. **Búsquedas eficientes**: Los campos están indexados y tipados, permitiendo consultas rápidas
2. **Validación**: Los Value Objects validan y normalizan los datos automáticamente
3. **Multiidioma**: Soporta variaciones en español, inglés, francés y alemán
4. **Type-safe**: TypeScript garantiza que los valores sean correctos
5. **Métodos de utilidad**: Los Value Objects incluyen lógica de negocio útil
6. **Mantiene datos raw**: El campo `tagsRaw` preserva los tags originales por si se necesita información adicional

## Notas Técnicas

- Los valores nulos son válidos para todos los campos (algunos sectores pueden no tener esta información)
- `climbingStyle` es un array porque un sector puede tener múltiples estilos
- Los Value Objects son inmutables y thread-safe
- La normalización de idiomas es extensible y se puede agregar más variaciones
- Los tags raw se mantienen en JSON por si TheCrag agrega información adicional en el futuro

## Próximos Pasos (Opcionales)

1. Agregar filtros combinados en el API (ej: sectores con caliza Y orientación sur)
2. Crear endpoints específicos para búsqueda por características físicas
3. Agregar estadísticas agregadas (ej: distribución de tipos de roca por país)
4. Implementar sugerencias inteligentes basadas en condiciones climáticas
5. Agregar más tipos de roca o estilos de escalada según sea necesario
