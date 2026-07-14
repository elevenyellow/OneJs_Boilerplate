import { AuthMiddleware } from '../auth.middleware'
import { ensureRouteMeta } from '../utils/metadata'

export function UseAuth() {
  return function (target: object, propertyKey: string) {
    const routeMeta = ensureRouteMeta(target, propertyKey)
    routeMeta.middlewares ??= []
    routeMeta.middlewares.push(AuthMiddleware)
  }
}
