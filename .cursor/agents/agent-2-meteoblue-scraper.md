# Agente 2: Scraper de Meteoblue

## Contexto
Estás trabajando en el proyecto Climb Zone, una aplicación de zonas de escalada. El proyecto usa el framework OneJs (ubicado en `.oneJs/`) que implementa arquitectura hexagonal con Elysia.js, Bun y Prisma.

Existe un módulo `packages/scraper-thecrag/` (creado por otro agente) que proporciona las zonas de escalada con sus coordenadas GPS.

## Tu Misión
Crear el módulo de scraping para obtener pronósticos meteorológicos de meteoblue.com para cada zona de escalada.

## Requisitos Técnicos

### 1. Crear la estructura del módulo en `packages/scraper-meteoblue/`

```
packages/scraper-meteoblue/
  domain/
    entities/
      weather-forecast.entity.ts
    dtos/
      weather-data.dto.ts
    value-objects/
      coordinates.vo.ts
  application/
    use-cases/
      fetch-weather.use-case.ts
      update-forecasts.use-case.ts
    services/
      meteoblue-parser.service.ts
  infrastructure/
    scrapers/
      meteoblue.scraper.ts
    persistence/
      prisma/
        weather.repository.ts
        weather.model.prisma
    jobs/
      update-weather.job.ts
```

### 2. Datos a extraer
- Temperatura (mínima/máxima)
- Probabilidad de lluvia (%)
- Velocidad del viento (km/h)
- Humedad (%)
- Condiciones generales (soleado, nublado, lluvia, etc.)
- Pronóstico por días (7 días mínimo)
- Pronóstico por horas (próximas 24-48h)

### 3. Modelo Prisma (`weather.model.prisma`)

```prisma
model WeatherForecast {
  id          String   @id @default(cuid())
  zoneId      String
  date        DateTime
  hour        Int?
  tempMin     Float
  tempMax     Float
  tempCurrent Float?
  rainProb    Int
  windSpeed   Float
  windDirection String?
  humidity    Int
  condition   String
  conditionIcon String?
  uvIndex     Int?
  fetchedAt   DateTime @default(now())
  
  @@unique([zoneId, date, hour])
  @@index([zoneId, date])
}
```

### 4. Dependencias a instalar
```bash
bun add cheerio
```

### 5. URL de Meteoblue
- Formato: `https://www.meteoblue.com/en/weather/week/{location}_{latitude}N{longitude}E`
- Ejemplo: `https://www.meteoblue.com/en/weather/week/siurana_41.26N0.93E`

### 6. Implementar Job de Actualización
Usar el sistema de jobs de OneJs (BullMQ) para:
- Actualizar pronósticos cada 3-6 horas
- Procesar zonas en batches para evitar rate limiting
- Implementar delays entre requests (1-2 segundos)

Revisa `.oneJs/jobs/` para ver cómo implementar workers.

### 7. Cache con Redis
- Cachear respuestas con TTL de 1-3 horas
- Evitar requests duplicados para la misma zona
- Revisa si el proyecto ya tiene Redis configurado en `docker-compose.yml`

### 8. Patrones a seguir
- Revisa `packages/user/` como ejemplo de estructura
- Usa los decoradores de OneJs: `@Injectable`, `@Inject`, `@Worker`
- El scraper debe manejar: rate limiting, reintentos, errores de red

## Entregables
1. Módulo completo con estructura hexagonal
2. Scraper funcional para meteoblue
3. Job programado para actualización periódica
4. Repositorio Prisma para persistir pronósticos
5. Value Object para coordenadas (reutilizable)

## NO hacer
- No crear la web ni la app móvil (otro agente lo hace)
- No modificar el scraper de TheCrag (otro agente lo gestiona)
- No modificar apps/admin ni apps/api existentes

## Dependencia
Este módulo depende de que exista `ClimbingZone` con coordenadas. Si el modelo no existe aún, crea una interfaz temporal para las coordenadas que luego se integrará.

