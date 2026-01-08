import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { 
  ForecastEntity, 
  type DailyForecast, 
  type HourlyForecast,
  type WeatherCondition,
  type ClimbingCondition 
} from '@weather/domain/entities/forecast.entity'

@Injectable()
export class WeatherPrismaRepository extends PrismaRepository<'weatherForecast'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'weatherForecast')
  }

  async findByZoneId(zoneId: string): Promise<ForecastEntity | null> {
    const forecast = await this.prisma.weatherForecast.findFirst({
      where: { zoneId },
      orderBy: { fetchedAt: 'desc' },
    })

    return forecast ? this.toEntity(forecast) : null
  }

  async findById(id: string): Promise<ForecastEntity | null> {
    const forecast = await this.prisma.weatherForecast.findUnique({
      where: { id },
    })

    return forecast ? this.toEntity(forecast) : null
  }

  async createEntity(forecast: ForecastEntity): Promise<ForecastEntity> {
    await this.prisma.weatherForecast.create({
      data: this.toPrismaCreate(forecast),
    })

    return (await this.findById(forecast.id))!
  }

  async updateEntity(forecast: ForecastEntity): Promise<void> {
    await this.prisma.weatherForecast.update({
      where: { id: forecast.id },
      data: this.toPrismaUpdate(forecast),
    })
  }

  async deleteEntity(id: string): Promise<void> {
    await this.prisma.weatherForecast.delete({ where: { id } })
  }

  async deleteOldForecasts(olderThan: Date): Promise<number> {
    const result = await this.prisma.weatherForecast.deleteMany({
      where: { fetchedAt: { lt: olderThan } },
    })
    return result.count
  }

  private toEntity(data: WeatherForecastPrismaData): ForecastEntity {
    return new ForecastEntity(
      data.zoneId,
      data.zoneName,
      data.daily as DailyForecast[],
      data.fetchedAt,
      data.source,
      data.id,
    )
  }

  private toPrismaCreate(forecast: ForecastEntity) {
    return {
      id: forecast.id,
      zoneId: forecast.zoneId,
      zoneName: forecast.zoneName,
      daily: forecast.daily as unknown as object,
      fetchedAt: forecast.fetchedAt,
      source: forecast.source,
    }
  }

  private toPrismaUpdate(forecast: ForecastEntity) {
    return {
      daily: forecast.daily as unknown as object,
      fetchedAt: new Date(),
      source: forecast.source,
    }
  }
}

// Type for Prisma data
interface WeatherForecastPrismaData {
  id: string
  zoneId: string
  zoneName: string
  daily: unknown
  fetchedAt: Date
  source: string
  createdAt: Date
  updatedAt: Date
}


