/** Shape stamped onto a decorated class to record its Prisma model name. */
type ModelAnnotated = { __modelName?: string }

export function Model(name: string): ClassDecorator {
  return (target: Function) => {
    ;(target as unknown as ModelAnnotated).__modelName = name
  }
}
