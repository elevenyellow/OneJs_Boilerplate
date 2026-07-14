import { type ClassConstructor, ContainerProvider } from '@OneJs/core'
import type { AnyMiddleware } from '../middlewares/middleware.interface'

type MiddlewareClass = ClassConstructor & {
  __middlewareMethod?: string | symbol
}

export function useClassMiddleware(ClassRef: ClassConstructor) {
  const container = ContainerProvider.getContainer()
  const instance = container.get(ClassRef)
  const middlewareMethodName =
    (ClassRef as MiddlewareClass).__middlewareMethod || 'handle'
  const middlewareMethod = (instance as Record<string | symbol, unknown>)[
    middlewareMethodName
  ]

  if (typeof middlewareMethod !== 'function') {
    throw new Error(
      `Middleware class '${ClassRef.name}' must implement a method named 'handle' or decorated with @Middleware()`,
    )
  }

  return async (context: AnyMiddleware) => {
    await Promise.resolve(middlewareMethod.call(instance, context))
  }
}
