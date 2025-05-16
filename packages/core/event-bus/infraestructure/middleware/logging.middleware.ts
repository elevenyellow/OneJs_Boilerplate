import type { Middleware } from '../../application/middleware'

export const LoggingMiddleware: Middleware = async (event, next) => {
  console.log(
    `Evento recibido: ${event.constructor.name} en ${event.occurredOn}`,
  )
  await next()
  console.log(`Evento procesado: ${event.constructor.name}`)
}
