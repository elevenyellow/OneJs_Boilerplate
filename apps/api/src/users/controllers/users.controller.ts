import { Inject, OneJsError, ErrorCodes, UseAuth } from '@OneJs/core'
import { Controller, Get, Post, Patch, type Context } from '@OneJs/server'
import type { CreateUserInputDto, UpdateUserInputDto } from '@users'
import { CreateUserUseCase } from '@users/application/use-cases/create-user.use-case'
import { FindUserByIdUseCase } from '@users/application/use-cases/find-user-by-id.use-case'
import { UpdateUserUseCase } from '@users/application/use-cases/update-user.use-case'
import { Id, ClerkId, Email } from '@users/domain/value-objects'

@Controller('/users')
export class UsersController {
  constructor(
    @Inject(CreateUserUseCase)
    private readonly createUserUseCase: CreateUserUseCase,
    @Inject(FindUserByIdUseCase)
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    @Inject(UpdateUserUseCase)
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  /**
   * Create a new user
   * POST /api/users
   */
  @Post('/')
  async createUser(ctx: Context) {
    const body = ctx.body as CreateUserInputDto

    if (!body || typeof body !== 'object') {
      throw new OneJsError(
        'Invalid request body',
        400,
        'Request body must be a valid JSON object',
        undefined,
        ErrorCodes.PAYLOAD_MALFORMED,
      )
    }

    if (!body.clerkId || typeof body.clerkId !== 'string') {
      throw new OneJsError(
        'clerkId is required',
        400,
        'clerkId field is required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (!body.email || typeof body.email !== 'string') {
      throw new OneJsError(
        'email is required',
        400,
        'email field is required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const clerkId = ClerkId.createFrom(body.clerkId)
    const email = Email.createFrom(body.email)

    const user = await this.createUserUseCase.execute(clerkId, email, body)

    ctx.set.status = 201
    return { user: user.toResponseDto() }
  }

  /**
   * Get current user
   * GET /api/users/me
   * Requires authentication
   */
  @Get('/me')
  @UseAuth()
  async getCurrentUser(ctx: Context) {
    const userId = this.extractUserId(ctx)
    const id = Id.createFrom(userId)

    const user = await this.findUserByIdUseCase.execute(id)

    if (!user) {
      throw new OneJsError(
        'User not found',
        404,
        'Current user not found',
        undefined,
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    }

    return { user: user.toResponseDto() }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   * Requires authentication
   */
  @Get('/:id')
  @UseAuth()
  async getUserById(ctx: Context) {
    const { id: userId } = ctx.params as { id: string }

    if (!userId) {
      throw new OneJsError(
        'Missing user ID',
        400,
        'id path parameter is required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const id = Id.createFrom(userId)
    const user = await this.findUserByIdUseCase.execute(id)

    if (!user) {
      throw new OneJsError(
        'User not found',
        404,
        `User with id ${userId} not found`,
        { id: userId },
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    }

    return { user: user.toResponseDto() }
  }

  /**
   * Update user
   * PATCH /api/users/:id
   * Requires authentication
   */
  @Patch('/:id')
  @UseAuth()
  async updateUser(ctx: Context) {
    const { id: userId } = ctx.params as { id: string }
    const body = ctx.body as UpdateUserInputDto

    if (!userId) {
      throw new OneJsError(
        'Missing user ID',
        400,
        'id path parameter is required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (!body || typeof body !== 'object') {
      throw new OneJsError(
        'Invalid request body',
        400,
        'Request body must be a valid JSON object',
        undefined,
        ErrorCodes.PAYLOAD_MALFORMED,
      )
    }

    const id = Id.createFrom(userId)
    const user = await this.updateUserUseCase.execute(id, body)

    return { user: user.toResponseDto() }
  }

  private extractUserId(ctx: Context): string {
    const store = ctx.store as { user?: { userId: string } } | undefined
    const user = store?.user
    if (user?.userId) {
      return user.userId
    }

    throw new OneJsError(
      'User ID is required',
      401,
      'User must be authenticated',
      undefined,
      ErrorCodes.AUTH_MISSING,
    )
  }
}
