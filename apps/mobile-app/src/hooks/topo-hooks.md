# Topo Hooks Architecture

This document describes the three topo-related hooks and their intended usage within the topo image viewer components.

## Overview

The topo hooks are designed to work together to provide a complete image viewing experience with zoom, pan, swipe navigation, and smooth transitions.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Topo Image Viewer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  useTopoZoom    │  │ useTopoGestures │  │ useTopoPhoto    │  │
│  │                 │  │                 │  │  Navigation     │  │
│  │ • Pinch zoom    │  │ • Horizontal    │  │ • Photo index   │  │
│  │ • Pan when      │  │   swipe         │  │ • Fade          │  │
│  │   zoomed        │  │ • Double-tap    │  │   transitions   │  │
│  │ • Double-tap    │  │   detection     │  │ • Navigation    │  │
│  │   zoom toggle   │  │   (for actions) │  │   state         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│         │                     │                     │           │
│         │    Reanimated      │   PanResponder     │   React    │
│         │    Gestures        │   (RN Animated)    │   State    │
│         │                    │                     │           │
└─────────────────────────────────────────────────────────────────┘
```

## Hooks

### 1. `useTopoZoom` - Pinch-to-Zoom and Pan

**Purpose**: Handles zoom interactions on a topo image using Reanimated Gesture Handler.

**Gesture System**: `react-native-gesture-handler` with `react-native-reanimated`

**Features**:
- **Pinch zoom**: Two-finger gesture to zoom in/out (1x - 3x range)
- **Pan**: Move the image when zoomed in (constrained to image bounds)
- **Double-tap zoom**: Toggle between 1x and 2x zoom centered on tap point
- **Smooth animations**: Spring-based animations for natural feel

**Usage**:
```tsx
import { GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useTopoZoom } from '@/hooks/useTopoZoom'

function ZoomableImage({ containerWidth, containerHeight }) {
  const { animatedZoomStyle, composedGestures, resetZoom } = useTopoZoom({
    containerWidth,
    containerHeight,
  })

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View style={animatedZoomStyle}>
        <Image source={{ uri: imageUrl }} />
      </Animated.View>
    </GestureDetector>
  )
}
```

**When to Use**:
- For fullscreen topo image viewers where zoom is the primary interaction
- When you need pinch-zoom with precise pan constraints
- When using Reanimated's Gesture Handler for better performance

---

### 2. `useTopoGestures` - Swipe Navigation and Double-Tap Actions

**Purpose**: Handles horizontal swipe gestures for navigating between multiple photos and double-tap detection for triggering actions.

**Gesture System**: React Native's built-in `PanResponder` with `Animated` API

**Features**:
- **Horizontal swipe**: Navigate between photos (left/right)
- **Swipe resistance**: Visual feedback during swipe with spring-back animation
- **Double-tap detection**: Time-based detection (300ms threshold) for custom actions
- **Ref-based state**: Uses refs to avoid stale closures in PanResponder

**Usage**:
```tsx
import { Animated, View } from 'react-native'
import { useTopoGestures } from '@/hooks/useTopoGestures'

function PhotoGallery({ currentIndex, totalPhotos, onNext, onPrevious }) {
  const { translateX, panHandlers, handleImagePress } = useTopoGestures({
    enabled: true,
    currentIndex,
    totalPhotos,
    onSwipePrevious: onPrevious,
    onSwipeNext: onNext,
    onDoubleTap: () => openFullscreen(),
  })

  return (
    <Animated.View 
      style={{ transform: [{ translateX }] }} 
      {...panHandlers}
    >
      <Pressable onPress={handleImagePress}>
        <Image source={{ uri: photos[currentIndex] }} />
      </Pressable>
    </Animated.View>
  )
}
```

**When to Use**:
- For photo gallery navigation (swipe between photos)
- When you need simple horizontal swipe detection
- When triggering actions on double-tap (not zoom)
- In components that don't use GestureDetector

---

### 3. `useTopoPhotoNavigation` - Photo Selection State and Transitions

**Purpose**: Manages photo selection state with fade transition animations.

**Gesture System**: None (state management only, uses `Animated` for transitions)

**Features**:
- **Controlled/uncontrolled mode**: Can be driven by external state or internal
- **Fade transitions**: Smooth fade out/in when changing photos
- **Navigation helpers**: `goToNextPhoto`, `goToPreviousPhoto`, `setSelectedPhotoIndex`
- **Derived state**: `hasMultiplePhotos`, `canGoNext`, `canGoPrevious`

**Usage**:
```tsx
import { useTopoPhotoNavigation } from '@/hooks/useTopoPhotoNavigation'

