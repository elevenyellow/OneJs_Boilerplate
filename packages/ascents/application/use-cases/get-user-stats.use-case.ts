import { Inject, Injectable } from '@OneJs/core'
import { AscentPrismaRepository } from '@ascents/infrastructure/persistence/prisma/ascent.repository'
import type { UserStatsDto } from '@ascents/domain/dtos'
import { Id } from '@users/domain/value-objects'

@Injectable()
export class GetUserStatsUseCase {
  constructor(
    @Inject(AscentPrismaRepository)
    private readonly ascentRepository: AscentPrismaRepository,
  ) {}

  async execute(userId: Id): Promise<UserStatsDto> {
    return this.ascentRepository.getStatsByUserId(userId.getValue())
  }
}
