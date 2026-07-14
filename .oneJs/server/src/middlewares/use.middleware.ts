import type { ClassConstructor } from '@OneJs/core'

type MiddlewareRef = Function | ClassConstructor
type RouteMeta = { middlewares?: MiddlewareRef[] }
type RouteMetadataTarget = Function & {
  __meta?: { routes: Record<string | symbol, RouteMeta> }
}

export function UseMiddleware(middleware: MiddlewareRef): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor as RouteMetadataTarget

    if (!ctor.__meta) ctor.__meta = { routes: {} }
    if (!ctor.__meta.routes[propertyKey]) ctor.__meta.routes[propertyKey] = {}

    const existing = ctor.__meta.routes[propertyKey].middlewares || []
    ctor.__meta.routes[propertyKey].middlewares = [...existing, middleware]
  }
}
