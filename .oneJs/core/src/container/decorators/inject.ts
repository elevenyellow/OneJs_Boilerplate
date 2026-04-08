import { metadataRegistry } from '../metadata-registry'

export type ServiceToken = string | symbol | (new (...args: any[]) => unknown)

export function Inject(token: ServiceToken): ParameterDecorator {
  return (target, _propertyKey, index) => {
    metadataRegistry.registerParamType(target as any, index, token)
  }
}
