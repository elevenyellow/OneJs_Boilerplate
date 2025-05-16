import { container, type ClassConstructor } from '@EyJs'

export function Collection(
  name: string,
  scope: 'singleton' | 'transient' = 'singleton',
): ClassDecorator {
  return (target: Function) => {
    const ctor = target as ClassConstructor
    ;(ctor as any).__collectionName = name

    container.register(ctor, scope)
  }
}
