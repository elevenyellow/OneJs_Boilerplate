type ClassConstructor<T = any> = {
  new (...args: any[]): T
}

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
