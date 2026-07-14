import {
  ConfigService,
  type ErrorCode,
  ErrorCodes,
  Inject,
  Injectable,
  OneJsError,
} from '@OneJs/core'
import { verifyToken } from '@clerk/backend'
import { type AuthStrategy, type AuthUser, UserRoles } from '../types'

@Injectable()
export class ClerkStrategy implements AuthStrategy {
  private frontendApiKey: string
  private secretKey: string

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.frontendApiKey = configService.get('CLERK_FRONTEND_API_KEY')!
    this.secretKey = configService.get('CLERK_SECRET_KEY')!
  }

  async validate(token: string): Promise<AuthUser> {
    try {
      const payload = await verifyToken(token, {
        audience: this.frontendApiKey,
        secretKey: this.secretKey,
      })

      // Clerk roles can be mapped from metadata or publicMetadata
      // For now, we default to USER or check a specific metadata field
      const role =
        ((payload.publicMetadata as { role?: string } | undefined)
          ?.role as string) || UserRoles.USER

      return {
        userId: payload.sub,
        email: payload.email as string,
        role,
        payload,
      }
    } catch (_err) {
      throw new OneJsError(
        'Unauthorized',
        401,
        'Token is invalid or expired',
        { token },
        ErrorCodes.AUTH_INVALID as ErrorCode,
      )
    }
  }
}
