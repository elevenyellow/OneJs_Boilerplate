// Storage package exports
export { S3StorageService } from './infrastructure/s3/s3-storage.service'
export { ImageProcessorService } from './application/services/image-processor.service'
export type {
  StorageService,
  UploadResult,
  ProcessedImages,
  ImageVariant,
} from './domain/interfaces/storage.interface'
