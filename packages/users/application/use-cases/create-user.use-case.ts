import { Inject, Injectable, OneJsError, ErrorCodes } from '@OneJs/core'
import { User } from '@users/domain/entities/user.entity'
import { UserPrismaRepository } from '@users/infrastructure/persistence/prisma/user.repository'
import { ClerkId, Email } from '@users/domain/value-objects'
import type { CreateUserInputDto } from '@users/domain/dtos'

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(UserPrismaRepository)
    private readonly userRepository: UserPrismaRepository,
  ) {}

  async execute(
    clerkId: ClerkId,
    email: Email,
    input: CreateUserInputDto,
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByClerkId(clerkId)
    if (existingUser) {
      throw new OneJsError(
        'User already exists',
        409,
        `User with clerkId ${clerkId.getValue()} already exists`,
        { clerkId: clerkId.getValue() },
        ErrorCodes.RESOURCE_CONFLICT,
      )
    }

    // Check if email is already taken
    const existingEmail = await this.userRepository.findByEmail(email)
    if (existingEmail) {
      throw new OneJsError(
        'Email already in use',
        409,
        `Email ${email.getValue()} is already registered`,
        { email: email.getValue() },
        ErrorCodes.RESOURCE_CONFLICT,
      )
    }

    const user = User.create({
      clerkId: clerkId.getValue(),
      email: email.getValue(),
      name: input.name,
      avatar: input.avatar,
      preferences: input.preferences,
    })

    return this.userRepository.save(user)
  }
}
