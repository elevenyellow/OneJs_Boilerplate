import { metadataRegistry } from '../metadata-registry'
import type { ClassConstructor } from '../types'

export type ServiceToken = string | symbol | ClassConstructor

export function Inject(token: ServiceToken): ParameterDecorator {
  return (target, _propertyKey, index) => {
    metadataRegistry.registerParamType(target as ClassConstructor, index, token)
  }
}
