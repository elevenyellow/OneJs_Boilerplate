// export function UseMiddleware(
//   middlewareClass: ClassConstructor,
// ): ClassDecorator & MethodDecorator {
//   return (target: any, propertyKey?: string | symbol) => {
//     const entry = { useClass: middlewareClass }

//     if (propertyKey) {
//       const ctor = target.constructor as any
//       ctor.__meta = ctor.__meta || {}
//       ctor.__meta.routes = ctor.__meta.routes || []

//       const route = ctor.__meta.routes.find(
//         (r: any) => r.handlerName === propertyKey,
//       )
//       if (route) {
//         route.middlewares = [...(route.middlewares || []), entry]
//       } else {
//         ctor.__pendingMiddlewares = ctor.__pendingMiddlewares || new Map()
//         const list = ctor.__pendingMiddlewares.get(propertyKey) || []
//         ctor.__pendingMiddlewares.set(propertyKey, [...list, entry])
//       }
//     } else {
//       const ctor = target as any
//       ctor.__meta = ctor.__meta || {}
//       ctor.__meta.classMiddlewares = [
//         ...(ctor.__meta.classMiddlewares || []),
//         entry,
//       ]
//     }
//   }
// }
