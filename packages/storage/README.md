# @climb-zone/storage

Image storage and processing service for ClimbZone. Handles uploading, optimizing, and managing images in AWS S3.

## Features

- Download images from external sources (URLs)
- Process images from Buffer directly
- Optimize images using Sharp (WebP conversion)
- Generate multiple sizes: mobile (800px) and full (original)
- Upload to AWS S3 with proper caching headers
- Support for CDN URLs (CloudFront, etc.)

## Configuration

Set the following environment variables:

```bash
# Required
AWS_S3_BUCKET=climb-zone-images
AWS_S3_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Optional - CDN URL
S3_CDN_URL=https://cdn.climbzone.app
```

## Usage

### Basic Image Upload

```typescript
import { S3StorageService } from '@climb-zone/storage'

const storage = new S3StorageService(configService)

// Upload a buffer
const result = await storage.uploadImage(
  imageBuffer,
  'images/crags/abc123/header-800.webp',
  'image/webp'
)

console.log(result.url) // https://bucket.s3.region.amazonaws.com/...
```

### Process and Upload from URL

```typescript
import { ImageProcessorService } from '@climb-zone/storage'

// The consumer builds the keyPrefix based on their domain logic
const keyPrefix = `images/crags/${cragId}/header`

const result = await processor.processAndUpload({
  source: 'https://example.com/image.jpg',
  keyPrefix,
})

console.log(result.mobile.url)  // S3 URL for 800px version (keyPrefix-800.webp)
console.log(result.full.url)    // S3 URL for full size (keyPrefix-full.webp)
console.log(result.originalUrl) // Original source URL
```

### Process and Upload from Buffer

```typescript
import { ImageProcessorService } from '@climb-zone/storage'

// Read image from file or receive from upload
const imageBuffer = await fs.readFile('photo.jpg')

const result = await processor.processAndUpload({
  source: imageBuffer,
  keyPrefix: 'images/topos/123/main',
})

console.log(result.mobile.url) // S3 URL for 800px version
console.log(result.full.url)   // S3 URL for full size
// result.originalUrl is undefined when source is Buffer
```

### Batch Processing

```typescript
import { ImageProcessorService } from '@climb-zone/storage'

const images = [
  { source: 'https://example.com/topo1.jpg', keyPrefix: 'images/topos/1/main' },
  { source: 'https://example.com/topo2.jpg', keyPrefix: 'images/topos/2/main' },
  { source: 'https://example.com/topo3.jpg', keyPrefix: 'images/topos/3/main' },
]

const results = await processor.processAndUploadBatch(images)

console.log(`Uploaded ${results.length} images`)
```

### Check if Images Exist

```typescript
const keyPrefix = `images/crags/${cragId}/header`
const exists = await processor.imagesExist(keyPrefix)

if (!exists) {
  await processor.processAndUpload({
    source: headerImageUrl,
    keyPrefix,
  })
}
```

## S3 Key Structure

The consumer is responsible for building the `keyPrefix`. The service appends:
- `-800.webp` for mobile variant
- `-full.webp` for full variant

Example key prefixes and resulting S3 keys:

```
keyPrefix: images/crags/123/header
  -> images/crags/123/header-800.webp  (mobile)
  -> images/crags/123/header-full.webp (full)

keyPrefix: images/sectors/456/cover
  -> images/sectors/456/cover-800.webp  (mobile)
  -> images/sectors/456/cover-full.webp (full)

keyPrefix: images/topos/789/main
  -> images/topos/789/main-800.webp  (mobile)
  -> images/topos/789/main-full.webp (full)
```

## Image Processing

- **Mobile version**: Resized to 800px width, WebP quality 85%
- **Full version**: Original dimensions, WebP quality 90%
- Images are cached for 1 year (`Cache-Control: public, max-age=31536000`)

## API Reference

### ProcessAndUploadOptions

```typescript
interface ProcessAndUploadOptions {
  /** URL of the original image or Buffer */
  source: string | Buffer
  /** S3 key prefix without extension (e.g., 'images/crags/123/header') */
  keyPrefix: string
}
```

### ProcessedImages

```typescript
interface ProcessedImages {
  /** Mobile-optimized version (800px width) */
  mobile: ImageVariant
  /** Full-size version (original dimensions, WebP optimized) */
  full: ImageVariant
  /** Original source URL (only set if source was a URL) */
  originalUrl?: string
}
```

### ImageVariant

```typescript
interface ImageVariant {
  /** The S3 URL for this variant */
  url: string
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Size in bytes */
  size: number
}
```

## Dependencies

- `@aws-sdk/client-s3` - AWS S3 client
- `sharp` - Image processing (already in root package.json)
