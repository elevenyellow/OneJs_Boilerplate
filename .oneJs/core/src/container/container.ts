import type { ClassConstructor } from '../types'
import type { ParamInfo, Scope, ServiceMetadata } from './metadata-registry'

export class Container {
  private services = new Map<ClassConstructor, ServiceMetadata>()
  private aliases = new Map<unknown, ClassConstructor>()
  private instances = new Map<ClassConstructor, unknown>()
  private tokenInstances = new Map<unknown, unknown>()
  private resolutionStack = new Set<ClassConstructor>()

  register<T>(
    ctor: ClassConstructor<T>,
    scope: Scope = 'singleton',
    autorun: boolean = false,
    params: ParamInfo[] = [],
  ): void {
    if (this.services.has(ctor)) return
    this.services.set(ctor, { constructor: ctor, scope, autorun, params })
  }

  registerClass<T>(
    ctor: ClassConstructor<T>,
    options?: { scope?: Scope; params?: ParamInfo[] },
  ): void {
    this.register(
      ctor,
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

  get<T>(ctor: ClassConstructor<T>): T {
    return this.resolve(ctor)
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

  private resolve<T>(ctor: ClassConstructor<T>): T {
    this.guardCyclicDependency(ctor)

    const metadata = this.getMetadataOrThrow(ctor)

    if (metadata.scope === 'singleton' && this.instances.has(ctor)) {
      return this.instances.get(ctor) as T
    }

    this.resolutionStack.add(ctor)
    try {
      const instance = this.instantiate(metadata)
      if (metadata.scope === 'singleton') {
        this.instances.set(ctor, instance)
      }
      return instance as T
    } finally {
      this.resolutionStack.delete(ctor)
    }
  }

  private guardCyclicDependency(ctor: ClassConstructor): void {
    if (this.resolutionStack.has(ctor)) {
      throw new Error(`Cyclic dependency detected for type: ${ctor.name}`)
    }
  }

  private getMetadataOrThrow(ctor: ClassConstructor): ServiceMetadata {
    const metadata = this.services.get(ctor)
    if (!metadata) {
      throw new Error(`No service registered for type: ${ctor.name}`)
    }
    return metadata
  }

  private instantiate(metadata: ServiceMetadata): unknown {
    const args = metadata.params.map((param) =>
      this.resolveParam(param, metadata.constructor),
    )
    return new metadata.constructor(...(args as never[]))
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

    const typeName =
      typeof param.type === 'function' ? param.type.name : String(param.type)
    throw new Error(
      `Missing required dependency '${typeName}' for '${owner.name}' at index ${param.index}`,
    )
  }

  private resolveToken(token: unknown): ClassConstructor | null {
    if (this.services.has(token as ClassConstructor))
      return token as ClassConstructor
    return this.aliases.get(token) ?? null
  }
}

export const container = new Container()
