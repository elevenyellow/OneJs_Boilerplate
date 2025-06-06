import {
  ConfigService,
  EyJsError,
  Inject,
  Injectable,
  Logger,
  type ElysiaContext,
} from '@EyJs'
import { verifyToken } from '@clerk/backend'
import { ErrorCodes } from '../../shared-errors'

@Injectable()
export class ClerkAuthMiddleware {
  private frontendApiKey: string
  private secretKey: string;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    this.frontendApiKey = configService.get('CLERK_FRONTEND_API_KEY')!
    this.secretKey = configService.get('CLERK_SECRET_KEY')!

    if (!this.frontendApiKey || !this.secretKey) {
      throw new EyJsError(
        'Clerk configuration missing',
        500,
        'CLERK_FRONTEND_API_KEY or CLERK_SECRET_KEY is not set',
        undefined,
        ErrorCodes.SERVER_ERROR,
      )
    }
  }

  async handle(context: ElysiaContext) {
    const header = context.request.headers.get('authorization')

    if (!header?.startsWith('Bearer ')) {
      context.set.status = 401
      throw new EyJsError(
        'Unauthorized',
        401,
        'Bearer token is required',
        { header },
        ErrorCodes.AUTH_MISSING,
      )
    }

    const token = header.replace('Bearer ', '')

    try {
      const payload = await verifyToken(token, {
        audience: this.frontendApiKey,
        secretKey: this.secretKey,
      })

      context.store.user = {
        userId: payload.sub,
        email: payload.email,
        payload,
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.error(`[ClerkAuthMiddleware] Invalid token: ${err}`)
      }

      context.set.status = 401
      throw new EyJsError(
        'Unauthorized',
        401,
        'Token is invalid or expired',
        { token },
        ErrorCodes.AUTH_INVALID,
      )
    }
  }
}
