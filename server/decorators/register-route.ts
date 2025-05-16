export function registerRoute(
  method: string,
  path: string,
  version?: string,
): MethodDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const ctor = target.constructor as { __meta?: any }
    ctor.__meta = ctor.__meta || {}
    ctor.__meta.routes = ctor.__meta.routes || []

    const isRaw = ctor.__meta.__rawFlags?.has(propertyKey) || false

    console.log({ isRaw })
    ctor.__meta.routes.push({
      method,
      path: path.startsWith('/') ? path : `/${path}`,
      version: version ? `/${version.replace(/^\//, '')}` : undefined,
      handlerName: propertyKey,
      middlewares: [],
      raw: isRaw,
    })
  }
}
