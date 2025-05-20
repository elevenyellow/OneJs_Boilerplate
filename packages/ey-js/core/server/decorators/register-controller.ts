const controllerRegistry: any[] = []

export function registerController(ctor: any) {
  controllerRegistry.push(ctor)
}

export function getAllControllers() {
  return [...controllerRegistry]
}
