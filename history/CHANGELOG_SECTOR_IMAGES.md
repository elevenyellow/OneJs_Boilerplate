# Fix: Sector Images Not Showing in Mobile App

## Problem
Las fotos de los sectores no se mostraban en la app móvil porque:
1. El backend no estaba enviando el campo `headerImage` en la respuesta del API
2. El frontend estaba usando placeholders de Unsplash en lugar de las imágenes reales

## Solution

### Backend Changes

**File: `apps/api/src/search/application/dtos/search-crags.dto.ts`**
- Added `headerImage: string | null` field to `ScoredCragDto` interface

**File: `apps/api/src/search/application/controllers/search.controller.ts`**
- Added mapping of `headerImage` field in the response:
  ```typescript
  headerImage: crag.getHeaderImage().getValue(),
  ```

### Frontend Changes

**File: `apps/mobile-app/src/types/api.ts`**
- Added `headerImage: string | null` field to `ScoredCragDto` interface to match backend

**File: `apps/mobile-app/src/services/api/transformers.ts`**
- Updated `scoredCragToSectorUI()` transformer to use real images from backend:
  ```typescript
  imageUrl: crag.headerImage || getPlaceholderImage(crag.name),
  ```
- Falls back to Unsplash placeholder if `headerImage` is null/empty

## Result
- Sector images now display real photos from TheCrag database
- Fallback to Unsplash placeholders only when no image is available
- Better visual experience for users

## Testing
1. Start the API server
2. Start the mobile app
3. Navigate to "Sectores Encontrados" screen
4. Verify that sector cards show real images instead of random Unsplash photos

## Data Source
Images are stored in the `Crag` table with the `headerImage` column:
- Format: URLs from image.thecrag.com
- Example: `https://image.thecrag.com/4x520:4604x2935/fit-in/1200x630/25/19/2519dc7614deac52711b19838c7c468dae672a8d`
