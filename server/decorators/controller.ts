import { container, type ClassConstructor } from '../../container'
import { getControllerMeta } from '../utils/route-metadata'
import { registerController } from './register-controller'

export function Controller(path: string, version?: string): ClassDecorator {
  return (target) => {
    const ctor = target as ClassConstructor<any>

    // Registrar metadatos base
    const meta = getControllerMeta(ctor)
    meta.path = path
    if (version) meta.version = version

    // Registrar el controlador en el contenedor
    container.register(ctor, 'singleton')
    registerController(ctor) // ✅ guarda en la lista
  }
}
