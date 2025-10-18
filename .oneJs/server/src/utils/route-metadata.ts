// utils/route-metadata.ts

type RouteMeta = {
  method?: string
  path?: string
  version?: string
  middlewares?: Function[]
  raw?: boolean
  jwt?: boolean
}

type ControllerMeta = {
  path?: string
  version?: string
  routes: Record<string | symbol, RouteMeta>
}

export function getControllerMeta(ctor: any): ControllerMeta {
  ctor.__meta = ctor.__meta || { routes: {} }
  return ctor.__meta
}

export function setHandlerMetadata(
  ctor: any,
  handlerName: string | symbol,
  data: Partial<RouteMeta>,
) {
  const meta = getControllerMeta(ctor)
  const route = meta.routes[handlerName] || {}
  meta.routes[handlerName] = { ...route, ...data }
}
