import { Inject, Injectable } from '@onejs/core'
import { EventBus } from '@onejs/event-bus'
import { EyJsError } from '@onejs/server'
import { MongoUserFactory } from '@user/infrastructure/factories/mongo-user.factory'
import { UserPrismaRepository } from '@user/infrastructure/persistence/prisma/user.repository'
import { CreateUserDto } from '../../domain/dtos/create-user.dto'
import type { UserEntity } from '../../domain/entities/user.entity'
import { UserCreatedEvent } from '../../domain/events/user-created.event'
import type { UserFactory } from '../../domain/factories/user-factory.interface'
import type { PasswordValidationStrategy } from '../../domain/strategies/password-validation.strategy'
import { StrongPasswordStrategy } from '../../domain/strategies/strong-password.strategy'

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(UserPrismaRepository)
    private readonly userRepository: UserPrismaRepository,
    @Inject(MongoUserFactory) private readonly userFactory: UserFactory,
    @Inject(StrongPasswordStrategy)
    private readonly passwordStrategy: PasswordValidationStrategy,
    @Inject(EventBus) private readonly eventBus: EventBus,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserEntity> {
    // Validar contraseña usando la estrategia
    if (!this.passwordStrategy.validate(dto.password)) {
      throw new EyJsError(
        this.passwordStrategy.getErrorMessage(),
        400,
        this.passwordStrategy.getErrorMessage(),
      )
    }

    // Crear usuario usando la factory
    const user = this.userFactory.createUser(dto)

    // Guardar usuario en la base de datos
    await this.userRepository.createEntity(user)

    // Publicar evento usando el patrón Observer
    await this.eventBus.publish(new UserCreatedEvent(user))

    return user
  }
}
