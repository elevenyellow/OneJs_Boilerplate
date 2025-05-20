import { container } from '../../container'

export function useClassMiddleware(ClassRef: any) {
  const instance = container.get(ClassRef)
  const ctor = ClassRef as any

  // Determinar el nombre del método middleware
  const middlewareMethodName = ctor.__middlewareMethod || 'handle'

  const middlewareMethod = instance[middlewareMethodName]

  if (typeof middlewareMethod !== 'function') {
    throw new Error(
      `Middleware class '${ClassRef.name}' must implement a method named 'handle' or decorated with @Middleware()`,
    )
  }

  const isAsync = middlewareMethod.constructor.name === 'AsyncFunction'

  return isAsync
    ? (req, res, next) =>
        Promise.resolve(middlewareMethod.call(instance, req, res, next)).catch(
          next,
        )
    : middlewareMethod.bind(instance)
}
