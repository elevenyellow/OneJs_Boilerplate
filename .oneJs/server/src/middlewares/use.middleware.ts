export function UseMiddleware(middleware: any): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor

    if (!ctor.__meta) ctor.__meta = { routes: {} }
    if (!ctor.__meta.routes[propertyKey]) ctor.__meta.routes[propertyKey] = {}

    const existing = ctor.__meta.routes[propertyKey].middlewares || []

    // 🔧 No resuelve, solo registra la clase o función tal cual
    ctor.__meta.routes[propertyKey].middlewares = [...existing, middleware]
  }
}
