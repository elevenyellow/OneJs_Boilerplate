# Sistema de Búsqueda de Sectores - Guía de Uso

## Descripción

Sistema de búsqueda inteligente de sectores de escalada con filtrado multi-criterio y scoring de relevancia.

## Características Principales

### 1. **Búsqueda por Distancia**
- Filtra sectores según ubicación del usuario
- Radio configurable (default: 100km)
- Ordena resultados por proximidad

### 2. **Filtrado por Grados con Priorización**
- Usuario especifica rango de grados (ej: "6b" a "7a")
- Sistema calcula cuántas rutas del sector están en ese rango
- Mayor prioridad a sectores con más rutas en el rango del usuario

### 3. **Orientación Automática por Estacionalidad**
- **Verano (Jun-Ago)**: Prioriza sectores con orientación N, NE, NW (sombra)
- **Invierno (Dic-Feb)**: Prioriza sectores con orientación S, SE, SW (sol)
- **Primavera/Otoño**: Sin preferencia específica
- Opción para forzar preferencia de orientación

### 4. **Scoring Multi-Factor** (0-100 puntos)
- **Grados en rango**: 40 puntos
- **Distancia**: 20 puntos
- **Orientación/Estacionalidad**: 15 puntos
- **Popularidad**: 10 puntos
- **Cantidad de rutas**: 10 puntos
- **Calidad (fotos/topos)**: 5 puntos

### 5. **Filtros Adicionales**
- Tipo de roca (Limestone, Granite, Sandstone, etc.)
- Estilo de escalada (Overhang, Slab, Vertical, Roof)
- Número mínimo de rutas
- Requiere topos/croquis
- Excluir sectores con permisos requeridos

## Endpoint

### POST `/api/sectors/search`

**Request Body:**

```json
{
  "userLocation": { "lat": 39.5, "lon": -0.5 },
  "gradeRange": { "min": "6b", "max": "7a" },
  "maxDistance": 80,
  "currentMonth": 7,
  "forceOrientation": "shade",
  "minRoutes": 10,
  "rockTypes": ["Limestone"],
  "climbingStyles": ["Overhang", "Vertical"],
  "hasTopo": true,
  "requiresNoPermit": false,
  "limit": 20,
  "offset": 0
}
```

**Campos Requeridos:**
- `userLocation` (object): Ubicación del usuario
  - `lat` (number): Latitud
  - `lon` (number): Longitud
- `gradeRange` (object): Rango de grados del usuario
  - `min` (string): Grado mínimo (ej: "6a")
  - `max` (string): Grado máximo (ej: "7a")

**Campos Opcionales:**
- `maxDistance` (number): Radio máximo en km (default: 100)
- `currentMonth` (number): Mes actual 1-12 (default: mes actual)
- `forceOrientation` (string): "sun" | "shade" | "any" (override automático)
- `minRoutes` (number): Mínimo de rutas en el sector
- `rockTypes` (string[]): Tipos de roca preferidos
- `climbingStyles` (string[]): Estilos de escalada preferidos
- `hasTopo` (boolean): Requiere topos disponibles
- `requiresNoPermit` (boolean): Excluir sectores con permisos
- `limit` (number): Resultados por página (default: 20)
- `offset` (number): Offset para paginación (default: 0)

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "sector": {
          "id": "...",
          "name": "Sector Name",
          "latitude": 39.5,
          "longitude": -0.5,
          "orientation": "N",
          "rockType": "Limestone",
          "stats": {
            "routeCount": 45,
            "minGrade": "5c",
            "maxGrade": "7b+",
            "gradeDistribution": {
              "6b": 10,
              "6c": 15,
              "7a": 12
            }
          }
        },
        "relevanceScore": 87.5,
        "distance": 15.3,
        "routesInUserRange": 37,
        "matchReasons": [
          "Muy cerca (15km)",
          "37 rutas en tu rango de grado",
          "Buena orientación para verano (sombra)",
          "Popular (120 favoritos)"
        ],
        "scoringBreakdown": {
          "gradeMatch": 35.2,
          "distance": 18.5,
          "orientation": 15.0,
          "popularity": 10.0,
          "routeCount": 8.0,
          "quality": 5.0
        }
      }
    ],
    "total": 45,
    "filters": { /* filtros aplicados */ },
    "metadata": {
      "searchTime": 125,
      "detectedSeason": "summer",
      "preferredOrientation": "shade"
    }
  }
}
```

## Ejemplos de Uso

### Ejemplo 1: Búsqueda de Verano
```bash
curl -X POST http://localhost:4000/api/sectors/search \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "6b", "max": "7a" },
    "currentMonth": 7,
    "maxDistance": 80
  }'
