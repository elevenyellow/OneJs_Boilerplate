export interface PopulateMetadata {
  field: string
  collectionName: string
  many?: boolean
  foreignField?: string
}

export function Populate(
  options: Omit<PopulateMetadata, 'field'>,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const ctor = target.constructor as any
    ctor.__populateMeta = ctor.__populateMeta || []
    ctor.__populateMeta.push({
      ...options,
      field: propertyKey.toString(),
    })
  }
}
