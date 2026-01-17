import { Inject, Injectable } from '@OneJs/core'
import sharp from 'sharp'
import type {
  ImageVariant,
  ProcessedImages,
} from '../../domain/interfaces/storage.interface'
import { S3StorageService } from '../../infrastructure/s3/s3-storage.service'

/** Configuration for image processing */
export interface ImageProcessingConfig {
  /** Width for mobile variant (default: 800) */
  mobileWidth: number
  /** WebP quality for mobile variant (default: 85) */
  mobileQuality: number
  /** WebP quality for full variant (default: 90) */
  fullQuality: number
}

/** Options for processing and uploading an image */
export interface ProcessAndUploadOptions {
  /** URL of the original image or Buffer */
  source: string | Buffer
  /** S3 key prefix without extension (e.g., 'images/crags/123/header') */
  keyPrefix: string
}

const DEFAULT_CONFIG: ImageProcessingConfig = {
  mobileWidth: 800,
  mobileQuality: 85,
  fullQuality: 90,
}

/**
 * Service for downloading, processing, and uploading images to S3
 * Generates optimized WebP variants for mobile and full-size viewing
 */
@Injectable()
export class ImageProcessorService {
  private config: ImageProcessingConfig

  constructor(
    @Inject(S3StorageService)
    private readonly storage: S3StorageService,
  ) {
    this.config = DEFAULT_CONFIG
  }

  /**
   * Check if S3 is configured and ready for uploads
   */
  isConfigured(): boolean {
    return this.storage.isConfigured()
  }

  /**
   * Download an image from a URL
   * @param url - Source URL to download from
   * @returns Image buffer
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status} ${response.statusText}`,
      )
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Process an image into mobile and full variants
   * @param buffer - Original image buffer
   * @returns Object with mobile and full buffers with metadata
   */
  private async processImage(buffer: Buffer): Promise<{
    mobile: { buffer: Buffer; width: number; height: number }
    full: { buffer: Buffer; width: number; height: number }
  }> {
    // Get original dimensions
    const metadata = await sharp(buffer).metadata()
    const originalWidth = metadata.width || 1920
    const originalHeight = metadata.height || 1080

    // Process mobile version (resize to 800px width, maintain aspect ratio)
    const mobileImage = sharp(buffer)
      .resize(this.config.mobileWidth, null, {
        withoutEnlargement: true, // Don't upscale small images
        fit: 'inside',
      })
      .webp({ quality: this.config.mobileQuality })

    const mobileBuffer = await mobileImage.toBuffer()
    const mobileMetadata = await sharp(mobileBuffer).metadata()

    // Process full version (keep original size, convert to WebP)
    const fullImage = sharp(buffer).webp({ quality: this.config.fullQuality })
    const fullBuffer = await fullImage.toBuffer()

    return {
      mobile: {
        buffer: mobileBuffer,
        width: mobileMetadata.width || this.config.mobileWidth,
        height:
          mobileMetadata.height ||
          Math.round(
            (originalHeight / originalWidth) * this.config.mobileWidth,
          ),
      },
      full: {
        buffer: fullBuffer,
        width: originalWidth,
        height: originalHeight,
      },
    }
  }

  /**
   * Process and upload an image from a source URL or Buffer
   * Downloads the image (if URL), creates optimized variants, and uploads to S3
   *
   * @param options - Processing options with source and keyPrefix
   * @returns Processed images with S3 URLs
   */
  async processAndUpload(
    options: ProcessAndUploadOptions,
  ): Promise<ProcessedImages> {
    const { source, keyPrefix } = options

    // Download if source is URL, otherwise use buffer directly
    const originalBuffer =
      typeof source === 'string' ? await this.downloadImage(source) : source

    // Process into variants
    const processed = await this.processImage(originalBuffer)

    // Generate S3 keys
    const mobileKey = `${keyPrefix}-800.webp`
    const fullKey = `${keyPrefix}-full.webp`

    // Upload both variants in parallel
    const [mobileResult, fullResult] = await Promise.all([
      this.storage.uploadImage(
        processed.mobile.buffer,
        mobileKey,
        'image/webp',
      ),
      this.storage.uploadImage(processed.full.buffer, fullKey, 'image/webp'),
    ])

    const mobile: ImageVariant = {
      url: mobileResult.url,
      width: processed.mobile.width,
      height: processed.mobile.height,
      size: mobileResult.size,
    }

    const full: ImageVariant = {
      url: fullResult.url,
      width: processed.full.width,
      height: processed.full.height,
      size: fullResult.size,
    }

    return {
      mobile,
      full,
      originalUrl: typeof source === 'string' ? source : undefined,
    }
  }

  /**
   * Process and upload multiple images in batch
   * Useful for processing all topos of a sector at once
   *
   * @param images - Array of images to process
   * @returns Array of processed image results
   */
  async processAndUploadBatch(
    images: ProcessAndUploadOptions[],
  ): Promise<ProcessedImages[]> {
    // Process images sequentially to avoid overwhelming the server
    // Could be parallelized with concurrency limit if needed
    const results: ProcessedImages[] = []

    for (const image of images) {
      const result = await this.processAndUpload(image)
      results.push(result)
    }

    return results
  }

  /**
   * Check if images for a given key prefix already exist in S3
   * Useful to skip re-processing already uploaded images
   *
   * @param keyPrefix - S3 key prefix (e.g., 'images/crags/123/header')
   * @returns True if both mobile and full variants exist
   */
  async imagesExist(keyPrefix: string): Promise<boolean> {
    const mobileKey = `${keyPrefix}-800.webp`
    const fullKey = `${keyPrefix}-full.webp`

    const [mobileExists, fullExists] = await Promise.all([
      this.storage.exists(mobileKey),
      this.storage.exists(fullKey),
    ])

    return mobileExists && fullExists
  }
}