```
**Resultado esperado**: Sectores cercanos con orientación norte (sombra), muchas rutas 6b-7a.

### Ejemplo 2: Búsqueda de Invierno
```bash
curl -X POST http://localhost:4000/api/sectors/search \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "6a", "max": "6c" },
    "currentMonth": 1,
    "maxDistance": 50
  }'
```
**Resultado esperado**: Sectores cercanos con orientación sur (sol), rutas 6a-6c.

### Ejemplo 3: Búsqueda Avanzada
```bash
curl -X POST http://localhost:4000/api/sectors/search \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "6c", "max": "7b" },
    "rockTypes": ["Limestone"],
    "climbingStyles": ["Overhang"],
    "hasTopo": true,
    "minRoutes": 20,
    "maxDistance": 100
  }'
```
**Resultado esperado**: Sectores de caliza con desplomes, con topos, 20+ rutas en rango 6c-7b.

### Ejemplo 4: Principiante
```bash
curl -X POST http://localhost:4000/api/sectors/search \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "5a", "max": "6a" },
    "minRoutes": 15,
    "maxDistance": 50
  }'
```
**Resultado esperado**: Sectores cercanos con muchas rutas fáciles (5a-6a).

## Iniciar el Servidor

```bash
# Iniciar base de datos y API
bun run start:api:dev

# O solo API (si la DB ya está corriendo)
bun run --cwd apps/api start:dev
```

## Ejecutar Tests

```bash
# Script de prueba completo (requiere servidor corriendo)
./test-sector-search.sh
```

## Arquitectura

```
packages/sector/
├── domain/
│   ├── entities/sector.entity.ts
│   └── dtos/search-sectors.dto.ts
├── application/
│   ├── use-cases/search-sectors.use-case.ts
│   └── services/sector-scoring.service.ts
└── infrastructure/
    └── persistence/prisma/sector.repository.ts

apps/api/
└── src/sector.controller.ts
```

## Algoritmo de Búsqueda

1. **Validación**: Verifica ubicación y rango de grados
2. **Detección de temporada**: Determina estación y orientación preferida
3. **Filtrado geográfico**: Calcula bounding box y filtra por distancia
4. **Filtrado por grados**: Solo sectores con rutas en el rango
5. **Aplicar filtros opcionales**: Roca, estilo, topos, etc.
6. **Scoring**: Calcula relevancia basada en 6 factores
7. **Ordenamiento**: Por score de relevancia (descendente)
8. **Paginación**: Retorna subset de resultados

## Sistema de Grados Soportado

Actualmente soporta sistema **francés** (con conversión a americano disponible):
- 3, 4, 4+
- 5a, 5a+, 5b, 5b+, 5c, 5c+
- 6a, 6a+, 6b, 6b+, 6c, 6c+
- 7a, 7a+, 7b, 7b+, 7c, 7c+
- 8a, 8a+, 8b, 8b+, 8c, 8c+
- 9a, 9a+, 9b, 9b+, 9c

## Notas de Performance

- La búsqueda geográfica usa bounding box para filtrado inicial (rápido)
- Los índices de PostgreSQL optimizan las queries
- El scoring se realiza en memoria sobre candidatos pre-filtrados
- Por defecto se obtienen 3x más candidatos de los requeridos para scoring preciso

## Mejoras Futuras

- [ ] Integración con PostGIS para búsquedas geoespaciales más eficientes
- [ ] Cache de resultados frecuentes
- [ ] Búsqueda por nombre de sector (full-text search)
- [ ] Filtros por aproximación y acceso
- [ ] Sugerencias basadas en historial del usuario
- [ ] Integración con sistema de embeddings existente para búsqueda semántica
