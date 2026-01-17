import { Inject, Injectable } from '@OneJs/core'
import { AscentPrismaRepository } from '@ascents/infrastructure/persistence/prisma/ascent.repository'
import type { AscentWithRouteDto } from '@ascents/domain/dtos'
import { Id } from '@users/domain/value-objects'

@Injectable()
export class GetUserAscentsUseCase {
  constructor(
    @Inject(AscentPrismaRepository)
    private readonly ascentRepository: AscentPrismaRepository,
  ) {}

  async execute(userId: Id): Promise<AscentWithRouteDto[]> {
    return this.ascentRepository.findByUserIdWithRoutes(userId.getValue())
  }
}
