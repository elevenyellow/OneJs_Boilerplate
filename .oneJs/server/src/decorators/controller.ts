import type { ClassConstructor } from '../../../core/src'
import { metadataRegistry } from '../../../core/src'
import { registerController } from '../controller-registry'
import { getControllerMeta } from '../utils/route-metadata'

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
