import { AuthMiddleware } from '../auth.middleware'

export function UseAuth() {
  return function (target: any, propertyKey: string) {
    if (!target.constructor.__meta) {
      target.constructor.__meta = { routes: {} }
    }

    const meta = target.constructor.__meta
    meta.routes ??= {}
    meta.routes[propertyKey] ??= {}

    meta.routes[propertyKey].middlewares ??= []
    meta.routes[propertyKey].middlewares.push(AuthMiddleware)
  }
}
