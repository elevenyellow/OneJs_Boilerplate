# Ejemplos de Respuestas del API de Búsqueda de Sectores

## Ejemplo 1: Búsqueda de Verano Básica

### Request
```json
POST /api/sectors/search
{
  "userLocation": { "lat": 39.5, "lon": -0.5 },
  "gradeRange": { "min": "6b", "max": "7a" },
  "currentMonth": 7,
  "maxDistance": 80,
  "limit": 3
}
```

### Response Esperada
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "sector": {
          "id": "clu123...",
          "name": "Sector Norte",
          "latitude": 39.48,
          "longitude": -0.52,
          "orientation": "N",
          "rockType": "Limestone",
          "sunExposure": "Shaded",
          "climbingStyle": ["Vertical", "Overhang"],
          "stats": {
            "routeCount": 45,
            "minGrade": "5c",
            "maxGrade": "7b+",
            "gradeDistribution": {
              "5c": 3,
              "6a": 5,
              "6a+": 4,
              "6b": 10,
              "6b+": 8,
              "6c": 12,
              "7a": 8,
              "7a+": 3,
              "7b": 2
            },
            "averageHeight": 25.5
          },
          "totalFavorites": 124,
          "numberPhotos": 35,
          "numberTopos": 8,
          "hasTopo": true,
          "seasonality": [4, 5, 7, 8, 9, 10, 10, 9, 8, 7, 5, 4]
        },
        "relevanceScore": 87.5,
        "distance": 15.3,
        "routesInUserRange": 38,
        "matchReasons": [
          "Muy cerca (15km)",
          "38 rutas en tu rango de grado",
          "Buena orientación para verano (sombra)",
          "Buena época del año",
          "Popular (124 favoritos)",
          "Buena documentación (fotos y croquis)",
          "Muchas rutas (45)"
        ],
        "scoringBreakdown": {
          "gradeMatch": 33.8,
          "distance": 18.9,
          "orientation": 15.0,
          "popularity": 10.0,
          "routeCount": 8.0,
          "quality": 5.0
        }
      },
      {
        "sector": {
          "id": "clu456...",
          "name": "Las Umbrias",
          "latitude": 39.52,
          "longitude": -0.48,
          "orientation": "NW",
          "rockType": "Limestone",
          "sunExposure": "Shaded",
          "climbingStyle": ["Slab", "Vertical"],
          "stats": {
            "routeCount": 32,
            "minGrade": "6a",
            "maxGrade": "7c",
            "gradeDistribution": {
              "6a": 6,
              "6b": 8,
              "6c": 9,
              "7a": 6,
              "7b": 2,
              "7c": 1
            }
          },
          "totalFavorites": 89,
          "numberPhotos": 22,
          "numberTopos": 5,
          "hasTopo": true
        },
        "relevanceScore": 82.3,
        "distance": 12.7,
        "routesInUserRange": 23,
        "matchReasons": [
          "Muy cerca (13km)",
          "23 rutas en tu rango de grado",
          "Buena orientación para verano (sombra)",
          "Popular (89 favoritos)",
          "Buena documentación (fotos y croquis)"
        ],
        "scoringBreakdown": {
          "gradeMatch": 28.8,
          "distance": 19.4,
          "orientation": 15.0,
          "popularity": 8.0,
          "routeCount": 6.0,
          "quality": 5.0
        }
      },
      {
        "sector": {
          "id": "clu789...",
          "name": "Pared del Aguila",
          "latitude": 39.45,
          "longitude": -0.55,
          "orientation": "NE",
          "rockType": "Limestone",
          "sunExposure": "Morning",
          "climbingStyle": ["Vertical"],
          "stats": {
            "routeCount": 28,
            "minGrade": "5b",
            "maxGrade": "7a+",
            "gradeDistribution": {
              "5b": 2,
              "5c": 3,
              "6a": 5,
              "6b": 7,
              "6c": 6,
              "7a": 4,
              "7a+": 1
            }
          },
          "totalFavorites": 56,
          "numberPhotos": 18,
          "numberTopos": 3,
          "hasTopo": true
        },
        "relevanceScore": 76.2,
        "distance": 18.9,
        "routesInUserRange": 17,
        "matchReasons": [
          "A 19km de distancia",
          "17 rutas en tu rango de grado",
          "Buena orientación para verano (sombra)",
          "Popular (56 favoritos)"
        ],
        "scoringBreakdown": {
          "gradeMatch": 24.3,
          "distance": 17.6,
          "orientation": 15.0,
          "popularity": 6.0,
          "routeCount": 6.0,
          "quality": 5.0
        }
      }
    ],
    "total": 23,
    "filters": {
      "userLocation": { "lat": 39.5, "lon": -0.5 },
      "gradeRange": { "min": "6b", "max": "7a" },
      "currentMonth": 7,
      "maxDistance": 80,
      "limit": 3
    },
    "metadata": {
      "searchTime": 87,
      "detectedSeason": "summer",
      "preferredOrientation": "shade"
    }
  }
}
```

## Ejemplo 2: Búsqueda de Invierno

### Request
```json
POST /api/sectors/search
{
  "userLocation": { "lat": 39.5, "lon": -0.5 },
  "gradeRange": { "min": "6a", "max": "6c" },
  "currentMonth": 1,
  "maxDistance": 50,
  "minRoutes": 15,
  "limit": 2
}
```

### Response Esperada
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "sector": {
          "id": "clu999...",
          "name": "Pared Sur",
          "latitude": 39.48,
          "longitude": -0.49,
          "orientation": "S",
          "rockType": "Limestone",
          "sunExposure": "Sun",
          "stats": {
            "routeCount": 38,
            "gradeDistribution": {
              "5c": 4,
              "6a": 12,
              "6a+": 8,
              "6b": 10,
              "6c": 4
            }
          },
          "totalFavorites": 95
        },
        "relevanceScore": 91.2,
        "distance": 14.2,
        "routesInUserRange": 34,
        "matchReasons": [
          "Muy cerca (14km)",
          "34 rutas en tu rango de grado",
          "Buena orientación para invierno (sol)",
          "Buena época del año",
          "Popular (95 favoritos)"
        ],
        "scoringBreakdown": {
          "gradeMatch": 35.8,
          "distance": 18.7,
          "orientation": 15.0,
          "popularity": 10.0,
          "routeCount": 8.0,
          "quality": 5.0
        }
      },
      {
        "sector": {
          "id": "clu888...",
          "name": "Solana Alta",
          "latitude": 39.51,
          "longitude": -0.47,
          "orientation": "SE",
          "rockType": "Limestone",
          "sunExposure": "Sun",
          "stats": {
            "routeCount": 29,
            "gradeDistribution": {
              "5b": 3,
              "5c": 5,
              "6a": 9,
              "6b": 8,
              "6c": 4
            }
          },
          "totalFavorites": 67
        },
        "relevanceScore": 85.4,
        "distance": 11.8,
        "routesInUserRange": 21,
        "matchReasons": [
          "Muy cerca (12km)",
          "21 rutas en tu rango de grado",
          "Buena orientación para invierno (sol)",
          "Popular (67 favoritos)"
        ],
        "scoringBreakdown": {
          "gradeMatch": 29.0,
          "distance": 19.1,
          "orientation": 15.0,
          "popularity": 8.0,
          "routeCount": 6.0,
          "quality": 5.0
        }
      }
    ],
    "total": 18,
    "filters": {
      "userLocation": { "lat": 39.5, "lon": -0.5 },
      "gradeRange": { "min": "6a", "max": "6c" },
      "currentMonth": 1,
      "maxDistance": 50,
      "minRoutes": 15,
      "limit": 2
    },
    "metadata": {
      "searchTime": 72,
      "detectedSeason": "winter",
      "preferredOrientation": "sun"
    }
  }
}
```

