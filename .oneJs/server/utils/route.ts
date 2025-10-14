import { setHandlerMetadata } from './route-metadata'

export function Route(
  method: string,
  path: string,
  version?: string,
): MethodDecorator {
  return (target, propertyKey) => {
    setHandlerMetadata(target.constructor, propertyKey, {
      method,
      path: path.startsWith('/') ? path : `/${path}`,
      version: version ? `/${version.replace(/^\//, '')}` : undefined,
    })
  }
}
