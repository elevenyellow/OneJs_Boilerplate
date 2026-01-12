import { Inject, Injectable, Logger } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { ZoneId } from '@zone/domain/value-objects/id'
import {
  WeatherForecastEntity,
  type WeatherCondition,
} from '../../../domain/entities/weather-forecast.entity'

@Injectable()
export class WeatherPrismaRepository extends PrismaRepository<'weatherForecast'> {
  constructor(
    @Inject(PrismaClientOneJs)
    protected readonly prisma: PrismaClientOneJs,
    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    super(prisma, 'weatherForecast')
  }

  /**
   * Find forecasts for a zone
   */
  async findByZoneId(
    zoneId: ZoneId,
    options?: { startDate?: Date; endDate?: Date; hourly?: boolean },
  ): Promise<WeatherForecastEntity[]> {
    const where: any = { zoneId: zoneId.toString() }

    if (options?.startDate || options?.endDate) {
      where.date = {}
      if (options.startDate) {
        where.date.gte = options.startDate
      }
      if (options.endDate) {
        where.date.lte = options.endDate
      }
    }

    if (options?.hourly !== undefined) {
      where.hour = options.hourly ? { not: null } : null
    }

    const forecasts = await this.prisma.weatherForecast.findMany({
      where,
      orderBy: [{ date: 'asc' }, { hour: 'asc' }],
    })

    return forecasts.map(this.toEntity)
  }

  /**
   * Get daily forecasts for a zone for the next N days
   */
  async getDailyForecasts(
    zoneId: ZoneId,
    days: number = 7,
  ): Promise<WeatherForecastEntity[]> {
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days)

    return this.findByZoneId(zoneId, {
      startDate,
      endDate,
      hourly: false,
    })
  }

  /**
   * Get hourly forecasts for a zone for the next N hours
   */
  async getHourlyForecasts(
    zoneId: ZoneId,
    hours: number = 48,
  ): Promise<WeatherForecastEntity[]> {
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000)

    return this.findByZoneId(zoneId, {
      startDate,
      endDate,
      hourly: true,
    })
  }

  /**
   * Upsert multiple forecasts (insert or update on conflict)
   */
  async upsertForecasts(forecasts: WeatherForecastEntity[]): Promise<void> {
    if (forecasts.length === 0) return

    this.logger.debug('repo:weather', `Upserting ${forecasts.length} forecasts`)

    // Use transactions for batch upserts
    await this.prisma.$transaction(
      forecasts.map((forecast) =>
        this.prisma.weatherForecast.upsert({
          where: {
            zoneId_date_hour: {
              zoneId: forecast.zoneId,
              date: forecast.date,
              hour: forecast.hour ?? -1, // Use -1 for null hours in unique constraint
            },
          },
          create: this.toPrismaCreate(forecast),
          update: this.toPrismaUpdate(forecast),
        }),
      ),
    )

    this.logger.debug(
      'repo:weather',
      `Successfully upserted ${forecasts.length} forecasts`,
    )
  }

  /**
   * Delete old forecasts (cleanup)
   */
  async deleteOldForecasts(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await this.prisma.weatherForecast.deleteMany({
      where: {
        date: { lt: cutoffDate },
      },
    })

    this.logger.info('repo:weather', `Deleted ${result.count} old forecasts`)
    return result.count
  }

  /**
   * Get latest fetch time for a zone
   */
  async getLastFetchTime(zoneId: ZoneId): Promise<Date | null> {
    const latest = await this.prisma.weatherForecast.findFirst({
      where: { zoneId: zoneId.toString() },
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true },
    })

    return latest?.fetchedAt || null
  }

  private toEntity(data: {
    id: string
    zoneId: string
    date: Date
    hour: number | null
    tempMin: number
    tempMax: number
    tempCurrent: number | null
    rainProb: number
    windSpeed: number
    windDirection: string | null
    humidity: number
    condition: string
    conditionIcon: string | null
    uvIndex: number | null
    fetchedAt: Date
  }): WeatherForecastEntity {
    return WeatherForecastEntity.create({
      id: data.id,
      zoneId: data.zoneId,
      date: data.date,
      hour: data.hour ?? undefined,
      tempMin: data.tempMin,
      tempMax: data.tempMax,
      tempCurrent: data.tempCurrent ?? undefined,
      rainProb: data.rainProb,
      windSpeed: data.windSpeed,
      windDirection: data.windDirection ?? undefined,
      humidity: data.humidity,
      condition: data.condition as WeatherCondition,
      conditionIcon: data.conditionIcon ?? undefined,
      uvIndex: data.uvIndex ?? undefined,
      fetchedAt: data.fetchedAt,
    })
  }

  private toPrismaCreate(entity: WeatherForecastEntity) {
    return {
      id: entity.id,
      zoneId: entity.zoneId,
      date: entity.date,
      hour: entity.hour ?? null,
      tempMin: entity.tempMin,
      tempMax: entity.tempMax,
      tempCurrent: entity.tempCurrent ?? null,
      rainProb: entity.rainProb,
      windSpeed: entity.windSpeed,
      windDirection: entity.windDirection ?? null,
      humidity: entity.humidity,
      condition: entity.condition,
      conditionIcon: entity.conditionIcon ?? null,
      uvIndex: entity.uvIndex ?? null,
      fetchedAt: entity.fetchedAt,
    }
  }

  private toPrismaUpdate(entity: WeatherForecastEntity) {
    return {
      tempMin: entity.tempMin,
      tempMax: entity.tempMax,
      tempCurrent: entity.tempCurrent ?? null,
      rainProb: entity.rainProb,
      windSpeed: entity.windSpeed,
      windDirection: entity.windDirection ?? null,
      humidity: entity.humidity,
      condition: entity.condition,
      conditionIcon: entity.conditionIcon ?? null,
      uvIndex: entity.uvIndex ?? null,
      fetchedAt: entity.fetchedAt,
    }
  }
}
