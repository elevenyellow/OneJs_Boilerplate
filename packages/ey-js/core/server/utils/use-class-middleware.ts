import { container } from '../../container'
import type { ElysiaContext } from '../middlewares/middleware.interface'

export function useClassMiddleware(ClassRef: any) {
  const instance = container.get(ClassRef)
  const ctor = ClassRef as any

  // Determine middleware method name
  const middlewareMethodName = ctor.__middlewareMethod || 'handle'

  const middlewareMethod = instance[middlewareMethodName]

  if (typeof middlewareMethod !== 'function') {
    throw new Error(
      `Middleware class '${ClassRef.name}' must implement a method named 'handle' or decorated with @Middleware()`,
    )
  }

  return async (context: ElysiaContext) => {
    try {
      await Promise.resolve(middlewareMethod.call(instance, context))
    } catch (error) {
      throw error
    }
  }
}
