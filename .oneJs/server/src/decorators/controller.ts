import { metadataRegistry, markAs, type ClassConstructor } from '@OneJs/core'
import { registerController } from '../controller-registry'
import { getControllerMeta } from '../utils/route-metadata'

export function Controller(path: string, version?: string): ClassDecorator {
  return (target) => {
    const ctor = target as unknown as ClassConstructor<any>

    const meta = getControllerMeta(ctor)
    meta.path = path
    if (version) meta.version = version

    metadataRegistry.registerService(ctor, 'singleton', false)
    markAs(ctor, 'controller')
    registerController(ctor)
  }
}
