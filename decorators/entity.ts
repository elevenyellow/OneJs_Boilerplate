import { registerEntity } from '../utils/registry'
import { Collection } from './collection'

interface EntityOptions {
  name: string
  scope?: 'singleton' | 'transient'
  schema?: Record<string, any> // futuro uso: validación, migraciones
}

export function Entity(options: EntityOptions): ClassDecorator {
  return (target) => {
    // Aplicar el decorador @Collection que ya registra en el contenedor
    Collection(options.name, options.scope)(target)

    // Guardar metadata adicional para futuras funcionalidades (esquema, migración, etc.)
    const ctor = target as any

    ctor.__entityMeta = {
      name: options.name,
      schema: options.schema ?? {},
    }

    registerEntity(options.name, ctor)
  }
}
