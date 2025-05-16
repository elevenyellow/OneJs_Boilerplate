interface RefOptions {
  collection: string
  many?: boolean
  foreignField?: string
  localField?: string
}

function defineRef(options: RefOptions): PropertyDecorator {
  return (target, propertyKey) => {
    const modelClass = target.constructor as any

    modelClass.__populateMeta = modelClass.__populateMeta || []

    modelClass.__populateMeta.push({
      field: propertyKey.toString(),
      collectionName: options.collection,
      many: options.many ?? false,
      foreignField: options.foreignField ?? '_id',
      localField: options.localField,
    })
  }
}

// 👇 Todos aceptan string o RefOptions, igual que OneToMany

export const Ref = (
  collectionOrOptions: string | RefOptions,
): PropertyDecorator => {
  const options =
    typeof collectionOrOptions === 'string'
      ? { collection: collectionOrOptions }
      : collectionOrOptions
  return defineRef(options)
}

export const OneToOne = (
  collectionOrOptions: string | RefOptions,
): PropertyDecorator => {
  const options =
    typeof collectionOrOptions === 'string'
      ? { collection: collectionOrOptions, many: false }
      : { ...collectionOrOptions, many: false }
  return defineRef(options)
}

export const OneToMany = (
  collectionOrOptions: string | RefOptions,
  maybeForeignField?: string,
): PropertyDecorator => {
  const options =
    typeof collectionOrOptions === 'string'
      ? {
          collection: collectionOrOptions,
          many: true,
          foreignField: maybeForeignField,
        }
      : { ...collectionOrOptions, many: true }
  return defineRef(options)
}

export const ManyToOne = (
  collectionOrOptions: string | RefOptions,
): PropertyDecorator => {
  const options =
    typeof collectionOrOptions === 'string'
      ? { collection: collectionOrOptions, many: false }
      : { ...collectionOrOptions, many: false }
  return defineRef(options)
}

export const ManyToMany = (
  collectionOrOptions: string | RefOptions,
): PropertyDecorator => {
  const options =
    typeof collectionOrOptions === 'string'
      ? { collection: collectionOrOptions, many: true }
      : { ...collectionOrOptions, many: true }
  return defineRef(options)
}
