# @climb-zone/storage

Image storage and processing service for ClimbZone. Handles uploading, optimizing, and managing images in AWS S3.

## Features

- Download images from external sources (e.g., TheCrag)
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

const storage = new S3StorageService()

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

const processor = new ImageProcessorService(storage)

// Download, optimize, and upload
const result = await processor.processAndUpload(
  'https://image.thecrag.com/1200x800/12/34/photo.jpg',
  'crag-header',
  'abc123'  // cragId
)

console.log(result.mobile.url)  // S3 URL for 800px version
console.log(result.full.url)    // S3 URL for full size
console.log(result.originalUrl) // Original TheCrag URL
```

### After Import (with ImageUploadService)

```typescript
import { ImageUploadService } from '@climb-zone/scraper-thecrag'

// After importing a crag
const uploadResult = await imageUploadService.processImportImages(cragId, {
  uploadCragHeader: true,
  uploadSectorHeaders: true,
  uploadTopos: true,
  uploadCragTopos: true,
})

console.log(`Uploaded ${uploadResult.toposProcessed} topos to S3`)
```

## S3 Key Structure

Images are organized in S3 as follows:

```
images/
├── crags/
│   └── {cragId}/
│       ├── header-800.webp     # Mobile optimized
│       └── header-full.webp    # Full size
├── sectors/
│   └── {sectorId}/
│       ├── header-800.webp
│       └── header-full.webp
├── topos/
│   └── {topoId}/
│       ├── thumb.webp          # Mobile optimized
│       └── full.webp           # Full size
└── crag-topos/
    └── {topoId}/
        ├── thumb.webp
        └── full.webp
```

## Image Processing

- **Mobile version**: Resized to 800px width, WebP quality 85%
- **Full version**: Original dimensions, WebP quality 90%
- Images are cached for 1 year (`Cache-Control: public, max-age=31536000`)

## Dependencies

- `@aws-sdk/client-s3` - AWS S3 client
- `sharp` - Image processing (already in root package.json)
