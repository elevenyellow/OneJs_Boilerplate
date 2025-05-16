export function Middleware(): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor

    // Guardamos el nombre del método en el constructor para luego accederlo en useClassMiddleware
    ctor.__middlewareMethod = propertyKey
  }
}
