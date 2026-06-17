import {
  ConfigService,
  ErrorCodes,
  Inject,
  Injectable,
  OneJsError,
} from '@OneJs/core'
import jwt from 'jsonwebtoken'
import { type AuthStrategy, type AuthUser, UserRoles } from '../types'

@Injectable()
export class LocalJwtStrategy implements AuthStrategy {
  private secret: string

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.secret = configService.get('JWT_SECRET') || 'default_secret'
  }

  async validate(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, this.secret) as any

      return {
        userId: decoded.sub || decoded.id,
        email: decoded.email,
        role: decoded.role || UserRoles.USER,
        payload: decoded,
      }
    } catch (err) {
      throw new OneJsError(
        'Unauthorized',
        401,
        'Invalid or expired local token',
        undefined,
        ErrorCodes.AUTH_INVALID as any,
      )
    }
  }
}