## Ejemplo 3: Búsqueda con Filtros Avanzados

### Request
```json
POST /api/sectors/search
{
  "userLocation": { "lat": 39.5, "lon": -0.5 },
  "gradeRange": { "min": "6c", "max": "7b" },
  "maxDistance": 100,
  "rockTypes": ["Limestone"],
  "climbingStyles": ["Overhang"],
  "hasTopo": true,
  "minRoutes": 20,
  "limit": 2
}
```

### Response Esperada
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "sector": {
          "id": "clu333...",
          "name": "Los Desplomes",
          "latitude": 39.42,
          "longitude": -0.58,
          "orientation": "Variable",
          "rockType": "Limestone",
          "climbingStyle": ["Overhang", "Roof"],
          "stats": {
            "routeCount": 35,
            "gradeDistribution": {
              "6b": 3,
              "6c": 8,
              "7a": 10,
              "7a+": 7,
              "7b": 5,
              "7c": 2
            }
          },
          "totalFavorites": 156,
          "hasTopo": true
        },
        "relevanceScore": 82.1,
        "distance": 24.5,
        "routesInUserRange": 23,
        "matchReasons": [
          "A 25km de distancia",
          "23 rutas en tu rango de grado",
          "Popular (156 favoritos)",
          "Buena documentación (fotos y croquis)",
          "Muchas rutas (35)"
        ],
        "scoringBreakdown": {
          "gradeMatch": 26.3,
          "distance": 15.9,
          "orientation": 5.0,
          "popularity": 10.0,
          "routeCount": 8.0,
          "quality": 5.0
        }
      },
      {
        "sector": {
          "id": "clu444...",
          "name": "Techos del Sur",
          "latitude": 39.38,
          "longitude": -0.52,
          "orientation": "S",
          "rockType": "Limestone",
          "climbingStyle": ["Overhang", "Vertical"],
          "stats": {
            "routeCount": 26,
            "gradeDistribution": {
              "6a": 2,
              "6b": 4,
              "6c": 6,
              "7a": 8,
              "7b": 4,
              "7b+": 2
            }
          },
          "totalFavorites": 89,
          "hasTopo": true
        },
        "relevanceScore": 77.8,
        "distance": 29.3,
        "routesInUserRange": 18,
        "matchReasons": [
          "A 29km de distancia",
          "18 rutas en tu rango de grado",
          "Popular (89 favoritos)",
          "Buena documentación (fotos y croquis)"
        ],
        "scoringBreakdown": {
          "gradeMatch": 27.7,
          "distance": 14.2,
          "orientation": 5.0,
          "popularity": 8.0,
          "routeCount": 6.0,
          "quality": 5.0
        }
      }
    ],
    "total": 12,
    "filters": {
      "userLocation": { "lat": 39.5, "lon": -0.5 },
      "gradeRange": { "min": "6c", "max": "7b" },
      "maxDistance": 100,
      "rockTypes": ["Limestone"],
      "climbingStyles": ["Overhang"],
      "hasTopo": true,
      "minRoutes": 20,
      "limit": 2
    },
    "metadata": {
      "searchTime": 95,
      "detectedSeason": "summer",
      "preferredOrientation": "shade"
    }
  }
}
```

## Ejemplo 4: Error - Parámetros Faltantes

### Request
```json
POST /api/sectors/search
{
  "userLocation": { "lat": 39.5, "lon": -0.5 }
  // Falta gradeRange
}
```

### Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "gradeRange with min and max is required"
  }
}
```

