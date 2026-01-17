# Sistema de Iconos

Este sistema proporciona wrappers tipados con colores consistentes para todos los iconos utilizados en la aplicación móvil.

## Ubicación

```
apps/mobile-app/src/components/icons/
├── Icon.tsx      # Componentes de iconos con colores predefinidos
└── index.ts      # Exportaciones centralizadas
```

## Uso

```tsx
import { 
  ChevronBackIcon, 
  LocationIcon, 
  StarIcon 
} from '@/components/icons'

// Uso con tamaños predefinidos
<ChevronBackIcon />  // size='lg' por defecto
<LocationIcon size="sm" />
<StarIcon size="md" />

// Uso con tamaños personalizados (número)
<ChevronBackIcon size={28} />

// Uso con colores personalizados
<StarIcon color="#FF0000" />
```

## Tamaños Disponibles

```typescript
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Mapeo de tamaños:
xs: 12px
sm: 16px
md: 20px
lg: 24px
xl: 32px
```

## Categorías de Iconos

### Navegación
- `ChevronBackIcon` - Botón de retroceso (blanco)
- `ChevronForwardIcon` - Avanzar (gris)
- `CloseIcon` - Cerrar modal/diálogo (blanco)

### Ubicación y Navegación
- `LocationIcon` - Marcador de ubicación (accent)
- `LocationOutlineIcon` - Ubicación outline (gris)
- `NavigateIcon` - Navegar/GPS (accent)
- `NavigateOutlineIcon` - Navegar outline (accent)
- `CompassOutlineIcon` - Orientación (azul #3b82f6)

### Caminata y Aproximación
- `WalkIcon` - Caminar (azul #2196F3)
- `WalkOutlineIcon` - Caminar outline (púrpura #8b5cf6)
- `FootstepsIcon` - Pasos (naranja #FF9800)

### Información de Rutas
- `ResizeOutlineIcon` - Altura/longitud (gris)
- `FlashIcon` - Físico/intensidad (gris)
- `EllipseIcon` - Exposición (gris)
- `LayersOutlineIcon` - Capas/sectores (gris)
- `BarChartOutlineIcon` - Dificultad (accent)

### Estrellas y Calidad
- `StarIcon` - Estrella rellena (amarillo)
- `StarOutlineIcon` - Estrella vacía (gris)
- `TrophyIcon` - Trofeo/destacado (verde)

### Advertencias y Alertas
- `WarningIcon` - Advertencia (naranja)
- `AlertIcon` - Alerta (naranja)
- `AlertCircleOutlineIcon` - Error circular (rojo)

### Equipamiento y Protección
- `ShieldCheckmarkIcon` - Equipado/seguro (verde)
- `ConstructIcon` - Proyecto/construcción (naranja)
- `FitnessOutlineIcon` - Físico (naranja)

### Imágenes y Media
- `ImageOutlineIcon` - Placeholder imagen (gris)
- `ImagesOutlineIcon` - Galería (gris secundario)
- `ScanOutlineIcon` - Escanear/topo (blanco)
- `ExpandOutlineIcon` - Expandir pantalla completa (blanco)

### Mapas y Topos
- `MapOutlineIcon` - Mapa/topo (accent)
- `GitBranchOutlineIcon` - Variantes de ruta (blanco)

### Clima y Condiciones
- `ThermometerOutlineIcon` - Temperatura (accent)
- `FlagOutlineIcon` - Viento (gris secundario)
- `SunnyIcon` - Sol (amarillo)
- `CloudIcon` - Nublado (azul)

### Tiempo y Tips
- `TimeOutlineIcon` - Duración (accent)
- `BulbIcon` - Consejos/tips (azul #3b82f6)
- `TrendingUpOutlineIcon` - Dificultad creciente (rojo)

### Acciones UI
- `SearchIcon` - Buscar (blanco)
- `SearchOutlineIcon` - Buscar outline (gris)
- `OptionsIcon` - Filtros/opciones (blanco)
- `ShareOutlineIcon` - Compartir (blanco)
- `EllipsisVerticalIcon` - Más opciones (blanco)
- `ArrowForwardIcon` - Flecha adelante (gris)

### Personas y Multitudes
- `PersonOutlineIcon` - Persona outline (gris)
- `PersonIcon` - Persona rellena (gris)
- `PeopleOutlineIcon` - Grupo outline (gris)
- `PeopleIcon` - Grupo relleno (gris)
- `HappyOutlineIcon` - Familiar/amigable (verde)
- `WarningOutlineIcon` - Advertencia outline (naranja)

## Colores del Tema

Los iconos utilizan colores del archivo `@/theme/colors.ts`:

```typescript
colors.accent.DEFAULT    // #14b8a6 (turquesa)
colors.grade.easy        // #22c55e (verde)
colors.grade.medium      // #eab308 (amarillo)
colors.grade.hard        // #ef4444 (rojo)
colors.grade.extreme     // #a855f7 (púrpura)
colors.orange.DEFAULT    // #f97316 (naranja)
colors.text.primary      // #ffffff (blanco)
colors.text.secondary    // #9ca3af (gris claro)
colors.text.muted        // #6b7280 (gris medio)
colors.condition.sol     // #fbbf24 (amarillo sol)
colors.condition.sombra  // #60a5fa (azul sombra)
```

## Beneficios

1. **Colores Consistentes**: Todos los iconos tienen colores predefinidos según su función
2. **Type Safety**: TypeScript garantiza que uses tamaños y props correctos
3. **Centralizado**: Un solo lugar para gestionar todos los iconos
4. **Fácil Mantenimiento**: Cambiar colores globalmente editando un solo archivo
5. **Documentación Clara**: Cada icono tiene un nombre descriptivo y propósito definido

## Agregar Nuevos Iconos

Para agregar un nuevo icono:

1. Agrega el componente en `Icon.tsx`:

```typescript
export const MiNuevoIcon = ({
  size = 'md',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="nombre-del-icono-ionicons"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)
```

2. Exporta el icono en `index.ts`:

```typescript
export {
  // ... otros iconos
  MiNuevoIcon,
} from './Icon'
```

3. Usa el nuevo icono en tu componente:

```typescript
import { MiNuevoIcon } from '@/components/icons'

<MiNuevoIcon size="lg" />
```

## Migración

Para migrar código existente que usa `Ionicons` directamente:

**Antes:**
```typescript
import { Ionicons } from '@expo/vector-icons'

<Ionicons name="chevron-back" size={24} color="white" />
```

**Después:**
```typescript
import { ChevronBackIcon } from '@/components/icons'

<ChevronBackIcon />  // Tamaño y color ya predefinidos
```
