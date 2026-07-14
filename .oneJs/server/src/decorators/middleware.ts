type MiddlewareTarget = {
  constructor: { __middlewareMethod?: string | symbol }
}

export function Middleware(): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (target as MiddlewareTarget).constructor
    ctor.__middlewareMethod = propertyKey
  }
}
