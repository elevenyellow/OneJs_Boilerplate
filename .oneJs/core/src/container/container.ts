import type { ClassConstructor } from '../types'
import type { ParamInfo, Scope, ServiceMetadata } from './metadata-registry'

export class Container {
  private services = new Map<ClassConstructor, ServiceMetadata>()
  private aliases = new Map<unknown, ClassConstructor>()
  private instances = new Map<ClassConstructor, unknown>()
  private tokenInstances = new Map<unknown, unknown>()
  private resolutionStack = new Set<ClassConstructor>()

  register<T>(
    constructor: ClassConstructor<T>,
    scope: Scope = 'singleton',
    autorun: boolean = false,
    params: ParamInfo[] = [],
  ): void {
    if (this.services.has(constructor)) return
    this.services.set(constructor, { constructor, scope, autorun, params })
  }

  registerClass<T>(
    constructor: ClassConstructor<T>,
    options?: { scope?: Scope; params?: ParamInfo[] },
  ): void {
    this.register(
      constructor,
      options?.scope ?? 'singleton',
      false,
      options?.params ?? [],
    )
  }

  registerAlias(abstractKey: unknown, concreteClass: ClassConstructor): void {
    this.aliases.set(abstractKey, concreteClass)
  }

  registerInstance(token: unknown, instance: unknown): void {
    this.tokenInstances.set(token, instance)
  }

  get<T>(constructor: ClassConstructor<T>): T {
    return this.resolve(constructor)
  }

  getAllServices(): unknown[] {
    return Array.from(this.instances.values())
  }

  clear(): void {
    this.services.clear()
    this.aliases.clear()
    this.instances.clear()
    this.tokenInstances.clear()
    this.resolutionStack.clear()
  }

  private resolve<T>(constructor: ClassConstructor<T>): T {
    this.guardCyclicDependency(constructor)

    const metadata = this.getMetadataOrThrow(constructor)

    if (metadata.scope === 'singleton' && this.instances.has(constructor)) {
      return this.instances.get(constructor) as T
    }

    this.resolutionStack.add(constructor)
    try {
      const instance = this.instantiate(metadata)
      if (metadata.scope === 'singleton') {
        this.instances.set(constructor, instance)
      }
      return instance as T
    } finally {
      this.resolutionStack.delete(constructor)
    }
  }

  private guardCyclicDependency(constructor: ClassConstructor): void {
    if (this.resolutionStack.has(constructor)) {
      throw new Error(
        `Cyclic dependency detected for type: ${constructor.name}`,
      )
    }
  }

  private getMetadataOrThrow(constructor: ClassConstructor): ServiceMetadata {
    const metadata = this.services.get(constructor)
    if (!metadata) {
      throw new Error(`No service registered for type: ${constructor.name}`)
    }
    return metadata
  }

  private instantiate(metadata: ServiceMetadata): unknown {
    const args = metadata.params.map((param) =>
      this.resolveParam(param, metadata.constructor),
    )
    return new metadata.constructor(...args)
  }

  private resolveParam(param: ParamInfo, owner: ClassConstructor): unknown {
    if (!param?.type) return undefined

    if (this.tokenInstances.has(param.type)) {
      return this.tokenInstances.get(param.type)
    }

    const resolved = this.resolveToken(param.type)
    if (resolved) return this.resolve(resolved)

    if (param.optional) {
      return typeof param.fallback === 'function'
        ? param.fallback()
        : param.fallback
    }

    throw new Error(
      `Missing required dependency '${param.type?.name}' for '${owner.name}' at index ${param.index}`,
    )
  }

  private resolveToken(token: unknown): ClassConstructor | null {
    if (this.services.has(token as ClassConstructor))
      return token as ClassConstructor
    return this.aliases.get(token) ?? null
  }
}

export const container = new Container()
