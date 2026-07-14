import { metadataRegistry } from '../metadata-registry'
import type { ClassConstructor, Fallback } from '../types'

export function Optional(fallback?: Fallback): ParameterDecorator {
  return (target, _propertyKey, index) => {
    metadataRegistry.registerParamOptional(
      target as ClassConstructor,
      index,
      fallback,
    )
  }
}
