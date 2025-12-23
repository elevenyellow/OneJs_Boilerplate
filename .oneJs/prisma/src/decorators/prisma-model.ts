export function Model(name: string): ClassDecorator {
  return (target: Function) => {
    ;(target as any).__modelName = name
  }
}
