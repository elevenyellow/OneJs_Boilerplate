import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ConfigService, Inject, Injectable } from '@OneJs/core'
import type {
  StorageService,
  UploadResult,
} from '../../domain/interfaces/storage.interface'

export interface S3Config {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  /** Optional CDN URL to use instead of S3 URL */
  cdnUrl?: string
}

/**
 * S3 Storage Service implementation
 * Handles uploading, deleting, and managing files in AWS S3
 */
@Injectable()
export class S3StorageService implements StorageService {
  private client: S3Client | null = null
  private bucket = ''
  private region = ''
  private cdnUrl?: string
  private configured = false

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {
    const s3Config = this.loadConfig()
    if (s3Config) {
      this.bucket = s3Config.bucket
      this.region = s3Config.region
      this.cdnUrl = s3Config.cdnUrl
      this.configured = true

      this.client = new S3Client({
        region: s3Config.region,
        credentials: {
          accessKeyId: s3Config.accessKeyId,
          secretAccessKey: s3Config.secretAccessKey,
        },
      })
    }
  }

  /**
   * Check if S3 is configured and ready to use
   */
  isConfigured(): boolean {
    return this.configured
  }

  private loadConfig(): S3Config | null {
    const bucket = this.config.get('AWS_S3_BUCKET')
    const region = this.config.get('AWS_S3_REGION')
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID')
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY')
    const cdnUrl = this.config.get('S3_CDN_URL')

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      return null
    }

    return {
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
      cdnUrl,
    }
  }

  /**
   * Get the public URL for a given key
   */
  private getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`
  }

  /**
   * Upload an image buffer to S3
   */
  async uploadImage(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<UploadResult> {
    if (!this.client) {
      throw new Error('S3 is not configured')
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year cache
    })

    await this.client.send(command)

    return {
      key,
      url: this.getPublicUrl(key),
      contentType,
      size: buffer.length,
    }
  }

  /**
   * Delete an image from S3
   */
  async deleteImage(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 is not configured')
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await this.client.send(command)
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.client) {
      throw new Error('S3 is not configured')
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    return getSignedUrl(this.client, command, { expiresIn })
  }

  /**
   * Check if a file exists in S3
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
      await this.client.send(command)
      return true
    } catch {
      return false
    }
  }

  /**
   * Upload multiple images in parallel
   */
  async uploadImages(
    images: Array<{ buffer: Buffer; key: string; contentType: string }>,
  ): Promise<UploadResult[]> {
    return Promise.all(
      images.map((img) =>
        this.uploadImage(img.buffer, img.key, img.contentType),
      ),
    )
  }
}
