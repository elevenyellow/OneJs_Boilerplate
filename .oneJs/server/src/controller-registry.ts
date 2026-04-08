import type { ClassConstructor } from '@OneJs/core'

const controllerRegistry = new Set<ClassConstructor>()

export function registerController(ctor: ClassConstructor) {
  controllerRegistry.add(ctor)
}

export function getAllControllers(): ClassConstructor[] {
  return Array.from(controllerRegistry)
}

export function clearControllers() {
  controllerRegistry.clear()
}
