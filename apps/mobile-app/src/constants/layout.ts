/**
 * Layout constants for consistent sizing across the app.
 * Used primarily for FlatList getItemLayout calculations.
 */

/**
 * Standard list item heights in pixels.
 * These values are based on the actual rendered heights of list item components.
 */
export const LIST_ITEM_HEIGHTS = {
  /**
   * Height for CragListItem, ZoneSectorListItem, SectorListItem.
   * Card (p-3 = 12px padding) + image (96px) + margin bottom (12px) = ~120px
   */
  CRAG_LIST_ITEM: 120,

  /**
   * Height for simple sector list items in SectorListWithPhotos.
   * Compact list item with name, routes count, and selection indicator.
   */
  SECTOR_LIST_ITEM: 72,

  /**
   * Height for SectorCard (vertical layout with large image).
   * Image (aspect 16/10 ~250px) + content padding (16px*2) + name (24px) +
   * location (16px) + weather row (~48px) + routes row (~40px) + margins = ~320px
   */
  SECTOR_CARD: 320,
} as const

/**
 * FlatList optimization defaults.
 * These values provide a good balance between performance and user experience.
 */
export const FLATLIST_OPTIMIZATION = {
  /** Number of items to render per batch */
  MAX_TO_RENDER_PER_BATCH: 10,

  /** Number of screens worth of items to keep in memory */
  WINDOW_SIZE: 5,

  /** Initial number of items to render */
  INITIAL_NUM_TO_RENDER: 10,

  /** Smaller window size for horizontal carousels */
  CAROUSEL_WINDOW_SIZE: 3,

  /** Fewer items per batch for carousels */
  CAROUSEL_MAX_TO_RENDER_PER_BATCH: 5,

  /** Initial render count for carousels */
  CAROUSEL_INITIAL_NUM_TO_RENDER: 3,
} as const
