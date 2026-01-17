import { Inject, Injectable } from '@OneJs/core'
import { User } from '@users/domain/entities/user.entity'
import { UserPrismaRepository } from '@users/infrastructure/persistence/prisma/user.repository'
import { Id } from '@users/domain/value-objects'

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject(UserPrismaRepository)
    private readonly userRepository: UserPrismaRepository,
  ) {}

  async execute(id: Id): Promise<User | null> {
    return this.userRepository.findById(id)
  }
}
