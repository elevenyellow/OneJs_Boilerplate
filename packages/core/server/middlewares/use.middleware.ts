import { useClassMiddleware } from '../utils'

export function UseMiddleware(middleware: any): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor

    // Asegura la estructura mínima en __meta
    if (!ctor.__meta) ctor.__meta = { routes: {} }
    if (!ctor.__meta.routes[propertyKey]) ctor.__meta.routes[propertyKey] = {}

    const existingMiddlewares =
      ctor.__meta.routes[propertyKey].middlewares || []

    // Detecta si es clase con método middleware (decorado o con `.handle`)
    const resolved =
      typeof middleware === 'function' && middleware.prototype
        ? useClassMiddleware(middleware)
        : middleware

    // Fusiona correctamente los middlewares sin sobrescribir rutas
    ctor.__meta.routes[propertyKey].middlewares = [
      ...existingMiddlewares,
      resolved,
    ]
  }
}
