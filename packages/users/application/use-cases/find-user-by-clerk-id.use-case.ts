import { Inject, Injectable } from '@OneJs/core'
import { User } from '@users/domain/entities/user.entity'
import { UserPrismaRepository } from '@users/infrastructure/persistence/prisma/user.repository'
import { ClerkId } from '@users/domain/value-objects'

@Injectable()
export class FindUserByClerkIdUseCase {
  constructor(
    @Inject(UserPrismaRepository)
    private readonly userRepository: UserPrismaRepository,
  ) {}

  async execute(clerkId: ClerkId): Promise<User | null> {
    return this.userRepository.findByClerkId(clerkId)
  }
}
