import { registerController } from './register-controller'
import { getControllerMeta } from '../utils/route-metadata'
import type { ClassConstructor } from '../../container'
import { metadataRegistry } from '../../container/metadata-registry'

export function Controller(path: string, version?: string): ClassDecorator {
  return (target) => {
    const ctor = target as unknown as ClassConstructor<any>

    const meta = getControllerMeta(ctor)
    meta.path = path
    if (version) meta.version = version

    // ✅ Registrar como servicio injectable para el contenedor
    metadataRegistry.registerService(ctor, 'singleton', false)

    // ✅ Registrar como controlador (para rutas)
    registerController(ctor)
  }
}
