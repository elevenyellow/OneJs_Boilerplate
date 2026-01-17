import { Inject, Injectable, OneJsError, ErrorCodes } from '@OneJs/core'
import { User } from '@users/domain/entities/user.entity'
import { UserPrismaRepository } from '@users/infrastructure/persistence/prisma/user.repository'
import { Id } from '@users/domain/value-objects'
import type { UpdateUserInputDto } from '@users/domain/dtos'

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(UserPrismaRepository)
    private readonly userRepository: UserPrismaRepository,
  ) {}

  async execute(id: Id, input: UpdateUserInputDto): Promise<User> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new OneJsError(
        'User not found',
        404,
        `User with id ${id.getValue()} not found`,
        { id: id.getValue() },
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    }

    const updatedUser = user.update(input)

    return this.userRepository.save(updatedUser)
  }
}
