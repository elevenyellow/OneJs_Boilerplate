/**
 * DTO for header image data
 */
export interface HeaderImageDto {
  headerImageUrl: string
  headerImageWidth?: number
  headerImageHeight?: number
}

/**
 * DTO for S3 header image URLs
 */
export interface HeaderImageS3Dto {
  s3Url: string
  s3UrlFull: string
  originalUrl: string
}
