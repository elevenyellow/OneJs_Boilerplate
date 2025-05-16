import type { Middleware } from '../../application/middleware'

export const LoggingMiddleware: Middleware = async (event, next) => {
  console.log(
    `Event received: ${event.constructor.name} at ${event.occurredOn}`,
  )
  await next()
  console.log(`Event processed: ${event.constructor.name}`)
}
