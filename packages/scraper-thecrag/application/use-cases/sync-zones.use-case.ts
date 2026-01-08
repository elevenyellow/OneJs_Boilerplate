import { Inject, Injectable } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { v4 as uuidv4 } from 'uuid'
import { ClimbingZoneEntity } from '@scraper-thecrag/domain/entities/climbing-zone.entity'
import type { ScrapedZoneDto } from '@scraper-thecrag/domain/dtos/scraped-zone.dto'
import { ZonePrismaRepository } from '@scraper-thecrag/infrastructure/persistence/prisma/zone.repository'
import { ScrapeZonesUseCase } from './scrape-zones.use-case'
import type { ScrapeOptionsDto } from '@scraper-thecrag/domain/dtos/scrape-options.dto'

export interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: SyncError[]
  duration: number
}

export interface SyncError {
  externalId: string
  name: string
  message: string
}

@Injectable()
export class SyncZonesUseCase {
  constructor(
    @Inject(ZonePrismaRepository)
    private readonly zoneRepository: ZonePrismaRepository,
    @Inject(ScrapeZonesUseCase)
    private readonly scrapeUseCase: ScrapeZonesUseCase,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Sincroniza zonas scrapeadas con la base de datos
   */
  async execute(options: ScrapeOptionsDto = {}): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      duration: 0,
    }

    console.log('🔄 Starting zone synchronization...')

    // 1. Scrapear zonas
    const scrapeResult = await this.scrapeUseCase.execute(options)

    if (!scrapeResult.success) {
      console.error('❌ Scraping failed, aborting sync')
      result.errors.push({
        externalId: 'scraping',
        name: 'Scraping Phase',
        message: scrapeResult.message,
      })
      result.duration = Date.now() - startTime
      return result
    }

    // 2. Obtener IDs existentes para comparación rápida
    const existingIds = new Set(await this.zoneRepository.getAllExternalIds())

    // 3. Procesar cada zona scrapeada
    for (const scrapedZone of scrapeResult.result.zones) {
      try {
        const syncAction = await this.syncZone(
          scrapedZone,
          existingIds.has(scrapedZone.externalId),
          options.updateExisting ?? true,
        )

        switch (syncAction) {
          case 'created':
            result.created++
            break
          case 'updated':
            result.updated++
            break
          case 'skipped':
            result.skipped++
            break
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        result.errors.push({
          externalId: scrapedZone.externalId,
          name: scrapedZone.name,
          message,
        })
      }
    }

    result.duration = Date.now() - startTime

    console.log('✅ Synchronization completed:', {
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.length,
      duration: `${(result.duration / 1000).toFixed(2)}s`,
    })

    return result
  }

  /**
   * Sincroniza una zona individual
   */
  private async syncZone(
    dto: ScrapedZoneDto,
    exists: boolean,
    updateExisting: boolean,
  ): Promise<'created' | 'updated' | 'skipped'> {
    if (exists && !updateExisting) {
      return 'skipped'
    }

    const entity = this.dtoToEntity(dto)

    if (exists) {
      // Actualizar zona existente
      const existing = await this.zoneRepository.findByExternalId(dto.externalId)
      if (existing) {
        existing.updateFrom(entity)
        await this.zoneRepository.updateEntity(existing)
        return 'updated'
      }
    }

    // Crear nueva zona
    await this.zoneRepository.createEntity(entity)
    return 'created'
  }

  /**
   * Sincroniza solo las zonas proporcionadas (sin scrapear)
   */
  async syncFromDtos(
    zones: ScrapedZoneDto[],
    updateExisting: boolean = true,
  ): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      duration: 0,
    }

    const existingIds = new Set(await this.zoneRepository.getAllExternalIds())

    for (const dto of zones) {
      try {
        const action = await this.syncZone(
          dto,
          existingIds.has(dto.externalId),
          updateExisting,
        )

        switch (action) {
          case 'created':
            result.created++
            break
          case 'updated':
            result.updated++
            break
          case 'skipped':
            result.skipped++
            break
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        result.errors.push({
          externalId: dto.externalId,
          name: dto.name,
          message,
        })
      }
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Convierte un DTO scrapeado a entidad
   */
  private dtoToEntity(dto: ScrapedZoneDto): ClimbingZoneEntity {
    return ClimbingZoneEntity.create({
      id: uuidv4(),
      externalId: dto.externalId,
      name: dto.name,
      country: dto.country,
      region: dto.region,
      latitude: dto.latitude,
      longitude: dto.longitude,
      routeCount: dto.routeCount,
      climbTypes: dto.climbTypes,
      minGrade: dto.minGrade,
      maxGrade: dto.maxGrade,
      description: dto.description,
      accessInfo: dto.accessInfo,
      imageUrl: dto.imageUrl,
      sourceUrl: dto.sourceUrl,
    })
  }

  /**
   * Obtiene estadísticas de zonas por país
   */
  async getZoneStats(): Promise<Record<string, number>> {
    return this.zoneRepository.countByCountry()
  }
}


