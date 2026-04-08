// Utility to ensure route metadata exists and return it
type RouteMeta = {
  method?: string
  path?: string
  middlewares?: Function[]
  roles?: string[]
  [key: string]: any
}

export function ensureRouteMeta(target: any, propertyKey: string): RouteMeta {
  if (!target.constructor.__meta) {
    target.constructor.__meta = { routes: {} }
  }

  const meta = target.constructor.__meta
  meta.routes ??= {}
  meta.routes[propertyKey] ??= {}

  return meta.routes[propertyKey]
}

