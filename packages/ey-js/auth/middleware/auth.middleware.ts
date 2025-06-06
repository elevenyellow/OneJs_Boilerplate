import { EyJsError, Injectable, type ElysiaContext } from '@EyJs'
import { verifyToken } from '@clerk/backend'
import { ErrorCodes } from '../../shared-errors'

@Injectable()
export class ClerkAuthMiddleware {
  async handle(context: ElysiaContext) {
    const header = context.request.headers.get('authorization')

    if (!header?.startsWith('Bearer ')) {
      context.set.status = 401

      throw new EyJsError(
        'Unauthorized',
        401,
        'Bearer token is required',
        { header: null },
        ErrorCodes.AUTH_MISSING,
      )
    }

    const token = header.replace('Bearer ', '')

    try {
      const payload = await verifyToken(token, {
        issuer: 'https://api.clerk.dev',
        audience: 'YOUR_FRONTEND_API_KEY', // Clerk dashboard → API Keys → Frontend API
      })

      return {
        userId: payload.sub,
        email: payload.email,
        clerkUser: payload,
      }
    } catch {
      context.set.status = 401

      throw new EyJsError(
        'Unauthorized',
        401,
        'Bearer token is required',
        { header: null },
        ErrorCodes.AUTH_MISSING,
      )
    }
  }
}
