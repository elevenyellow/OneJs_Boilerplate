/**
 * Result of an image upload operation
 */
export interface UploadResult {
  /** The S3 key where the file was stored */
  key: string
  /** The public URL to access the file */
  url: string
  /** Content type of the uploaded file */
  contentType: string
  /** Size in bytes */
  size: number
}

/**
 * Represents a single image variant (mobile or full)
 */
export interface ImageVariant {
  /** The S3 URL for this variant */
  url: string
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Size in bytes */
  size: number
}

/**
 * Result of processing and uploading an image with multiple variants
 */
export interface ProcessedImages {
  /** Mobile-optimized version (800px width) */
  mobile: ImageVariant
  /** Full-size version (original dimensions, WebP optimized) */
  full: ImageVariant
  /** Original source URL for reference (only set if source was a URL) */
  originalUrl?: string
}

/**
 * Storage service interface for S3 operations
 */
export interface StorageService {
  /**
   * Upload an image buffer to storage
   * @param buffer - The image data
   * @param key - The storage key/path
   * @param contentType - MIME type of the image
   * @returns Upload result with URL and metadata
   */
  uploadImage(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<UploadResult>

  /**
   * Delete an image from storage
   * @param key - The storage key/path to delete
   */
  deleteImage(key: string): Promise<void>

  /**
   * Get a signed URL for temporary access
   * @param key - The storage key/path
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @returns Signed URL
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>

  /**
   * Check if a file exists in storage
   * @param key - The storage key/path
   * @returns True if exists
   */
  exists(key: string): Promise<boolean>
}
