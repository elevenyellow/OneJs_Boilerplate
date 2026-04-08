import { Entity as EntityBase } from './entity'
import { ValueObject as ValueObjectBase } from './value-object'

export function ValueObject(): ClassDecorator {
  return (target) => {
    if (!(target.prototype instanceof ValueObjectBase)) {
      throw new Error(
        `[OneJs] @ValueObject() — ${target.name} must extend ValueObjectBase`,
      )
    }
  }
}

export function Entity(): ClassDecorator {
  return (target) => {
    if (!(target.prototype instanceof EntityBase)) {
      throw new Error(
        `[OneJs] @Entity() — ${target.name} must extend EntityBase`,
      )
    }
    if (typeof target.prototype.toDto !== 'function') {
      throw new Error(
        `[OneJs] @Entity() — ${target.name} must implement toDto()`,
      )
    }
  }
}
