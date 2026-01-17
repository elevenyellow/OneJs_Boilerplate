import type { AscentDatabaseDto, AscentResponseDto } from '../dtos'
import {
  AscentId,
  AscentStyle,
  GradeEvaluation,
  WallType,
  Characteristics,
  SafetyConcerns,
  AscentQuality,
  Tries,
} from '../value-objects'
import { isValidGradeBand } from '../mappings'

export interface AscentCreateInput {
  id?: string
  userId: string
  routeId: string
  style: number
  gradeBand: number
  gradeEvaluation: number
  wallType?: number | null
  characteristics: number
  safetyConcerns: number
  quality: number
  tries: number
  isRepeat: boolean
  comments?: string | null
  ascentDate: Date
}

export class Ascent {
  private constructor(
    private readonly id: AscentId,
    private readonly userId: string,
    private readonly routeId: string,
    private readonly style: AscentStyle,
    private readonly gradeBand: number,
    private readonly gradeEvaluation: GradeEvaluation,
    private readonly wallType: WallType,
    private readonly characteristics: Characteristics,
    private readonly safetyConcerns: SafetyConcerns,
    private readonly quality: AscentQuality,
    private readonly tries: Tries,
    private readonly isRepeat: boolean,
    private readonly comments: string | null,
    private readonly ascentDate: Date,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(input: AscentCreateInput): Ascent {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new Error('userId is required')
    }
    if (!input.routeId || input.routeId.trim().length === 0) {
      throw new Error('routeId is required')
    }
    if (!isValidGradeBand(input.gradeBand)) {
      throw new Error(`Invalid gradeBand: ${input.gradeBand}. Must be 1-5.`)
    }

    const now = new Date()

    return new Ascent(
      input.id ? AscentId.createFrom(input.id) : AscentId.generate(),
      input.userId,
      input.routeId,
      AscentStyle.createFrom(input.style),
      input.gradeBand,
      GradeEvaluation.createFrom(input.gradeEvaluation),
      WallType.createFrom(input.wallType),
      Characteristics.createFrom(input.characteristics),
      SafetyConcerns.createFrom(input.safetyConcerns),
      AscentQuality.createFrom(input.quality),
      Tries.createFrom(input.tries),
      input.isRepeat,
      input.comments ?? null,
      input.ascentDate,
      now,
      now,
    )
  }

  static fromDatabase(dto: AscentDatabaseDto): Ascent {
    return new Ascent(
      AscentId.createFrom(dto.id),
      dto.userId,
      dto.routeId,
      AscentStyle.createFrom(dto.style),
      dto.gradeBand,
      GradeEvaluation.createFrom(dto.gradeEvaluation),
      WallType.createFrom(dto.wallType),
      Characteristics.createFrom(dto.characteristics),
      SafetyConcerns.createFrom(dto.safetyConcerns),
      AscentQuality.createFrom(dto.quality),
      Tries.createFrom(dto.tries),
      dto.isRepeat,
      dto.comments,
      dto.ascentDate,
      dto.createdAt,
      dto.updatedAt,
    )
  }

  getId(): AscentId {
    return this.id
  }

  getUserId(): string {
    return this.userId
  }

  getRouteId(): string {
    return this.routeId
  }

  getStyle(): AscentStyle {
    return this.style
  }

  getGradeBand(): number {
    return this.gradeBand
  }

  getGradeEvaluation(): GradeEvaluation {
    return this.gradeEvaluation
  }

  getWallType(): WallType {
    return this.wallType
  }

  getCharacteristics(): Characteristics {
    return this.characteristics
  }

  getSafetyConcerns(): SafetyConcerns {
    return this.safetyConcerns
  }

  getQuality(): AscentQuality {
    return this.quality
  }

  getTries(): Tries {
    return this.tries
  }

  getIsRepeat(): boolean {
    return this.isRepeat
  }

  getComments(): string | null {
    return this.comments
  }

  getAscentDate(): Date {
    return this.ascentDate
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  toDatabaseDto(): AscentDatabaseDto {
    return {
      id: this.id.getValue(),
      userId: this.userId,
      routeId: this.routeId,
      style: this.style.getValue(),
      gradeBand: this.gradeBand,
      gradeEvaluation: this.gradeEvaluation.getValue(),
      wallType: this.wallType.getValue(),
      characteristics: this.characteristics.getValue(),
      safetyConcerns: this.safetyConcerns.getValue(),
      quality: this.quality.getValue(),
      tries: this.tries.getValue(),
      isRepeat: this.isRepeat,
      comments: this.comments,
      ascentDate: this.ascentDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  toResponseDto(): AscentResponseDto {
    return {
      id: this.id.getValue(),
      userId: this.userId,
      routeId: this.routeId,
      style: this.style.getValue(),
      gradeBand: this.gradeBand,
      gradeEvaluation: this.gradeEvaluation.getValue(),
      wallType: this.wallType.getValue(),
      characteristics: this.characteristics.getValue(),
      safetyConcerns: this.safetyConcerns.getValue(),
      quality: this.quality.getValue(),
      tries: this.tries.getValue(),
      isRepeat: this.isRepeat,
      comments: this.comments,
      ascentDate: this.ascentDate.toISOString(),
      createdAt: this.createdAt.toISOString(),
    }
  }
}
