import type { Context } from 'elysia'
import { v4 as uuidv4 } from 'uuid'

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestIdMiddleware(ctx: Context) {
  const requestId = ctx.request.headers.get('x-request-id') || uuidv4()
  ctx.set.headers = ctx.set.headers || {}
  ctx.set.headers['x-request-id'] = requestId
  ;(ctx.store as any).requestId = requestId
}
