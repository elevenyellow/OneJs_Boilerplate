# ClimbZone Mobile App

Aplicación móvil para encontrar los mejores sectores de escalada basándose en ubicación, dificultad, clima y preferencias personales.

## Características Principales

### 🔍 Búsqueda Inteligente de Sectores
- Búsqueda basada en ubicación GPS
- Algoritmo de relevancia multi-factor
- Filtros avanzados personalizables
- Integración con datos meteorológicos

### 🎨 Interfaz Visual Sin Imágenes
- Gradientes basados en orientación (sol/sombra)
- Iconografía rica con Ionicons
- Sistema de colores earth-toned
- Skeleton screens durante carga
- Animaciones fluidas

### ⚙️ Sistema de Filtros Avanzados
- **Ubicación**: GPS o búsqueda manual
- **Distancia**: Slider 10-200km
- **Dificultad**: Rango de grados French (3a-9c+)
- **Orientación**: Sol, Sombra, Cualquiera
- **Tipo de roca**: Caliza, Granito, Arenisca, etc.
- **Estilo**: Desplome, Vertical, Placa, Techo
- **Amenidades**: Topos, permisos, número de rutas

### 📱 Experiencia de Usuario
- Haptic feedback en interacciones
- Pull-to-refresh en listas
- Estados de carga y vacíos
- Persistencia de filtros en AsyncStorage
- Bottom sheet nativo para filtros
- Lista ultra-performante con FlashList

## Estructura del Proyecto

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx           # Pantalla principal de búsqueda
│   │   ├── favorites.tsx       # Favoritos
│   │   ├── settings.tsx        # Configuración
│   │   └── zones.tsx           # Lista de zonas
│   └── sector/
│       └── [id].tsx            # Detalle de sector
├── components/
│   ├── ChipSelector.tsx        # Selector multi-opción
│   ├── ConditionBadge.tsx      # Badge de condiciones
│   ├── DistanceSlider.tsx      # Slider de distancia
│   ├── EmptyState.tsx          # Estados vacíos
│   ├── FilterPanel.tsx         # Panel de filtros
│   ├── GradeRangeSlider.tsx    # Selector de grados
│   ├── MapView.tsx             # Vista de mapa
│   ├── OrientationToggle.tsx   # Toggle orientación
│   ├── RelevanceBar.tsx        # Barra de relevancia
│   ├── SectorCard.tsx          # Card de sector
│   ├── Skeleton.tsx            # Skeleton screens
│   ├── WeatherIcon.tsx         # Iconos de clima
│   ├── WeatherWidget.tsx       # Widget de clima
│   ├── ZoneCard.tsx            # Card de zona
│   └── ZoneList.tsx            # Lista de zonas
├── constants/
│   └── Colors.ts               # Sistema de colores
├── hooks/
│   ├── useLocation.ts          # Hook de ubicación
│   ├── useSectorSearch.ts      # Hook de búsqueda
│   ├── useWeather.ts           # Hook de clima
│   └── useZones.ts             # Hook de zonas
├── lib/
│   └── api.ts                  # Cliente API
└── utils/
    ├── filterStorage.ts        # Persistencia de filtros
    └── gradeConverter.ts       # Conversión de grados
```

## Tecnologías Utilizadas

- **Framework**: Expo + React Native
- **Navegación**: Expo Router
- **Gestión de Estado**: TanStack Query (React Query)
- **UI Components**:
  - `@gorhom/bottom-sheet`: Bottom sheets nativos
  - `@shopify/flash-list`: Listas ultra-performantes
  - `expo-linear-gradient`: Gradientes
  - `expo-haptics`: Feedback háptico
  - `@expo/vector-icons`: Iconografía
- **Storage**: AsyncStorage
- **Tipado**: TypeScript

## Instalación

```bash
cd apps/mobile
bun install
```

## Scripts Disponibles

```bash
# Iniciar en modo desarrollo
bun start

# Iniciar en Android
bun run android

# Iniciar en iOS
bun run ios

# Iniciar en web
bun run web
```

## Compilación para Android

La app está configurada para usar el servidor de producción `https://climb-zone.onrender.com/api` cuando se compila para Android.

### Requisitos Previos

1. **Instalar EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Iniciar sesión en Expo**:
   ```bash
   eas login
   ```

3. **Configurar el proyecto** (si es la primera vez):
   ```bash
   cd apps/mobile
   eas build:configure
   ```

### Compilar APK/AAB

#### Opción 1: Usando el script (recomendado)
```bash
cd apps/mobile
./build-android.sh
```

El script te preguntará si quieres compilar:
- **APK de desarrollo**: Para testing rápido
- **AAB para Google Play**: Para producción

#### Opción 2: Comandos directos

**APK de desarrollo:**
```bash
cd apps/mobile
eas build --platform android --profile development
```

**AAB para producción (Google Play Store):**
```bash
cd apps/mobile
eas build --platform android --profile production
```

### Verificar la Configuración

