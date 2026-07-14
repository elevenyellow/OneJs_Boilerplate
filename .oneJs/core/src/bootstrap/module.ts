import type { ClassConstructor } from '../container/types'
import { hasRole, type ModuleRole } from '../markers'
import { BootstrapBase } from './bootstrap-base'

export interface ModuleOptions {
  controllers?: ClassConstructor[]
  handlers?: ClassConstructor<{ handle(...args: never[]): unknown }>[]
  providers?: ClassConstructor[]
  middlewares?: ClassConstructor[]
  repositories?: ClassConstructor[]
  bootstrap?: ClassConstructor<BootstrapBase>[]
}

interface ModuleMeta {
  target: ClassConstructor
  options: ModuleOptions
}

const moduleStore: ModuleMeta[] = []

const VALIDATION_RULES: Record<string, { role: ModuleRole; label: string }> = {
  controllers: { role: 'controller', label: '@Controller' },
  handlers: { role: 'handler', label: '@EventHandler' },
  providers: { role: 'provider', label: '@Injectable' },
  middlewares: { role: 'provider', label: '@Injectable' },
  repositories: { role: 'provider', label: '@Injectable' },
}

const EVENT_HANDLER_MARKER = Symbol.for('onejs.handler')

function hasEventHandlerMarker(ctor: ClassConstructor): boolean {
  return Boolean(
    (ctor as ClassConstructor & { [EVENT_HANDLER_MARKER]?: true })[
      EVENT_HANDLER_MARKER
    ],
  )
}

function validateModuleOptions(
  moduleName: string,
  options: ModuleOptions,
): void {
  for (const [key, rule] of Object.entries(VALIDATION_RULES)) {
    const classes = options[key as keyof ModuleOptions] as
      | ClassConstructor[]
      | undefined
    if (!classes) continue

    for (const ctor of classes) {
      if (
        !hasRole(ctor, rule.role) &&
        !(rule.role === 'handler' && hasEventHandlerMarker(ctor))
      ) {
        throw new Error(
          `[Module ${moduleName}] "${ctor.name}" was declared in "${key}" but is not decorated with ${rule.label}`,
        )
      }
    }
  }

  if (options.bootstrap) {
    for (const ctor of options.bootstrap) {
      if (!(ctor.prototype instanceof BootstrapBase)) {
        throw new Error(
          `[Module ${moduleName}] "${ctor.name}" was declared in "bootstrap" but does not extend BootstrapBase`,
        )
      }
    }
  }
}

export function Module(options: ModuleOptions = {}): ClassDecorator {
  return (target: Function): void => {
    validateModuleOptions(target.name, options)
    moduleStore.push({ target: target as ClassConstructor, options })
  }
}

export function getAllModules(): ModuleMeta[] {
  return [...moduleStore]
}

export function clearModules(): void {
  moduleStore.length = 0
}