function PhotoViewer({ photos, controlledIndex, onIndexChange }) {
  const {
    selectedPhotoIndex,
    displayedPhotoIndex,
    fadeAnim,
    goToNextPhoto,
    goToPreviousPhoto,
    hasMultiplePhotos,
  } = useTopoPhotoNavigation({
    controlledPhotoIndex: controlledIndex,
    onPhotoChange: onIndexChange,
    totalPhotos: photos.length,
  })

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Image source={{ uri: photos[displayedPhotoIndex] }} />
      {hasMultiplePhotos && (
        <NavigationControls onNext={goToNextPhoto} onPrev={goToPreviousPhoto} />
      )}
    </Animated.View>
  )
}
```

**When to Use**:
- For managing photo selection state in any photo viewer
- When you need fade transitions between photos
- When you need both controlled and uncontrolled modes

---

## Composing Hooks Together

For a complete topo viewer experience, compose all three hooks:

```tsx
function TopoViewer({ photos, containerWidth, containerHeight }) {
  // Photo navigation state
  const photoNav = useTopoPhotoNavigation({ totalPhotos: photos.length })

  // Zoom gestures (for fullscreen/zoomed view)
  const zoom = useTopoZoom({ containerWidth, containerHeight })

  // Swipe gestures (for photo navigation)
  const gestures = useTopoGestures({
    enabled: photoNav.hasMultiplePhotos && zoom.scale === 1, // Disable swipe when zoomed
    currentIndex: photoNav.selectedPhotoIndex,
    totalPhotos: photos.length,
    onSwipePrevious: photoNav.goToPreviousPhoto,
    onSwipeNext: photoNav.goToNextPhoto,
    onDoubleTap: () => zoom.resetZoom(),
  })

  // ... render with both gesture handlers
}
```

## Double-Tap Conflict Resolution

**Important**: Both `useTopoZoom` and `useTopoGestures` handle double-tap:

| Hook | Double-Tap Behavior | Use When |
|------|---------------------|----------|
| `useTopoZoom` | Toggles zoom (1x ↔ 2x) | User wants to zoom into image |
| `useTopoGestures` | Triggers custom callback | User wants to open fullscreen, etc. |

**Resolution strategies**:

1. **Use only one**: Choose based on the primary interaction needed
2. **Conditional enabling**: Enable/disable based on current zoom level
3. **Different components**: Use `useTopoZoom` in fullscreen view, `useTopoGestures` in thumbnail view

---

## Future Consolidation

If consolidation is desired, consider:

1. **Migrate `useTopoGestures` to Reanimated**: Replace `PanResponder` with Reanimated's `Gesture.Pan()` for consistency
2. **Create `useTopoInteraction`**: A single hook that combines all functionality with configuration options

```tsx
// Potential consolidated API
const topo = useTopoInteraction({
  totalPhotos: photos.length,
  containerWidth,
  containerHeight,
  enableZoom: true,
  enableSwipe: true,
  onDoubleTap: 'zoom' | 'custom' | callback,
})
```

For now, the separation allows flexibility:
- Use `useTopoZoom` alone for simple zoomable images
- Use `useTopoGestures` + `useTopoPhotoNavigation` for simple galleries
- Use all three for full-featured topo viewers
