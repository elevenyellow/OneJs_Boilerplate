import { setHandlerMetadata } from '../utils/route-metadata'

export function Raw(): MethodDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    setHandlerMetadata(target.constructor, propertyKey, { raw: true })
  }
}
