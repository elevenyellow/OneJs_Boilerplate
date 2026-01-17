// Domain - Entities
export { Ascent } from './domain/entities/ascent.entity'

// Domain - Value Objects
export {
  AscentId,
  AscentStyle,
  GradeEvaluation,
  WallType,
  Characteristics,
  SafetyConcerns,
  AscentQuality,
  Tries,
} from './domain/value-objects'

// Domain - DTOs
export type {
  AscentDatabaseDto,
  AscentResponseDto,
  CreateAscentInputDto,
  AscentWithRouteDto,
  UserStatsDto,
} from './domain/dtos'

// Domain - Mappings
export {
  ASCENT_STYLE,
  ASCENT_STYLE_LABELS,
  GRADE_EVALUATION,
  GRADE_EVALUATION_LABELS,
  WALL_TYPE,
  WALL_TYPE_LABELS,
  CHARACTERISTIC,
  CHARACTERISTIC_LABELS,
  SAFETY_CONCERN,
  SAFETY_CONCERN_LABELS,
  GRADE_BAND,
  GRADE_BAND_LABELS,
  isValidAscentStyle,
  isValidGradeEvaluation,
  isValidWallType,
  isValidGradeBand,
  type AscentStyleValue,
  type GradeEvaluationValue,
  type WallTypeValue,
  type CharacteristicFlag,
  type SafetyConcernFlag,
  type GradeBandValue,
} from './domain/mappings'

// Application - Use Cases
export { CreateAscentUseCase } from './application/use-cases/create-ascent.use-case'
export { GetUserStatsUseCase } from './application/use-cases/get-user-stats.use-case'
export { GetUserAscentsUseCase } from './application/use-cases/get-user-ascents.use-case'

// Infrastructure - Repository
export { AscentPrismaRepository } from './infrastructure/persistence/prisma/ascent.repository'
