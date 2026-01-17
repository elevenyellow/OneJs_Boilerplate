import {
  Inject,
  OneJsError,
  ErrorCodes,
  ConfigService,
  UseAuth,
} from '@OneJs/core'
import { Controller, Get, Post, type Context } from '@OneJs/server'
import { CreateAscentUseCase } from '@ascents/application/use-cases/create-ascent.use-case'
import { GetUserStatsUseCase } from '@ascents/application/use-cases/get-user-stats.use-case'
import { GetUserAscentsUseCase } from '@ascents/application/use-cases/get-user-ascents.use-case'
import type { CreateAscentInputDto } from '@ascents/domain/dtos'
import { Id } from '@users/domain/value-objects'

const DEFAULT_MOCK_USER_ID = 'mock-user-1'

@Controller('/ascents')
export class AscentsController {
  constructor(
    @Inject(CreateAscentUseCase)
    private readonly createAscentUseCase: CreateAscentUseCase,
    @Inject(GetUserStatsUseCase)
    private readonly getUserStatsUseCase: GetUserStatsUseCase,
    @Inject(GetUserAscentsUseCase)
    private readonly getUserAscentsUseCase: GetUserAscentsUseCase,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new ascent
   * POST /api/ascents
   * Requires authentication - user ID is extracted from Clerk token
   */
  @Post('/')
  @UseAuth()
  async createAscent(ctx: Context) {
    const userId = this.extractUserId(ctx)
    const body = ctx.body as CreateAscentInputDto

    if (!body || typeof body !== 'object') {
      throw new OneJsError(
        'Invalid request body',
        400,
        'Request body must be a valid JSON object',
        undefined,
        ErrorCodes.PAYLOAD_MALFORMED,
      )
    }

    const ascent = await this.createAscentUseCase.execute(userId, body)

    ctx.set.status = 201
    return { ascent: ascent.toResponseDto() }
  }

  /**
   * Get user stats
   * GET /api/ascents/stats
   * Requires authentication - user ID is extracted from Clerk token
   */
  @Get('/stats')
  @UseAuth()
  async getUserStats(ctx: Context) {
    const userId = this.extractUserId(ctx)

    const stats = await this.getUserStatsUseCase.execute(userId)

    return { stats }
  }

  /**
   * Get user ascents with route and crag information
   * GET /api/ascents
   * Requires authentication - user ID is extracted from Clerk token
   */
  @Get('/')
  @UseAuth()
  async getUserAscents(ctx: Context) {
    const userId = this.extractUserId(ctx)

    const ascents = await this.getUserAscentsUseCase.execute(userId)

    return { ascents }
  }

  private extractUserId(ctx: Context): Id {
    // In local development, allow mock user ID
    if (this.configService.get('NODE_ENV') === 'local_development') {
      // Check if user is authenticated, otherwise use mock
      const store = ctx.store as { user?: { userId: string } } | undefined
      if (store?.user?.userId) {
        return Id.createFrom(store.user.userId)
      }
      return Id.createFrom(DEFAULT_MOCK_USER_ID)
    }

    // Get user ID from authenticated user (set by AuthMiddleware)
    const store = ctx.store as { user?: { userId: string } } | undefined
    const user = store?.user
    if (user?.userId) {
      return Id.createFrom(user.userId)
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