Antes de compilar, verifica que `app.json` tenga la URL correcta:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://climb-zone.onrender.com/api"
    }
  }
}
```

### Descargar el Build

Una vez completada la compilación:
1. Visita https://expo.dev
2. Ve a tu proyecto "climb-zone"
3. Descarga el archivo APK o AAB desde la sección "Builds"

### Notas Importantes

- **Desarrollo**: En modo desarrollo (`expo start`), la app puede usar `localhost` o la IP local configurada
- **Producción**: En builds compilados, siempre usa `https://climb-zone.onrender.com/api`
- **Variables de entorno**: La URL está hardcodeada en `app.json` para builds de producción

## API Integration

La app se conecta al backend:
- **Desarrollo**: `http://localhost:4000/api` o IP local configurada
- **Producción**: `https://climb-zone.onrender.com/api` (configurado en `app.json`)

### Endpoints Utilizados

#### POST /api/sectors/search
Búsqueda inteligente de sectores.

**Request Body:**
```typescript
{
  userLocation: { lat: number; lon: number };
  maxDistance?: number;
  gradeRange: { min: string; max: string };
  currentMonth?: number;
  forceOrientation?: 'sun' | 'shade' | 'any';
  minRoutes?: number;
  rockTypes?: string[];
  climbingStyles?: string[];
  hasTopo?: boolean;
  requiresNoPermit?: boolean;
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
{
  results: CragWithSectors[];
  total: number;
  totalSectors: number;
  filters: SearchSectorsDto;
  metadata: {
    searchTime: number;
    detectedSeason: string;
    preferredOrientation: string;
    weather?: {...};
  };
}
```

## Guía de Componentes

### SectorCard
Card visual que muestra un sector de escalada sin necesidad de imágenes.

**Características:**
- Gradiente dinámico basado en orientación
- Badge de calidad con estrellas
- Información de distancia y ubicación
- Condiciones meteorológicas
- Barra de relevancia
- Estilos de escalada en chips

### FilterPanel
Bottom sheet con todos los filtros de búsqueda.

**Características:**
- Animación nativa suave
- Secciones colapsables
- Haptic feedback
- Persistencia automática
- Botones de reset y aplicar

### GradeRangeSlider
Selector visual de rango de dificultades.

**Sistema de grados French:**
- 3a - 3c (Iniciación)
- 4a - 4c (Fácil)
- 5a - 5c+ (Moderado)
- 6a - 6c+ (Intermedio)
- 7a - 7c+ (Avanzado)
- 8a - 8c+ (Experto)
- 9a - 9c+ (Elite)

## Sistema de Colores

### Paleta Principal
```typescript
{
  light: {
    primary: '#8B5A2B',      // Terracotta
    background: '#FAF8F5',   // Off-white
    card: '#FFFFFF',
    text: '#2D2418',
    accent: '#2E7D32',       // Verde
  },
  dark: {
    primary: '#D4A574',      // Amber cálido
    background: '#1A1612',   // Marrón oscuro
    card: '#252019',
    text: '#FAF8F5',
    accent: '#4CAF50',
  }
}
```

### Gradientes de Orientación
- **Sol**: Amarillo → Naranja → Dorado
- **Sombra**: Gris → Púrpura → Lavanda
- **Neutral**: Marrón claro → Terracotta → Marrón

## UX/UI Best Practices

### Haptic Feedback
- **Light Impact**: Selección de chips, toggles
- **Medium Impact**: Apertura de filtros, navegación
- **Success Notification**: Aplicar filtros, guardar favoritos

### Loading States
- Skeleton screens durante carga inicial
- Pull-to-refresh en listas
- ActivityIndicator para operaciones largas
- Estados vacíos informativos

### Accesibilidad
- Tamaños táctiles mínimos: 44x44pt
- Contraste WCAG AA compliant
- Labels descriptivos
- Soporte para dark mode

## Optimizaciones de Performance

1. **FlashList** en lugar de FlatList
2. **React.memo** en componentes de filtros
3. **useCallback** para handlers
4. **Debounce** en inputs de búsqueda
5. **Paginación** en resultados (limit: 20)
6. **Caché** con React Query (5 min staleTime)

## Roadmap

### Próximas Funcionalidades
- [ ] Favoritos persistentes
- [ ] Historial de búsquedas
- [ ] Filtros guardados (presets)
- [ ] Compartir sectores
- [ ] Modo offline
- [ ] Notificaciones de clima
- [ ] Integración con mapas nativos
- [ ] Fotos de comunidad

## Troubleshooting

### Error: No se detecta ubicación
**Solución:** Verificar permisos de ubicación en configuración del dispositivo.

### Error: No se cargan sectores
**Solución:** 
- En desarrollo: Verificar que el backend esté corriendo en `localhost:4000` y que la red esté configurada correctamente
- En producción: Verificar que `https://climb-zone.onrender.com/api` esté accesible y que la URL esté correctamente configurada en `app.json`

### Bottom sheet no se muestra
**Solución:** Verificar que `react-native-reanimated` esté configurado en `babel.config.js`:
```javascript
plugins: ['react-native-reanimated/plugin']
```

## Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es parte de ClimbZone.
