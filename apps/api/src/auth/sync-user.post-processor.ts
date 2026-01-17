import { Inject, Injectable } from '@OneJs/core'
import type { AuthPostProcessor, AuthUser } from '@OneJs/core'
import { FindUserByClerkIdUseCase } from '@users/application/use-cases/find-user-by-clerk-id.use-case'
import { CreateUserUseCase } from '@users/application/use-cases/create-user.use-case'
import { ClerkId, Email } from '@users/domain/value-objects'

/**
 * Post-processor that syncs Clerk users with internal user database
 * This runs after authentication to ensure the user exists in our database
 */
@Injectable()
export class SyncUserPostProcessor implements AuthPostProcessor {
  constructor(
    @Inject(FindUserByClerkIdUseCase)
    private readonly findUserByClerkIdUseCase: FindUserByClerkIdUseCase,
    @Inject(CreateUserUseCase)
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  async process(context: {
    store: {
      user?: AuthUser
    }
  }): Promise<void> {
    const authUser = context.store.user

    if (!authUser) {
      return
    }

    // Check if payload has clerkUser (from ClerkStrategy)
    const clerkUser = authUser.payload?.clerkUser
    if (!clerkUser) {
      // Not a Clerk authentication, skip
      return
    }

    // The userId at this point is the Clerk ID
    const clerkId = ClerkId.createFrom(authUser.userId)

    // Find or create user in our database
    let user = await this.findUserByClerkIdUseCase.execute(clerkId)

    if (!user) {
      // Extract email from Clerk user
      const emailValue =
        clerkUser.emailAddresses?.find(
          (e: { id: string; emailAddress: string }) =>
            e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress || null

      // If email is not available, create a temporary email based on clerkId
      const emailString =
        emailValue?.trim() ||
        `${clerkId.getValue().replace('user_', '')}@clerk.temp`

      const email = Email.createFrom(emailString)
      const firstName = clerkUser.firstName as string | undefined
      const lastName = clerkUser.lastName as string | undefined
      const imageUrl = clerkUser.imageUrl as string | undefined

      user = await this.createUserUseCase.execute(clerkId, email, {
        clerkId: clerkId.getValue(),
        email: email.getValue(),
        name:
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName || null,
        avatar: imageUrl || null,
      })
    }

    // Update the userId in the context to use internal ID
    context.store.user = {
      ...authUser,
      userId: user.getId().getValue(),
      email: user.getEmail().getValue(),
    }
  }
}
