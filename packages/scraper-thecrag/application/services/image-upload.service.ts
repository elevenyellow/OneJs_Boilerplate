import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import {
  ImageProcessorService,
  type ProcessedImages,
} from '@climb-zone/storage'
import { CragPrismaRepository } from '@climb-zone/crag'
import { SectorPrismaRepository } from '@climb-zone/sector'
import { TopoPrismaRepository } from '@climb-zone/topo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { TopoImageId } from '@topo/domain/value-objects/topo-image-id.vo'

export interface ImageUploadResult {
  cragsProcessed: number
  sectorsProcessed: number
  toposProcessed: number
  cragToposProcessed: number
  errors: Array<{ type: string; id: string; error: string }>
}

/**
 * Service for uploading images to S3 after scraping
 * Processes and optimizes images, then updates the database with S3 URLs
 */
@Injectable()
export class ImageUploadService {
  constructor(
    @Inject(ImageProcessorService)
    private readonly imageProcessor: ImageProcessorService,
    @Inject(CragPrismaRepository)
    private readonly cragRepo: CragPrismaRepository,
    @Inject(SectorPrismaRepository)
    private readonly sectorRepo: SectorPrismaRepository,
    @Inject(TopoPrismaRepository)
    private readonly topoRepo: TopoPrismaRepository,
    @Inject(PrismaClientOneJs)
    private readonly prisma: PrismaClientOneJs,
  ) {}

  /**
   * Process and upload header image for a crag
   */
  async uploadCragHeaderImage(
    cragId: CragId,
    sourceUrl: string,
  ): Promise<ProcessedImages | null> {
    try {
      const result = await this.imageProcessor.processAndUpload(
        sourceUrl,
        'crag-header',
        cragId.toString(),
      )

      await this.cragRepo.updateHeaderImageS3(cragId, {
        s3Url: result.mobile.url,
        s3UrlFull: result.full.url,
        originalUrl: result.originalUrl,
      })

      return result
    } catch (error) {
      console.error(
        `Failed to upload crag header image for ${cragId.toString()}:`,
        error instanceof Error ? error.message : error,
      )
      return null
    }
  }

  /**
   * Process and upload header image for a sector
   */
  async uploadSectorHeaderImage(
    sectorId: SectorId,
    sourceUrl: string,
  ): Promise<ProcessedImages | null> {
    try {
      const result = await this.imageProcessor.processAndUpload(
        sourceUrl,
        'sector-header',
        sectorId.toString(),
      )

      await this.sectorRepo.updateHeaderImageS3(sectorId, {
        s3Url: result.mobile.url,
        s3UrlFull: result.full.url,
        originalUrl: result.originalUrl,
      })

      return result
    } catch (error) {
      console.error(
        `Failed to upload sector header image for ${sectorId.toString()}:`,
        error instanceof Error ? error.message : error,
      )
      return null
    }
  }

  /**
   * Process and upload topo image
   */
  async uploadTopoImage(
    topoId: TopoImageId,
    sourceUrl: string,
  ): Promise<ProcessedImages | null> {
    try {
      const result = await this.imageProcessor.processAndUpload(
        sourceUrl,
        'topo',
        topoId.toString(),
      )

      await this.topoRepo.updateTopoS3Urls(topoId, {
        thumbnailS3Url: result.mobile.url,
        fullImageS3Url: result.full.url,
        originalSourceUrl: result.originalUrl,
      })

      return result
    } catch (error) {
      console.error(
        `Failed to upload topo image for ${topoId.toString()}:`,
        error instanceof Error ? error.message : error,
      )
      return null
    }
  }

  /**
   * Process and upload crag topo image
   */
  async uploadCragTopoImage(
    topoId: TopoImageId,
    sourceUrl: string,
  ): Promise<ProcessedImages | null> {
    try {
      const result = await this.imageProcessor.processAndUpload(
        sourceUrl,
        'crag-topo',
        topoId.toString(),
      )

      await this.topoRepo.updateCragTopoS3Urls(topoId, {
        thumbnailS3Url: result.mobile.url,
        fullImageS3Url: result.full.url,
        originalSourceUrl: result.originalUrl,
      })

      return result
    } catch (error) {
      console.error(
        `Failed to upload crag topo image for ${topoId.toString()}:`,
        error instanceof Error ? error.message : error,
      )
      return null
    }
  }

