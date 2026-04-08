import type { ClassConstructor } from '@OneJs/core'

type MiddlewareRef = Function | ClassConstructor

export function UseMiddleware(middleware: MiddlewareRef): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor as any

    if (!ctor.__meta) ctor.__meta = { routes: {} }
    if (!ctor.__meta.routes[propertyKey]) ctor.__meta.routes[propertyKey] = {}

    const existing = ctor.__meta.routes[propertyKey].middlewares || []
    ctor.__meta.routes[propertyKey].middlewares = [...existing, middleware]
  }
}
