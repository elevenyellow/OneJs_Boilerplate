// Domain - Entities
export { User } from './domain/entities/user.entity'

// Domain - Value Objects
export { Id, ClerkId, Email, UserName } from './domain/value-objects'

// Domain - DTOs
export type {
  UserDatabaseDto,
  UserResponseDto,
  CreateUserInputDto,
  UpdateUserInputDto,
} from './domain/dtos'

// Application - Use Cases
export { CreateUserUseCase } from './application/use-cases/create-user.use-case'
export { FindUserByClerkIdUseCase } from './application/use-cases/find-user-by-clerk-id.use-case'
export { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case'
export { UpdateUserUseCase } from './application/use-cases/update-user.use-case'

// Infrastructure - Repository
export { UserPrismaRepository } from './infrastructure/persistence/prisma/user.repository'