  /**
   * Batch process all images for a crag import
   * Call this after the import is complete to upload all images to S3
   */
  async processImportImages(
    cragId: CragId,
    options: {
      uploadCragHeader?: boolean
      uploadSectorHeaders?: boolean
      uploadTopos?: boolean
      uploadCragTopos?: boolean
    } = {},
  ): Promise<ImageUploadResult> {
    const {
      uploadCragHeader = true,
      uploadSectorHeaders = true,
      uploadTopos = true,
      uploadCragTopos = true,
    } = options

    const result: ImageUploadResult = {
      cragsProcessed: 0,
      sectorsProcessed: 0,
      toposProcessed: 0,
      cragToposProcessed: 0,
      errors: [],
    }

    console.log(
      `\n📷 Starting S3 image upload for crag ${cragId.toString()}...`,
    )

    // 1. Upload crag header image
    if (uploadCragHeader) {
      const crag = await this.cragRepo.findById(cragId)
      if (crag?.headerImageUrl && !crag.headerImageS3Url) {
        console.log(`   🖼️  Uploading crag header image...`)
        const processed = await this.uploadCragHeaderImage(
          cragId,
          crag.headerImageUrl,
        )
        if (processed) {
          result.cragsProcessed++
          console.log(`      ✅ Crag header uploaded: ${processed.mobile.url}`)
        } else {
          result.errors.push({
            type: 'crag-header',
            id: cragId.toString(),
            error: 'Failed to process image',
          })
        }
      }
    }

    // 2. Upload sector header images
    if (uploadSectorHeaders) {
      // Get all sectors for this crag through areas
      const areas = await this.prisma.area.findMany({
        where: { cragId: cragId.toString() },
        select: { id: true },
      })

      for (const area of areas) {
        const sectors = await this.prisma.sector.findMany({
          where: {
            areaId: area.id,
            headerImageUrl: { not: null },
            headerImageS3Url: null,
          },
          select: { id: true, headerImageUrl: true },
        })

        for (const sector of sectors) {
          if (sector.headerImageUrl) {
            console.log(`   🖼️  Uploading sector header: ${sector.id}...`)
            const processed = await this.uploadSectorHeaderImage(
              SectorId.fromString(sector.id),
              sector.headerImageUrl,
            )
            if (processed) {
              result.sectorsProcessed++
            } else {
              result.errors.push({
                type: 'sector-header',
                id: sector.id,
                error: 'Failed to process image',
              })
            }
          }
        }
      }
    }

    // 3. Upload topo images
    if (uploadTopos) {
      const topos = await this.prisma.topoImage.findMany({
        where: {
          sector: {
            area: {
              cragId: cragId.toString(),
            },
          },
          fullImageS3Url: null,
        },
        select: { id: true, fullImageUrl: true },
      })

      for (const topo of topos) {
        console.log(`   🖼️  Uploading topo: ${topo.id}...`)
        const processed = await this.uploadTopoImage(
          TopoImageId.fromString(topo.id),
          topo.fullImageUrl,
        )
        if (processed) {
          result.toposProcessed++
        } else {
          result.errors.push({
            type: 'topo',
            id: topo.id,
            error: 'Failed to process image',
          })
        }
      }
    }

    // 4. Upload crag topo images
    if (uploadCragTopos) {
      const cragTopos = await this.prisma.cragTopoImage.findMany({
        where: {
          cragId: cragId.toString(),
          fullImageS3Url: null,
        },
        select: { id: true, fullImageUrl: true },
      })

      for (const topo of cragTopos) {
        console.log(`   🖼️  Uploading crag topo: ${topo.id}...`)
        const processed = await this.uploadCragTopoImage(
          TopoImageId.fromString(topo.id),
          topo.fullImageUrl,
        )
        if (processed) {
          result.cragToposProcessed++
        } else {
          result.errors.push({
            type: 'crag-topo',
            id: topo.id,
            error: 'Failed to process image',
          })
        }
      }
    }

    console.log(`\n✅ S3 upload complete:`)
    console.log(`   - Crag headers: ${result.cragsProcessed}`)
    console.log(`   - Sector headers: ${result.sectorsProcessed}`)
    console.log(`   - Topos: ${result.toposProcessed}`)
    console.log(`   - Crag topos: ${result.cragToposProcessed}`)
    if (result.errors.length > 0) {
      console.log(`   - Errors: ${result.errors.length}`)
    }

    return result
  }
}
