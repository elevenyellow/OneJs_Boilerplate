# Agente 3: Estructura del Proyecto (Web + Mobile)

## Contexto
Estás trabajando en el proyecto Climb Zone, una aplicación de zonas de escalada. El proyecto usa el framework OneJs (ubicado en `.oneJs/`) que implementa arquitectura hexagonal con Elysia.js, Bun y Prisma.

Otros agentes están creando:
- `packages/scraper-thecrag/` - Scraper de zonas de escalada
- `packages/scraper-meteoblue/` - Scraper de meteorología

## Tu Misión
1. Crear los módulos de dominio para zonas y meteorología
2. Crear la aplicación web con Next.js
3. Crear la aplicación móvil con Expo

## Parte 1: Módulos de Dominio

### packages/zone/
Módulo de dominio para gestionar zonas de escalada (consumidor del scraper):

```
packages/zone/
  domain/
    entities/
      zone.entity.ts
    dtos/
      zone.dto.ts
      zone-filter.dto.ts
    events/
      zone-updated.event.ts
  application/
    use-cases/
      get-zones.use-case.ts
      get-zone-detail.use-case.ts
      search-zones.use-case.ts
    services/
      zone.service.ts
  infrastructure/
    controllers/
      zone.controller.ts
    persistence/
      prisma/
        zone.repository.ts
```

### packages/weather/
Módulo de dominio para gestionar pronósticos (consumidor del scraper):

```
packages/weather/
  domain/
    entities/
      forecast.entity.ts
    dtos/
      forecast.dto.ts
  application/
    use-cases/
      get-zone-weather.use-case.ts
    services/
      weather.service.ts
  infrastructure/
    controllers/
      weather.controller.ts
    persistence/
      prisma/
        weather.repository.ts
```

## Parte 2: Web App (Next.js)

### Crear `apps/web/` basándose en `apps/admin/`

Copiar la estructura base de admin pero adaptarla para usuarios públicos:

```
apps/web/
  src/
    app/
      page.tsx                    # Landing con mapa
      zones/
        page.tsx                  # Lista de zonas con filtros
        [id]/
          page.tsx                # Detalle de zona + weather
      favorites/
        page.tsx                  # Zonas favoritas (requiere auth)
      globals.css
      layout.tsx
    components/
      map/
        ZoneMap.tsx               # Mapa interactivo (Leaflet/Mapbox)
        ZoneMarker.tsx
      zones/
        ZoneCard.tsx
        ZoneList.tsx
        ZoneFilters.tsx
        ZoneDetail.tsx
      weather/
        WeatherWidget.tsx
        ForecastChart.tsx
        WeatherIcon.tsx
      layout/
        Header.tsx
        Footer.tsx
        Sidebar.tsx
    lib/
      api.ts                      # Cliente API
    hooks/
      useZones.ts
      useWeather.ts
      useFavorites.ts
  package.json
  next.config.ts
  tailwind.config.ts
```

### Funcionalidades Web
1. **Mapa interactivo** con marcadores de zonas
2. **Lista de zonas** con filtros (país, tipo escalada, grado)
3. **Búsqueda** por nombre/ubicación
4. **Detalle de zona** con pronóstico meteorológico
5. **Favoritos** (localStorage o auth)

### Librerías sugeridas
```bash
bun add react-leaflet leaflet @tanstack/react-query
bun add -D @types/leaflet
```

## Parte 3: Mobile App (Expo)

### Crear `apps/mobile/`

```
apps/mobile/
  app/
    (tabs)/
      _layout.tsx
      index.tsx                   # Tab: Mapa
      zones.tsx                   # Tab: Lista zonas
      favorites.tsx               # Tab: Favoritos
      settings.tsx                # Tab: Configuración
    zone/
      [id].tsx                    # Detalle de zona
    _layout.tsx
  components/
    ZoneCard.tsx
    ZoneList.tsx
    WeatherWidget.tsx
    MapView.tsx
  hooks/
    useZones.ts
    useWeather.ts
    useLocation.ts
  lib/
    api.ts
  constants/
    Colors.ts
  app.json
  package.json
  tsconfig.json
  babel.config.js
```

### Inicializar con Expo
```bash
cd apps
bunx create-expo-app mobile --template tabs
```

### Funcionalidades Mobile
1. **Mapa nativo** con react-native-maps
2. **Geolocalización** para zonas cercanas
3. **Lista con pull-to-refresh**
4. **Detalle con weather widget**
5. **Favoritos offline** con AsyncStorage
6. **Notificaciones** de buen tiempo (opcional)

### Librerías sugeridas
```bash
cd apps/mobile
bunx expo install react-native-maps expo-location @tanstack/react-query
bunx expo install @react-native-async-storage/async-storage
```

## Parte 4: Integrar con API

Actualizar `apps/api/` para registrar los nuevos controladores:

```typescript
// apps/api/src/controller.ts
// Añadir imports de los nuevos controladores
import '@climb-zone/zone/infrastructure/controllers/zone.controller'
import '@climb-zone/weather/infrastructure/controllers/weather.controller'
```

## Endpoints API a crear

```
GET  /api/zones                    # Lista zonas (con filtros)
GET  /api/zones/:id                # Detalle zona
GET  /api/zones/:id/weather        # Pronóstico de zona
GET  /api/zones/nearby?lat=&lng=   # Zonas cercanas
POST /api/zones/search             # Búsqueda avanzada
```

## Patrones a seguir
- Revisa `apps/admin/` para estructura Next.js
- Usa componentes de `apps/admin/src/components/ui/` si son reutilizables
- Sigue el estilo de controladores en `packages/user/infrastructure/controllers/`

## Entregables
1. `packages/zone/` - Módulo de dominio completo
2. `packages/weather/` - Módulo de dominio completo
3. `apps/web/` - Aplicación web funcional
4. `apps/mobile/` - Aplicación móvil con Expo
5. Controladores y endpoints API

## NO hacer
- No implementar los scrapers (otros agentes lo hacen)
- No modificar `.oneJs/` (es el framework)
- No modificar `apps/admin/` (es otro proyecto)

## Dependencias
Los modelos Prisma serán creados por los agentes de scrapers. Coordina con ellos o crea interfaces temporales.

