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

const DEFAULT_CONFIG: ImageProcessingConfig = {
  mobileWidth: 800,
  mobileQuality: 85,
  fullQuality: 90,
}

/** Types of images we process */
export type ImageType =
  | 'crag-header'
  | 'area-header'
  | 'sector-header'
  | 'topo'
  | 'crag-topo'

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
   * Generate S3 key based on image type and entity ID
   */
  private generateKey(
    type: ImageType,
    entityId: string,
    variant: 'mobile' | 'full',
  ): string {
    const suffix = variant === 'mobile' ? '800' : 'full'

    switch (type) {
      case 'crag-header':
        return `images/crags/${entityId}/header-${suffix}.webp`
      case 'sector-header':
        return `images/sectors/${entityId}/header-${suffix}.webp`
      case 'topo':
        return `images/topos/${entityId}/${variant === 'mobile' ? 'thumb' : 'full'}.webp`
      case 'crag-topo':
        return `images/crag-topos/${entityId}/${variant === 'mobile' ? 'thumb' : 'full'}.webp`
      default:
        return `images/misc/${entityId}-${suffix}.webp`
    }
  }

  /**
   * Process and upload an image from a source URL
   * Downloads the image, creates optimized variants, and uploads to S3
   *
   * @param sourceUrl - URL of the original image (e.g., from TheCrag)
   * @param type - Type of image (crag-header, sector-header, topo, crag-topo)
   * @param entityId - ID of the entity (crag, sector, or topo)
   * @returns Processed images with S3 URLs
   */
  async processAndUpload(
    sourceUrl: string,
    type: ImageType,
    entityId: string,
  ): Promise<ProcessedImages> {
    // Download original image
    const originalBuffer = await this.downloadImage(sourceUrl)

    // Process into variants
    const processed = await this.processImage(originalBuffer)

    // Generate S3 keys
    const mobileKey = this.generateKey(type, entityId, 'mobile')
    const fullKey = this.generateKey(type, entityId, 'full')

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
      originalUrl: sourceUrl,
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
    images: Array<{
      sourceUrl: string
      type: ImageType
      entityId: string
    }>,
  ): Promise<ProcessedImages[]> {
    // Process images sequentially to avoid overwhelming the server
    // Could be parallelized with concurrency limit if needed
    const results: ProcessedImages[] = []

    for (const image of images) {
      try {
        const result = await this.processAndUpload(
          image.sourceUrl,
          image.type,
          image.entityId,
        )
        results.push(result)
      } catch (error) {
        console.error(
          `Failed to process image ${image.sourceUrl}:`,
          error instanceof Error ? error.message : error,
        )
        // Continue with other images even if one fails
      }
    }

    return results
  }

  /**
   * Check if images for an entity already exist in S3
   * Useful to skip re-processing already uploaded images
   */
  async imagesExist(type: ImageType, entityId: string): Promise<boolean> {
    const mobileKey = this.generateKey(type, entityId, 'mobile')
    const fullKey = this.generateKey(type, entityId, 'full')

    const [mobileExists, fullExists] = await Promise.all([
      this.storage.exists(mobileKey),
      this.storage.exists(fullKey),
    ])

    return mobileExists && fullExists
  }
}
