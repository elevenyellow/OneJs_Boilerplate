import type { ClassConstructor } from '../types'
import type { ParamInfo, Scope, ServiceMetadata } from './metadata-registry'

export class Container {
  private services = new Map<ClassConstructor, ServiceMetadata>()
  private aliases = new Map<unknown, ClassConstructor>()
  private instances = new Map<ClassConstructor, unknown>()
  private tokenInstances = new Map<unknown, unknown>()
  private resolutionStack = new Set<ClassConstructor>()

  register<T>(
    serviceCtor: ClassConstructor<T>,
    scope: Scope = 'singleton',
    autorun: boolean = false,
    params: ParamInfo[] = [],
  ): void {
    if (this.services.has(serviceCtor)) return
    this.services.set(serviceCtor, {
      constructor: serviceCtor,
      scope,
      autorun,
      params,
    })
  }

  registerClass<T>(
    serviceCtor: ClassConstructor<T>,
    options?: { scope?: Scope; params?: ParamInfo[] },
  ): void {
    this.register(
      serviceCtor,
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

  get<T>(serviceCtor: ClassConstructor<T>): T {
    return this.resolve(serviceCtor)
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

  private resolve<T>(serviceCtor: ClassConstructor<T>): T {
    this.guardCyclicDependency(serviceCtor)

    const metadata = this.getMetadataOrThrow(serviceCtor)

    if (metadata.scope === 'singleton' && this.instances.has(serviceCtor)) {
      return this.instances.get(serviceCtor) as T
    }

    this.resolutionStack.add(serviceCtor)
    try {
      const instance = this.instantiate(metadata)
      if (metadata.scope === 'singleton') {
        this.instances.set(serviceCtor, instance)
      }
      return instance as T
    } finally {
      this.resolutionStack.delete(serviceCtor)
    }
  }

  private guardCyclicDependency(serviceCtor: ClassConstructor): void {
    if (this.resolutionStack.has(serviceCtor)) {
      throw new Error(
        `Cyclic dependency detected for type: ${serviceCtor.name}`,
      )
    }
  }

  private getMetadataOrThrow(serviceCtor: ClassConstructor): ServiceMetadata {
    const metadata = this.services.get(serviceCtor)
    if (!metadata) {
      throw new Error(`No service registered for type: ${serviceCtor.name}`)
    }
    return metadata
  }

  private instantiate(metadata: ServiceMetadata): unknown {
    const args = metadata.params.map((param) =>
      this.resolveParam(param, metadata.constructor),
    )
    const serviceCtor = metadata.constructor as new (
      ...args: unknown[]
    ) => unknown
    return new serviceCtor(...args)
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

    const dependencyName =
      typeof param.type === 'function' ? param.type.name : String(param.type)
    throw new Error(
      `Missing required dependency '${dependencyName}' for '${owner.name}' at index ${param.index}`,
    )
  }

  private resolveToken(token: unknown): ClassConstructor | null {
    if (this.services.has(token as ClassConstructor))
      return token as ClassConstructor
    return this.aliases.get(token) ?? null
  }
}

export const container = new Container()
