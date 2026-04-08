import { Inject, Injectable } from '../container'
import { OneJsError, ErrorCodes, type ErrorCode } from '../errors'
import { Logger } from '../logger'
import { type AuthStrategy, type UserRole } from './types'
import { LocalJwtStrategy } from './strategies/local-jwt.strategy'
import { ClerkStrategy } from './strategies/clerk.strategy'
import { ConfigService } from '../config'

@Injectable()
export class AuthMiddleware {
  private strategy: AuthStrategy

  constructor(
    @Inject(ConfigService)
    configService: ConfigService,
    @Inject(LocalJwtStrategy)
    localStrategy: LocalJwtStrategy,
    @Inject(ClerkStrategy)
    clerkStrategy: ClerkStrategy,
    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    const authProvider = configService.get('AUTH_PROVIDER') || 'local'
    this.strategy = authProvider === 'clerk' ? clerkStrategy : localStrategy
  }

  async handle(context: {
    request: { headers: { get: (arg0: string) => any } }
    set: { status: number }
    store: {
      user?: any
    }
  }, requiredRoles?: (UserRole | string)[]) {
    const header = context.request.headers.get('authorization')

    if (!header?.startsWith('Bearer ')) {
      context.set.status = 401
      throw new OneJsError(
        'Unauthorized',
        401,
        'Bearer token is required',
        { header },
        ErrorCodes.AUTH_MISSING as ErrorCode,
      )
    }

    const token = header.replace('Bearer ', '')

    try {
      const user = await this.strategy.validate(token)
      
      // Check roles if required
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(user.role)) {
          context.set.status = 403
          throw new OneJsError(
            'Forbidden',
            403,
            'You do not have the required role to access this resource',
            { requiredRoles, userRole: user.role },
            ErrorCodes.AUTH_INVALID as ErrorCode, // Should probably be a FORBIDDEN code if exists
          )
        }
      }

      context.store.user = user
    } catch (err: any) {
      if (err instanceof OneJsError) {
        throw err
      }

      if (process.env.NODE_ENV === 'development') {
        this.logger.error('oneJs:auth', `Invalid token: ${err}`)
      }

      context.set.status = 401
      throw new OneJsError(
        'Unauthorized',
        401,
        err.message || 'Token is invalid or expired',
        { token },
        ErrorCodes.AUTH_INVALID as ErrorCode,
      )
    }
  }
}
