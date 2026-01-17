import { Inject, Injectable, OneJsError, ErrorCodes } from '@OneJs/core'
import { Ascent } from '@ascents/domain/entities/ascent.entity'
import { AscentPrismaRepository } from '@ascents/infrastructure/persistence/prisma/ascent.repository'
import type { CreateAscentInputDto } from '@ascents/domain/dtos'
import { Id } from '@users/domain/value-objects'

@Injectable()
export class CreateAscentUseCase {
  constructor(
    @Inject(AscentPrismaRepository)
    private readonly ascentRepository: AscentPrismaRepository,
  ) {}

  async execute(userId: Id, input: CreateAscentInputDto): Promise<Ascent> {
    if (!input.routeId || input.routeId.trim().length === 0) {
      throw new OneJsError(
        'Route ID is required',
        400,
        'routeId field is required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const ascentDate = new Date(input.ascentDate)
    if (Number.isNaN(ascentDate.getTime())) {
      throw new OneJsError(
        'Invalid ascent date',
        400,
        'ascentDate must be a valid ISO date string',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const ascent = Ascent.create({
      userId: userId.getValue(),
      routeId: input.routeId,
      style: input.style,
      gradeBand: input.gradeBand,
      gradeEvaluation: input.gradeEvaluation,
      wallType: input.wallType,
      characteristics: input.characteristics,
      safetyConcerns: input.safetyConcerns,
      quality: input.quality,
      tries: input.tries,
      isRepeat: input.isRepeat,
      comments: input.comments,
      ascentDate,
    })

    return this.ascentRepository.save(ascent)
  }
}
