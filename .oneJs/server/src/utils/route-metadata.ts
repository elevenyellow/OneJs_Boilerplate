import type { ClassConstructor } from '@OneJs/core'

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

type ControllerLike = (ClassConstructor | Function) & {
  __meta?: ControllerMeta
}

export function getControllerMeta(ctor: ControllerLike): ControllerMeta {
  ctor.__meta = ctor.__meta || { routes: {} }
  return ctor.__meta
}

export function setHandlerMetadata(
  ctor: ControllerLike,
  handlerName: string | symbol,
  data: Partial<RouteMeta>,
) {
  const meta = getControllerMeta(ctor)
  const route = meta.routes[handlerName] || {}
  meta.routes[handlerName] = { ...route, ...data }
}
