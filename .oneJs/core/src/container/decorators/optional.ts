import { metadataRegistry } from '../metadata-registry'
import type { Fallback } from '../types'

export function Optional(fallback?: Fallback): ParameterDecorator {
  return (target, _propertyKey, index) => {
    metadataRegistry.registerParamOptional(target as any, index, fallback)
  }
}
