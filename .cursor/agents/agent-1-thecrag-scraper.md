# Agente 1: Scraper de TheCrag

## Contexto
Estás trabajando en el proyecto Climb Zone, una aplicación de zonas de escalada. El proyecto usa el framework OneJs (ubicado en `.oneJs/`) que implementa arquitectura hexagonal con Elysia.js, Bun y Prisma.

## Tu Misión
Crear el módulo de scraping para extraer zonas de escalada de thecrag.com usando Cheerio + fetch.

## Requisitos Técnicos

### 1. Crear la estructura del módulo en `packages/scraper-thecrag/`

```
packages/scraper-thecrag/
  domain/
    entities/
      climbing-zone.entity.ts
      climbing-route.entity.ts
    dtos/
      scraped-zone.dto.ts
  application/
    use-cases/
      scrape-zones.use-case.ts
      sync-zones.use-case.ts
    services/
      thecrag-parser.service.ts
  infrastructure/
    scrapers/
      thecrag.scraper.ts
    persistence/
      prisma/
        zone.repository.ts
        zone.model.prisma
```

### 2. Datos a extraer de cada zona
- Nombre de la zona/sector
- Ubicación (coordenadas GPS, país, región)
- Número de rutas
- Grados de dificultad disponibles
- Tipo de escalada (deportiva, boulder, tradicional)
- Descripción y acceso
- URL de imagen si está disponible

### 3. Modelo Prisma (`zone.model.prisma`)

```prisma
model ClimbingZone {
  id          String   @id @default(cuid())
  externalId  String   @unique
  name        String
  country     String
  region      String?
  latitude    Float
  longitude   Float
  routeCount  Int      @default(0)
  climbTypes  String[]
  minGrade    String?
  maxGrade    String?
  description String?
  accessInfo  String?
  imageUrl    String?
  sourceUrl   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4. Dependencias a instalar
```bash
bun add cheerio
```

### 5. Patrones a seguir
- Revisa `packages/user/` y `packages/post/` como ejemplos de estructura
- Usa los decoradores de OneJs: `@Injectable`, `@Inject`
- Implementa el repositorio extendiendo la base de Prisma
- El scraper debe ser resiliente: manejo de errores, reintentos, rate limiting

### 6. Puntos de entrada a scrapear
- URL base: `https://www.thecrag.com/`
- Empezar por países/regiones principales
- Navegar la jerarquía: País > Región > Área > Sector

## Entregables
1. Módulo completo con estructura hexagonal
2. Scraper funcional que extrae zonas
3. Repositorio Prisma para persistir datos
4. Use case para sincronizar zonas nuevas/actualizadas

## NO hacer
- No crear la web ni la app móvil (otro agente lo hace)
- No implementar el scraper de meteorología (otro agente lo hace)
- No modificar apps/admin ni apps/api existentes

