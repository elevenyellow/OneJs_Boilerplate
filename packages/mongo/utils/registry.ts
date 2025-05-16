// mongo/entity-registry.ts
const entityRegistry = new Map<string, any>()

export function registerEntity(name: string, model: any) {
  entityRegistry.set(name, model)
}

export function getEntityModel(name: string): any {
  return entityRegistry.get(name)
}