## Ejemplo 5: Error - Grados Inválidos

### Request
```json
POST /api/sectors/search
{
  "userLocation": { "lat": 39.5, "lon": -0.5 },
  "gradeRange": { "min": "invalid", "max": "7a" }
}
```

### Response
```json
{
  "success": false,
  "error": {
    "code": "SEARCH_ERROR",
    "message": "Invalid grade range: invalid - 7a"
  }
}
```

## Notas sobre las Respuestas

### Campos del Sector
- **id**: Identificador único del sector
- **name**: Nombre del sector
- **latitude/longitude**: Coordenadas geográficas
- **orientation**: N, S, E, W, NE, NW, SE, SW, Variable
- **rockType**: Limestone, Granite, Sandstone, etc.
- **sunExposure**: Shaded, Sun, Morning, Afternoon, Mixed
- **climbingStyle**: Array de estilos (Overhang, Slab, Vertical, Roof, Arete)
- **stats.gradeDistribution**: Objeto con conteo de rutas por grado
- **totalFavorites**: Número de favoritos (popularidad)
- **hasTopo**: Boolean indicando si tiene croquis

### Scoring
- **relevanceScore**: Puntuación total 0-100
- **distance**: Distancia en km desde ubicación del usuario
- **routesInUserRange**: Cantidad de rutas en el rango de grados
- **matchReasons**: Array de razones legibles en español
- **scoringBreakdown**: Desglose de puntos por categoría

### Metadata
- **searchTime**: Tiempo de búsqueda en ms
- **detectedSeason**: summer, winter, spring, autumn
- **preferredOrientation**: sun, shade, any
