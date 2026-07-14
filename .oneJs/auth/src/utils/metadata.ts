// Utility to ensure route metadata exists and return it
type RouteMeta = {
  method?: string
  path?: string
  middlewares?: Function[]
  roles?: string[]
  [key: string]: unknown
}

// The class constructor carries route metadata that decorators attach at
// definition time; it is not part of the standard type of a decorator target.
type MetaCarrier = {
  __meta?: { routes?: Record<string, RouteMeta> }
}

export function ensureRouteMeta(
  target: object,
  propertyKey: string,
): RouteMeta {
  const ctor = (target as { constructor: MetaCarrier }).constructor

  ctor.__meta ??= { routes: {} }
  ctor.__meta.routes ??= {}
  ctor.__meta.routes[propertyKey] ??= {}

  return ctor.__meta.routes[propertyKey]
}
