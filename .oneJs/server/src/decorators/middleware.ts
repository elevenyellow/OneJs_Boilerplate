type MiddlewareTarget = Function & { __middlewareMethod?: string | symbol }

export function Middleware(): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor as MiddlewareTarget
    ctor.__middlewareMethod = propertyKey
  }
}
