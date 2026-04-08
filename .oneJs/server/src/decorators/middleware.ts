export function Middleware(): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor as any
    ctor.__middlewareMethod = propertyKey
  }
}
